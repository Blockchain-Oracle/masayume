// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool} from "../interfaces/IDreamDex.sol";
import {IOracleHub} from "../interfaces/IOracleHub.sol";
import {ParlayMath} from "../parlay/ParlayMath.sol";
import {IRangeReserve} from "./IRangeReserve.sol";
import {RangeMath} from "./RangeMath.sol";
import {WindowQuestion} from "./WindowQuestion.sol";

/// @title The reserve's seams to DreamDEX and to the OracleHub, and its tunables.
/// @notice A band is priced from three things the chain holds: the Window's opening print (the hub's
///         answer to the closing question at `tradingStart`, found through the hub's content-addressed
///         key), where the market sits now (P(close ≥ open) off the Window's resting book, as the parlay
///         reads it), and the house's realized-volatility parameter for the asset over the seconds left.
///         The reference's venue priced bands with its own model (`ticket624.core.ts`); DreamDEX has none,
///         so this is the house's, with every input readable and every parameter public.
/// @dev Nothing here stores a pool or market address: every reference is resolved from the module by
///      market id, in-transaction (AD-10). The asset is never trusted: the opener names it and the hub's
///      key must map the (asset, expiry) definition to the Window's own question.
abstract contract RangePricing is IRangeReserve {
    uint8 internal constant STATUS_TRADING = 1;
    uint64 internal constant PRICE_LEVELS = 32;

    IERC20 public immutable collateral;
    IBinaryModule public immutable module;
    IOracleHub public immutable hub;
    /// @dev The venue whose Windows the reserve accepts: its prints are in cents and its questions on the hub.
    bytes32 public immutable venueId;
    /// @dev One whole unit of collateral (10^decimals): the scale of every price and probability at the seam.
    uint256 public immutable one;

    address public admin;
    bool public paused;
    Params public params;
    /// @dev Per-√second volatility × 1e8, keyed by `keccak256(asset)`; zero refuses the asset.
    mapping(bytes32 assetKey => uint64 sigmaE8) public volatilityOf;
    /// @dev What the hub proved about a Window on its first open, so later opens skip the rebuild.
    mapping(bytes32 marketId => bytes32 assetKey) public assetKeyOf;
    mapping(bytes32 marketId => int256 print) public openingPrintOf;

    struct WindowRef {
        address market;
        address pool;
        uint256 questionId;
        uint64 tradingStart;
        uint64 expiry;
    }

    /// @dev Everything `openRange` decides before it moves money.
    struct Priced {
        uint256 stake;
        uint256 probRaw;
        int256 openingPrint;
        uint256 questionId;
        uint64 expiry;
        bytes32 assetKey;
        bool proven;
        Basis basis;
    }

    constructor(IERC20 collateral_, IBinaryModule module_, IOracleHub hub_, bytes32 venueId_, Params memory params_) {
        collateral = collateral_;
        module = module_;
        hub = hub_;
        venueId = venueId_;
        one = 10 ** IERC20Metadata(address(collateral_)).decimals();
        admin = msg.sender;
        _setParams(params_);
    }

    // ------------------------------------------------------------------ admin

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin(msg.sender);
        _;
    }

    /// @notice Tunables only. Open rounds keep the terms they were opened on.
    function setParams(Params calldata next) external onlyAdmin {
        _setParams(next);
    }

    /// @notice The house's per-√second volatility for an asset, × 1e8 (context/43: measured from the venue's own prints).
    function setVolatility(string calldata asset, uint64 sigmaE8) external onlyAdmin {
        volatilityOf[keccak256(bytes(asset))] = sigmaE8;
        emit VolatilitySet(asset, sigmaE8);
    }

    /// @notice Pauses new rounds and new supply. Settlement, claims, refunds and withdrawals never pause.
    function setPaused(bool next) external onlyAdmin {
        paused = next;
        emit PausedSet(next);
    }

    function setAdmin(address next) external onlyAdmin {
        if (next == address(0)) revert ZeroAddress();
        admin = next;
        emit AdminChanged(next);
    }

    function _setParams(Params memory p) internal {
        if (p.maxExposureBps > RangeMath.BPS || p.maxSpreadRaw == 0 || p.centerDepthRaw == 0) revert BadParams();
        if (p.minCenterQE6 >= p.maxCenterQE6 || p.maxCenterQE6 > RangeMath.P_ONE) revert BadParams();
        if (p.minProbRaw >= p.maxProbRaw || p.maxProbRaw > one) revert BadParams();
        if (p.minTimeLeftSec == 0 || p.maxHorizonSec <= p.minTimeLeftSec || p.staleAfterSec == 0) revert BadParams();
        if (p.maxPayoutCap == 0 || p.maxExpiryLocked == 0) revert BadParams();
        params = p;
        emit ParamsUpdated(p);
    }

    // ------------------------------------------------------------------ pricing

    /// @notice What a round would cost right now, with every refusal the open would raise except the
    ///         opener's own `maxStake` guard and the reserve's caps — the exact answer before signing.
    function previewOpen(bytes32 marketId, string calldata asset, Side side, int256 lowPrint, int256 highPrint, uint256 maxPayout)
        external
        view
        returns (uint256 stake, uint256 probRaw, int256 openingPrint, Basis memory basis)
    {
        Priced memory q = _price(marketId, asset, side, lowPrint, highPrint, maxPayout);
        return (q.stake, q.probRaw, q.openingPrint, q.basis);
    }

    /// @notice The Window's opening print and where its book puts the market now, as the pricing reads them.
    function previewBasis(bytes32 marketId, string calldata asset) external view returns (int256 openingPrint, uint256 centerQE6, uint64 sigmaE8) {
        WindowRef memory w = _resolve(marketId);
        (bytes32 assetKey,) = _requireAsset(marketId, asset, w);
        (openingPrint,) = _openingPrint(marketId, asset, w.tradingStart);
        centerQE6 = _center(marketId, w.pool);
        sigmaE8 = volatilityOf[assetKey];
    }

    function _price(bytes32 marketId, string calldata asset, Side side, int256 lowPrint, int256 highPrint, uint256 maxPayout)
        internal
        view
        returns (Priced memory q)
    {
        if (lowPrint <= 0 || highPrint <= lowPrint) revert BadBand(lowPrint, highPrint);
        if (maxPayout == 0 || maxPayout > params.maxPayoutCap) revert OverPayoutCap(maxPayout, params.maxPayoutCap);
        WindowRef memory w = _resolve(marketId);
        uint8 status = IBinaryMarket(w.market).status();
        if (status != STATUS_TRADING) revert MarketNotTrading(marketId, status);
        if (w.expiry < block.timestamp + params.minTimeLeftSec) revert TooLate(marketId, w.expiry);
        if (w.expiry > block.timestamp + params.maxHorizonSec) revert TooFar(marketId, w.expiry);
        uint256 tau = w.expiry - block.timestamp;

        (q.assetKey, q.proven) = _requireAsset(marketId, asset, w);
        uint64 sigma = volatilityOf[q.assetKey];
        if (sigma == 0) revert NoVolatility(asset);
        (q.openingPrint,) = _openingPrint(marketId, asset, w.tradingStart);
        uint256 centerQE6 = _center(marketId, w.pool);

        uint256 pInsideE6 = RangeMath.bandProbE6(q.openingPrint, lowPrint, highPrint, centerQE6, sigma, tau);
        uint256 pE6 = side == Side.INSIDE ? pInsideE6 : RangeMath.P_ONE - pInsideE6;
        q.probRaw = pE6 * one / RangeMath.P_ONE;
        if (q.probRaw < params.minProbRaw) revert LongShot(q.probRaw, params.minProbRaw);
        if (q.probRaw > params.maxProbRaw) revert NearCertain(q.probRaw, params.maxProbRaw);
        q.stake = RangeMath.floorStake(maxPayout, q.probRaw, one, params.marginBps);
        // The house must front something, or the round is not a bet against it.
        if (q.stake >= maxPayout) revert Underpriced(q.stake, maxPayout);
        q.questionId = w.questionId;
        q.expiry = w.expiry;
        q.basis = Basis({centerQE6: centerQE6, sigmaE8: sigma, tauSec: uint32(tau)});
    }

    /// @dev The hub's key of the (asset, expiry) closing question must be the Window's own question. Cached per Window.
    function _requireAsset(bytes32 marketId, string calldata asset, WindowRef memory w) internal view returns (bytes32 assetKey, bool proven) {
        assetKey = keccak256(bytes(asset));
        bytes32 cached = assetKeyOf[marketId];
        if (cached != bytes32(0)) {
            if (cached != assetKey) revert WrongAsset(marketId, asset);
            return (assetKey, true);
        }
        bytes32 key = hub.questionKeyOf(WindowQuestion.build(asset, w.expiry));
        if (hub.questionIdByKey(key) != w.questionId) revert WrongAsset(marketId, asset);
        return (assetKey, false);
    }

    /// @dev The opening print is the hub's answer to the (asset, tradingStart) closing question; back-to-back lanes
    ///      make that the previous Window's close. A Window without one is refused, never guessed. Cached per Window.
    function _openingPrint(bytes32 marketId, string calldata asset, uint64 tradingStart) internal view returns (int256 print, bool cached) {
        print = openingPrintOf[marketId];
        if (print != 0) return (print, true);
        bytes32 key = hub.questionKeyOf(WindowQuestion.build(asset, tradingStart));
        uint256 questionId = hub.questionIdByKey(key);
        if (questionId == 0) revert NoOpeningPrint(marketId);
        try hub.pullNumericAnswer(questionId) returns (int256 value, bool voided) {
            if (voided || value <= 0) revert NoOpeningPrint(marketId);
            return (value, false);
        } catch {
            revert NoOpeningPrint(marketId);
        }
    }

    /// @dev P(close ≥ open) as the book prices it: the YES mid over `centerDepthRaw` a side, refused thin, wide or decided.
    function _center(bytes32 marketId, address pool) internal view returns (uint256 centerQE6) {
        uint256 depth = params.centerDepthRaw;
        (uint256 askYes, uint256 askFilled) = ParlayMath.vwap(IBinaryPool(pool).getBookLevels(false, PRICE_LEVELS), false, one, depth);
        (uint256 noPrice, uint256 bidFilled) = ParlayMath.vwap(IBinaryPool(pool).getBookLevels(true, PRICE_LEVELS), true, one, depth);
        if (askFilled < depth || bidFilled < depth) revert ThinBook(marketId, askFilled < bidFilled ? askFilled : bidFilled, depth);
        uint256 bidYes = one - noPrice;
        uint256 spread = askYes > bidYes ? askYes - bidYes : 0;
        if (spread > params.maxSpreadRaw) revert WideBook(marketId, spread, params.maxSpreadRaw);
        centerQE6 = (askYes + bidYes) * RangeMath.P_ONE / (2 * one);
        if (centerQE6 < params.minCenterQE6 || centerQE6 > params.maxCenterQE6) revert WindowDecided(marketId, centerQE6);
    }

    /// @dev Everything about a Window comes off the module by market id, in-transaction.
    function _resolve(bytes32 marketId) internal view returns (WindowRef memory w) {
        address coll;
        bytes32 venue;
        address adapter;
        (w.questionId,,, coll,, venue, adapter,, w.market, w.pool,,, w.tradingStart, w.expiry) = module.markets(marketId);
        if (w.market == address(0) || w.pool == address(0)) revert UnknownMarket(marketId);
        if (coll != address(collateral)) revert WrongCollateral(coll);
        if (venue != venueId) revert WrongVenue(venue);
        if (adapter != address(hub)) revert WrongOracle(adapter);
    }
}
