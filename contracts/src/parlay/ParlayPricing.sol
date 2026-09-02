// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool} from "../interfaces/IDreamDex.sol";
import {IParlayReserve} from "./IParlayReserve.sol";
import {ParlayMath} from "./ParlayMath.sol";

/// @title The reserve's one seam to DreamDEX, and its tunables.
/// @notice A leg's price is the venue's own book, read inside the transaction: the cost-weighted
///         price of the depth the ticket would need to hedge, on the side the opener chose. The
///         reference (`parlay624.move`) took opener-supplied probabilities and named that its
///         known gap; here nothing but the resting book can price a leg.
/// @dev Nothing here stores a pool or market address: every reference is resolved from the module
///      by market id, in-transaction (AD-10).
abstract contract ParlayPricing is IParlayReserve {
    uint8 internal constant STATUS_TRADING = 1;
    /// @dev Levels read per side when pricing a leg; a book thinner than the depth over these refuses the leg.
    uint64 internal constant PRICE_LEVELS = 32;

    IERC20 public immutable collateral;
    IBinaryModule public immutable module;
    /// @dev One whole unit of collateral (10^decimals): the scale of every price and probability here.
    uint256 public immutable one;

    address public admin;
    bool public paused;
    Params public params;

    /// @dev Everything `openParlay` decides before it moves money.
    struct Priced {
        uint256 stake;
        uint256 combinedProbRaw;
        uint64 lastExpirySec;
        uint256[] pricesRaw;
        uint64[] expiries;
    }

    constructor(IERC20 collateral_, IBinaryModule module_, Params memory params_) {
        collateral = collateral_;
        module = module_;
        one = 10 ** IERC20Metadata(address(collateral_)).decimals();
        admin = msg.sender;
        _setParams(params_);
    }

    // ------------------------------------------------------------------ admin

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin(msg.sender);
        _;
    }

    /// @notice Tunables only. Open tickets keep the terms they were opened on.
    function setParams(Params calldata next) external onlyAdmin {
        _setParams(next);
    }

    /// @notice Pauses new tickets and new supply. Settlement, claims, refunds and withdrawals never pause.
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
        if (p.maxExposureBps > ParlayMath.BPS || p.correlationBps > ParlayMath.BPS || p.maxLegs < 2) revert BadParams();
        if (p.maxPayoutCap == 0 || p.maxExpiryLocked == 0 || p.priceDepthRaw == 0) revert BadParams();
        params = p;
        emit ParamsUpdated(p);
    }

    // ------------------------------------------------------------------ pricing

    /// @notice What a ticket would cost right now, with every refusal the open would raise except the
    ///         opener's own `maxStake` guard and the reserve's caps — so a client can ask the chain
    ///         for the exact answer before signing.
    function previewOpen(LegInput[] calldata legs, uint256 maxPayout)
        external
        view
        returns (uint256 stake, uint256 combinedProbRaw, uint256[] memory pricesRaw, uint64[] memory expiries)
    {
        Priced memory q = _price(legs, maxPayout);
        return (q.stake, q.combinedProbRaw, q.pricesRaw, q.expiries);
    }

    /// @notice One side's price for `quantityRaw` contracts, exactly as a leg would be priced.
    function previewLegPrice(bytes32 marketId, uint8 outcomeIdx, uint256 quantityRaw) external view returns (uint256 priceRaw, uint256 filledRaw) {
        if (outcomeIdx > 1) revert BadOutcome(outcomeIdx);
        (, address pool,) = _resolve(marketId);
        return _bookPrice(pool, outcomeIdx, quantityRaw);
    }

    /// @dev Validates every leg against the venue, prices each off its book, combines and floors the stake.
    function _price(LegInput[] calldata legs, uint256 maxPayout) internal view returns (Priced memory q) {
        uint256 n = legs.length;
        if (n < 2 || n > params.maxLegs) revert BadLegCount(n);
        if (maxPayout == 0 || maxPayout > params.maxPayoutCap) revert OverPayoutCap(maxPayout, params.maxPayoutCap);
        uint256 depth = maxPayout > params.priceDepthRaw ? maxPayout : params.priceDepthRaw;

        q.pricesRaw = new uint256[](n);
        q.expiries = new uint64[](n);
        for (uint256 i = 0; i < n; i++) {
            bytes32 id = legs[i].marketId;
            uint8 outcomeIdx = legs[i].outcomeIdx;
            if (outcomeIdx > 1) revert BadOutcome(outcomeIdx);
            for (uint256 j = 0; j < i; j++) {
                if (legs[j].marketId == id) revert DuplicateMarket(id);
            }
            (address market, address pool, uint64 expiry) = _resolve(id);
            uint8 status = IBinaryMarket(market).status();
            if (status != STATUS_TRADING) revert MarketNotTrading(id, status);
            // A leg whose Window has already closed would let the opener pick a known outcome.
            if (expiry <= block.timestamp) revert LegExpired(id, expiry);
            (uint256 priceRaw, uint256 filled) = _bookPrice(pool, outcomeIdx, depth);
            if (filled < depth) revert ThinBook(id, filled, depth);
            q.pricesRaw[i] = priceRaw;
            q.expiries[i] = expiry;
            if (expiry > q.lastExpirySec) q.lastExpirySec = expiry;
        }

        q.combinedProbRaw = ParlayMath.combine(q.pricesRaw, q.expiries, one, params.correlationBps);
        if (q.combinedProbRaw < params.minCombinedProbRaw) revert LongShot(q.combinedProbRaw, params.minCombinedProbRaw);
        q.stake = ParlayMath.floorStake(maxPayout, q.combinedProbRaw, one, params.marginBps);
        // The house must front something, or the ticket is not a parlay.
        if (q.stake >= maxPayout) revert Underpriced(q.stake, maxPayout);
    }

    /// @dev UP buys the YES asks as they rest; DOWN buys NO, which is the YES bids inverted.
    function _bookPrice(address pool, uint8 outcomeIdx, uint256 quantityRaw) internal view returns (uint256 priceRaw, uint256 filledRaw) {
        bool isBid = outcomeIdx == 1;
        IBinaryPool.Level[] memory levels = IBinaryPool(pool).getBookLevels(isBid, PRICE_LEVELS);
        return ParlayMath.vwap(levels, isBid, one, quantityRaw);
    }

    /// @dev Everything about a Window comes off the module by market id, in-transaction.
    function _resolve(bytes32 marketId) internal view returns (address market, address pool, uint64 expiry) {
        address coll;
        (,,, coll,,,,, market, pool,,,, expiry) = module.markets(marketId);
        if (market == address(0) || pool == address(0)) revert UnknownMarket(marketId);
        if (coll != address(collateral)) revert WrongCollateral(coll);
    }
}
