// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool, IOutcomeToken6909} from "../interfaces/IDreamDex.sol";
import {ILeverageReserve} from "./ILeverageReserve.sol";
import {LeverageMath} from "./LeverageMath.sol";

/// @title The leverage reserve's one seam to DreamDEX, and its tunables.
/// @notice The reserve is the venue's taker on the owner's behalf: it buys the boosted position off the
///         resting book as itself, holds the contracts, and sells them the same way when the owner cashes
///         out, when the mark reaches the knock-out line, or redeems them when the Window settles. Every
///         figure it books is a delta of its own cash and tokens around the venue call, and every price
///         it quotes is read off the book inside the transaction.
/// @dev Nothing here stores or emits a pool address. Every pool is resolved from the venue's market id
///      in-transaction (AD-10).
abstract contract LeverageGateway is ILeverageReserve {
    using SafeERC20 for IERC20;

    uint8 internal constant STATUS_TRADING = 1;
    uint8 internal constant ORDER_TYPE_IOC = 2;
    uint8 internal constant SELF_MATCH_CANCEL_TAKER = 0;
    uint64 internal constant NS = 1e9;
    uint64 internal constant IOC_LIFE_SEC = 60;
    /// @dev Levels read per side when walking a book; a book thinner than the walk over these refuses.
    uint64 internal constant LEVELS = 32;
    uint256 internal constant BPS = LeverageMath.BPS;

    IERC20 public immutable collateral;
    IBinaryModule public immutable module;
    IOutcomeToken6909 public immutable outcomeToken;
    /// @dev One whole unit of collateral (10^decimals); prices are collateral per whole contract.
    uint256 public immutable one;

    address public admin;
    bool public paused;
    Params public params;

    struct MarketRef {
        address market;
        address pool;
        uint256 yesId;
        uint256 noId;
        uint32 operatorId;
        bytes32 venueId;
        uint64 expiry;
    }

    constructor(IERC20 collateral_, IBinaryModule module_, IOutcomeToken6909 outcomeToken_, Params memory params_) {
        collateral = collateral_;
        module = module_;
        outcomeToken = outcomeToken_;
        one = 10 ** IERC20Metadata(address(collateral_)).decimals();
        admin = msg.sender;
        _setParams(params_);
        // Redemption burns the reserve's outcome tokens through the module and its settlement contract.
        outcomeToken_.setOperator(address(module_), true);
        outcomeToken_.setOperator(module_.settlement(), true);
    }

    // ------------------------------------------------------------------ admin

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin(msg.sender);
        _;
    }

    /// @notice Tunables only. Open positions keep the terms they were opened on; the knock-out line follows.
    function setParams(Params calldata next) external onlyAdmin {
        _setParams(next);
    }

    /// @notice Pauses new positions and new supply. Cash-outs, knock-outs, settlement and withdrawals never pause.
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
        if (p.maxLeverageBps <= BPS || p.premiumBps >= BPS || p.maintenanceBps < BPS || p.maxExposureBps > BPS) revert BadParams();
        if (p.minEntryPriceRaw == 0 || p.maxEntryPriceRaw <= p.minEntryPriceRaw || p.maxEntryPriceRaw >= one) revert BadParams();
        if (p.maxFrontedPerPosition == 0 || p.maxWindowFronted == 0 || p.maxOpenPositions == 0 || p.maxOpenPositions > 256) revert BadParams();
        if (p.minTimeLeftSec == 0) revert BadParams();
        params = p;
        emit ParamsUpdated(p);
    }

    // ------------------------------------------------------------------ the venue

    /// @notice Moves the reserve's own credit on `pool` into its wallet. Anyone may call; the credit is the
    ///         reserve's either way, so nothing changes hands.
    function sweep(address pool) external returns (uint256 amount) {
        return _collect(pool);
    }

    /// @dev Everything about a Window comes off the module by market id, in-transaction.
    function _resolve(bytes32 marketId) internal view returns (MarketRef memory ref) {
        (,,, address coll, uint32 operatorId, bytes32 venueId,,, address market, address pool, uint256 yesId, uint256 noId,, uint64 expiry) =
            module.markets(marketId);
        if (market == address(0) || pool == address(0)) revert UnknownMarket(marketId);
        if (coll != address(collateral)) revert WrongCollateral(coll);
        ref = MarketRef(market, pool, yesId, noId, operatorId, venueId, expiry);
    }

    function _outcomeId(MarketRef memory ref, uint8 outcomeIdx) internal pure returns (uint256) {
        if (outcomeIdx > 1) revert BadOutcome(outcomeIdx);
        return outcomeIdx == 0 ? ref.yesId : ref.noId;
    }

    /// @dev Collateral the reserve can count on `pool`: its wallet balance plus the pool's credit for it.
    function _cash(address pool) internal view returns (uint256) {
        return collateral.balanceOf(address(this)) + IBinaryPool(pool).getWithdrawableBalance(address(this), address(collateral));
    }

    /// @dev Moves the reserve's credit on `pool` into its wallet, so `liquid` is always the wallet's balance.
    function _collect(address pool) internal returns (uint256 amount) {
        amount = IBinaryPool(pool).getWithdrawableBalance(address(this), address(collateral));
        if (amount == 0) return 0;
        IBinaryPool(pool).withdraw(address(collateral), amount);
        emit Swept(amount);
    }

    function _ensurePoolApprovals(address pool, bool isBuy) internal {
        if (isBuy) {
            if (collateral.allowance(address(this), pool) < type(uint128).max) collateral.forceApprove(pool, type(uint256).max);
        } else if (!outcomeToken.isOperator(address(this), pool)) {
            outcomeToken.setOperator(pool, true);
        }
    }

    /// @dev An IOC executes at once; its expiry only has to lie ahead, and never past the Window's.
    function _expireNs(MarketRef memory ref) internal view returns (uint64) {
        uint64 at = uint64(block.timestamp) + IOC_LIFE_SEC;
        if (at > ref.expiry) at = ref.expiry;
        return at * NS;
    }

    /// @dev Places one IOC order as the reserve and reports what actually moved. `priceYesRaw` is the
    ///      venue's price — the YES price for every kind (context/44).
    /// @return cashDelta collateral spent (buy) or received (sell), fees included
    /// @return tokenDelta outcome tokens gained (buy) or sold (sell)
    function _placeIoc(MarketRef memory ref, uint8 outcomeIdx, bool isBuy, uint256 priceYesRaw, uint256 quantityRaw)
        internal
        returns (uint256 cashDelta, uint256 tokenDelta)
    {
        uint256 id = _outcomeId(ref, outcomeIdx);
        _ensurePoolApprovals(ref.pool, isBuy);
        uint256 cash0 = _cash(ref.pool);
        uint256 tokens0 = outcomeToken.balanceOf(address(this), id);
        IBinaryPool(ref.pool).placeBinaryOrder(
            (outcomeIdx * 2) + (isBuy ? 0 : 1), priceYesRaw, quantityRaw, _expireNs(ref), ORDER_TYPE_IOC, SELF_MATCH_CANCEL_TAKER, address(0), 0, 0
        );
        uint256 cash1 = _cash(ref.pool);
        uint256 tokens1 = outcomeToken.balanceOf(address(this), id);
        if (isBuy) return (cash0 - cash1, tokens1 - tokens0);
        return (cash1 - cash0, tokens0 - tokens1);
    }

    /// @dev Redeems `amount` of one outcome through the module and reports the collateral that came back.
    function _redeem(MarketRef memory ref, bytes32 marketId, uint8 outcomeIdx, uint256 amount) internal returns (uint256 payout) {
        uint256 cash0 = _cash(ref.pool);
        module.redeem(ref.operatorId, ref.venueId, marketId, outcomeIdx, amount);
        payout = _cash(ref.pool) - cash0;
    }

    function _isSettled(MarketRef memory ref) internal view returns (bool) {
        IBinaryMarket m = IBinaryMarket(ref.market);
        return m.isResolved() || m.isVoided();
    }

    // ------------------------------------------------------------------ the book

    /// @dev The side of the book a taker meets: buying YES takes the asks, buying NO the bids (inverted);
    ///      selling is the other side. NO prices are the YES levels inverted.
    function _levels(MarketRef memory ref, uint8 outcomeIdx, bool isExit) internal view returns (IBinaryPool.Level[] memory levels, bool invert) {
        bool isBid = (outcomeIdx == 0) == isExit;
        levels = IBinaryPool(ref.pool).getBookLevels(isBid, LEVELS);
        invert = outcomeIdx == 1;
    }

    /// @dev What the book would pay for `quantityRaw` of a side right now: the exit walk, rounded down.
    function _markOver(MarketRef memory ref, uint8 outcomeIdx, uint256 quantityRaw)
        internal
        view
        returns (uint256 markRaw, uint256 filledRaw, uint256 limitYesRaw)
    {
        (IBinaryPool.Level[] memory levels, bool invert) = _levels(ref, outcomeIdx, true);
        (uint256 cost, uint256 filled, uint256 limit) = LeverageMath.walkQuantity(levels, invert, one, quantityRaw);
        // A ceiling-rounded cost overstates a sale by at most one unit; the mark never rounds in the owner's favour.
        markRaw = cost == 0 ? 0 : cost - 1;
        return (markRaw, filled, limit);
    }

    /// @notice What opening `quantityRaw` of a side at `leverageBps` costs and yields right now, with every
    ///         refusal the open would raise except the opener's own `maxStake` guard and the reserve's caps.
    function previewOpen(bytes32 marketId, uint8 outcomeIdx, uint256 quantityRaw, uint32 leverageBps) external view returns (Preview memory) {
        return _priceEntry(_resolve(marketId), marketId, outcomeIdx, quantityRaw, leverageBps);
    }

    /// @notice The size `stake` affords at `leverageBps` off the live book — the stake-first quote — then that size priced.
    function sizeForStake(bytes32 marketId, uint8 outcomeIdx, uint256 stake, uint32 leverageBps) external view returns (Preview memory) {
        MarketRef memory ref = _resolve(marketId);
        _requireLeverage(leverageBps);
        (IBinaryPool.Level[] memory levels, bool invert) = _levels(ref, outcomeIdx, false);
        (, uint256 minQuantity, uint256 lot) = IBinaryPool(ref.pool).getOrderBookParameters();
        uint256 quantityRaw = LeverageMath.walkBudget(levels, invert, one, LeverageMath.budgetFor(stake, leverageBps, params.premiumBps), lot);
        if (quantityRaw < minQuantity) revert BelowMinQuantity(quantityRaw, minQuantity);
        return _priceEntry(ref, marketId, outcomeIdx, quantityRaw, leverageBps);
    }

    function _requireLeverage(uint32 leverageBps) internal view {
        if (leverageBps <= BPS || leverageBps > params.maxLeverageBps) revert BadLeverage(leverageBps, params.maxLeverageBps);
    }

    /// @dev Validates the Window and the size, walks the entry side, derives the terms and refuses what the reserve refuses.
    function _priceEntry(MarketRef memory ref, bytes32 marketId, uint8 outcomeIdx, uint256 quantityRaw, uint32 leverageBps)
        internal
        view
        returns (Preview memory q)
    {
        _outcomeId(ref, outcomeIdx);
        _requireLeverage(leverageBps);
        Params memory p = params;
        uint8 status = IBinaryMarket(ref.market).status();
        if (status != STATUS_TRADING) revert MarketNotTrading(marketId, status);
        if (ref.expiry < block.timestamp + p.minTimeLeftSec) revert TooLate(marketId, ref.expiry);
        (, uint256 minQuantity,) = IBinaryPool(ref.pool).getOrderBookParameters();
        if (quantityRaw < minQuantity) revert BelowMinQuantity(quantityRaw, minQuantity);

        (IBinaryPool.Level[] memory levels, bool invert) = _levels(ref, outcomeIdx, false);
        (q.costRaw, q.filledRaw, q.limitYesRaw) = LeverageMath.walkQuantity(levels, invert, one, quantityRaw);
        if (q.filledRaw < quantityRaw) revert ThinBook(marketId, q.filledRaw, quantityRaw);
        q.quantityRaw = quantityRaw;
        q.priceRaw = LeverageMath.ceilDiv(q.costRaw * one, quantityRaw);
        if (q.priceRaw < p.minEntryPriceRaw || q.priceRaw > p.maxEntryPriceRaw) revert OutsideBand(q.priceRaw, p.minEntryPriceRaw, p.maxEntryPriceRaw);
        (q.stake, q.fronted, q.premium) = LeverageMath.terms(q.costRaw, leverageBps, p.premiumBps);
        q.winIfRight = LeverageMath.winIfRight(quantityRaw, q.fronted);
        // A boost that could not beat the plain bet even when right is a fee, not a product.
        if (q.winIfRight <= q.stake) revert Underpriced(q.stake, q.winIfRight);
    }
}
