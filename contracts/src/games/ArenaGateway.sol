// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool, IOutcomeToken6909} from "../interfaces/IDreamDex.sol";
import {LeverageMath} from "../leverage/LeverageMath.sol";
import {IGameArena} from "./IGameArena.sol";

/// @title The arena's one seam to DreamDEX, and its tunables.
/// @notice A duel pick is a real IOC taker order placed by THIS contract, which then holds the outcome
///         tokens until the Window settles. So the arena is the venue's trader for both players, and what
///         it can attribute to a seat is exactly what moved in that call — collateral out, ERC-6909 in —
///         measured before and after. Nothing here is a quote the player was shown.
/// @dev Sizing is stake-first, as the private desk's is: a player swipes a side, not a size, so the
///      per-card cap is walked against the live book at execution and the unspent part goes home. The
///      walk is `LeverageMath`'s, already fork-verified on Shannon (context/45).
/// @dev Nothing here stores or emits a pool address; every pool is resolved from the market id
///      in-transaction (AD-10).
abstract contract ArenaGateway is IGameArena {
    using SafeERC20 for IERC20;

    uint8 internal constant STATUS_TRADING = 1;
    uint8 internal constant ORDER_TYPE_IOC = 2;
    uint8 internal constant SELF_MATCH_CANCEL_TAKER = 0;
    uint64 internal constant NS = 1e9;
    uint64 internal constant IOC_LIFE_SEC = 60;
    /// @dev Levels read when walking a book; a stake that wants more than these buy gets fewer contracts, never a revert.
    uint64 internal constant LEVELS = 32;
    /// @dev Eight cards is the widest deck a `uint8` completion mask can hold, and three times the deck
    ///      policy's ceiling — the policy narrows it further, the type never has to.
    uint8 internal constant MAX_DECK = 8;

    IERC20 public immutable collateral;
    IBinaryModule public immutable module;
    IOutcomeToken6909 public immutable outcomeToken;
    /// @dev The one venue whose Windows may enter a deck. A market id from anywhere else is refused
    ///      before any money moves.
    bytes32 public immutable venueId;
    /// @dev One whole unit of collateral (10^decimals); prices are collateral per whole contract.
    uint256 public immutable one;

    address public admin;
    bool public paused;
    Params public params;
    mapping(uint8 tier => Tier) public tierOf;

    struct MarketRef {
        address market;
        address pool;
        uint256 yesId;
        uint256 noId;
        uint32 operatorId;
        bytes32 venueId;
        uint64 expiry;
    }

    constructor(IERC20 collateral_, IBinaryModule module_, IOutcomeToken6909 outcomeToken_, bytes32 venueId_, Params memory params_) {
        if (venueId_ == bytes32(0)) revert BadParams();
        collateral = collateral_;
        module = module_;
        outcomeToken = outcomeToken_;
        venueId = venueId_;
        one = 10 ** IERC20Metadata(address(collateral_)).decimals();
        admin = msg.sender;
        _setParams(params_);
        // Redemption burns the arena's outcome tokens through the module and its settlement contract.
        outcomeToken_.setOperator(address(module_), true);
        outcomeToken_.setOperator(module_.settlement(), true);
    }

    // ------------------------------------------------------------------ admin

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin(msg.sender);
        _;
    }

    function setParams(Params calldata next) external onlyAdmin {
        _setParams(next);
    }

    /// @notice Prices one entry tier. A disabled tier refuses new matches; matches already at it are
    ///         untouched, because their pot and cap were frozen at creation.
    function setTier(uint8 tier, Tier calldata next) external onlyAdmin {
        if (next.perCardCapBase == 0) revert BadParams();
        tierOf[tier] = next;
        emit TierSet(tier, next.potBase, next.perCardCapBase, next.enabled);
    }

    /// @notice Pauses new matches, joins and picks. Reveal, settlement, refunds and claims never pause —
    ///         a paused arena must never trap a position or a pot.
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
        if (p.joinWindowSec == 0 || p.revealWindowSec == 0 || p.pickWindowSec == 0) revert BadParams();
        if (p.minDeckSize == 0 || p.maxDeckSize < p.minDeckSize || p.maxDeckSize > MAX_DECK) revert BadParams();
        // A card must outlive the pick window, or the last swipe of a legal deck reverts and the player
        // forfeits a pot for a deadline the parameters themselves made impossible to meet.
        if (p.minCardLifeSec <= p.pickWindowSec) revert BadParams();
        params = p;
        emit ParamsUpdated(p);
    }

    /// @notice Moves the arena's own credit on `pool` into its wallet balance. Anyone may call; the
    ///         credit is the arena's either way, so nothing changes hands.
    function sweep(address pool) external returns (uint256 amount) {
        return _collect(pool);
    }

    // ------------------------------------------------------------------ the venue

    /// @dev Everything about a Window comes off the module by market id, in-transaction.
    function _resolve(bytes32 marketId) internal view returns (MarketRef memory ref) {
        (,,, address coll, uint32 operatorId, bytes32 venue,,, address market, address pool, uint256 yesId, uint256 noId,, uint64 expiry) =
            module.markets(marketId);
        if (market == address(0) || pool == address(0)) revert UnknownMarket(marketId);
        if (coll != address(collateral)) revert WrongCollateral(coll);
        if (venue != venueId) revert WrongVenue(venue);
        ref = MarketRef(market, pool, yesId, noId, operatorId, venue, expiry);
    }

    function _outcomeId(MarketRef memory ref, uint8 outcomeIdx) internal pure returns (uint256) {
        if (outcomeIdx > 1) revert BadOutcome(outcomeIdx);
        return outcomeIdx == 0 ? ref.yesId : ref.noId;
    }

    /// @dev Collateral the arena can count on `pool`: its wallet balance plus the pool's credit for it.
    ///      Escrow is drawn credit-first and refunds may land as credit, so both halves count.
    function _cash(address pool) internal view returns (uint256) {
        return collateral.balanceOf(address(this)) + IBinaryPool(pool).getWithdrawableBalance(address(this), address(collateral));
    }

    /// @dev Moves the arena's credit on `pool` into its wallet, so the wallet always covers what it owes.
    function _collect(address pool) internal returns (uint256 amount) {
        amount = IBinaryPool(pool).getWithdrawableBalance(address(this), address(collateral));
        if (amount == 0) return 0;
        IBinaryPool(pool).withdraw(address(collateral), amount);
        emit Swept(amount);
    }

    function _ensurePoolApprovals(address pool) internal {
        if (collateral.allowance(address(this), pool) < type(uint128).max) collateral.forceApprove(pool, type(uint256).max);
    }

    /// @dev An IOC executes at once; its expiry only has to lie ahead, and never past the Window's.
    function _expireNs(MarketRef memory ref) internal view returns (uint64) {
        uint64 at = uint64(block.timestamp) + IOC_LIFE_SEC;
        if (at > ref.expiry) at = ref.expiry;
        return at * NS;
    }

    /// @dev Places one IOC buy as the arena and reports what actually moved. `priceYesRaw` is the venue's
    ///      price — the YES price for every kind (context/44).
    function _buyIoc(MarketRef memory ref, uint8 outcomeIdx, uint256 priceYesRaw, uint256 quantityRaw)
        internal
        returns (uint256 cashDelta, uint256 tokenDelta)
    {
        uint256 id = _outcomeId(ref, outcomeIdx);
        _ensurePoolApprovals(ref.pool);
        uint256 cash0 = _cash(ref.pool);
        uint256 tokens0 = outcomeToken.balanceOf(address(this), id);
        IBinaryPool(ref.pool).placeBinaryOrder(
            outcomeIdx * 2, priceYesRaw, quantityRaw, _expireNs(ref), ORDER_TYPE_IOC, SELF_MATCH_CANCEL_TAKER, address(0), 0, 0
        );
        return (cash0 - _cash(ref.pool), outcomeToken.balanceOf(address(this), id) - tokens0);
    }

    /// @dev Redeems `amount` of one outcome through the module and reports the collateral that came back.
    ///      A losing side returns nothing and a voided Window returns half — both are real answers here,
    ///      so the delta is recorded rather than asserted.
    function _redeem(MarketRef memory ref, bytes32 marketId, uint8 outcomeIdx, uint256 amount) internal returns (uint256 payout) {
        uint256 cash0 = _cash(ref.pool);
        module.redeem(ref.operatorId, ref.venueId, marketId, outcomeIdx, amount);
        payout = _cash(ref.pool) - cash0;
    }

    /// @dev Fills and payouts sit far below 2^128 under any tier the arena will ever price — but a
    ///      silent truncation would erase a position a player paid real money for, so the cast is checked.
    function _u128(uint256 v) internal pure returns (uint128) {
        if (v > type(uint128).max) revert Overflow(v);
        return uint128(v);
    }

    function _isSettled(MarketRef memory ref) internal view returns (bool) {
        IBinaryMarket m = IBinaryMarket(ref.market);
        return m.isResolved() || m.isVoided();
    }

    // ------------------------------------------------------------------ the book

    /// @notice What `stake` buys on one side of a card right now, and exactly what the pick will size at
    ///         execution. The readiness screen quotes this; nothing is promised by it.
    function sizeForStake(bytes32 marketId, uint8 outcomeIdx, uint256 stake) external view returns (Quote memory) {
        return _sizeEntry(_resolve(marketId), marketId, outcomeIdx, stake);
    }

    /// @dev Validates the Window, walks the entry side for what the stake buys, then caps the size so the
    ///      venue's escrow at the walk's limit never exceeds the stake — one seat's card never borrows
    ///      another's pot, even for a block (the vault's rule, `EventVault._requireEscrow`).
    function _sizeEntry(MarketRef memory ref, bytes32 marketId, uint8 outcomeIdx, uint256 stake) internal view returns (Quote memory q) {
        _outcomeId(ref, outcomeIdx);
        if (stake == 0) revert ZeroAmount();
        uint8 status = IBinaryMarket(ref.market).status();
        if (status != STATUS_TRADING) revert MarketNotTrading(marketId, status);
        if (ref.expiry < block.timestamp + params.minCardLifeSec) revert TooLate(marketId, ref.expiry);
        bool invert = outcomeIdx == 1;
        IBinaryPool.Level[] memory levels = IBinaryPool(ref.pool).getBookLevels(invert, LEVELS);
        (, uint256 minQuantity, uint256 lot) = IBinaryPool(ref.pool).getOrderBookParameters();
        uint256 quantityRaw = LeverageMath.walkBudget(levels, invert, one, stake, lot);
        (uint256 cost, uint256 filled, uint256 limitYes) = LeverageMath.walkQuantity(levels, invert, one, quantityRaw);
        uint256 limitSide = LeverageMath.sidePrice(limitYes, invert, one);
        if (limitSide != 0 && quantityRaw * limitSide > stake * one) {
            quantityRaw = stake * one / limitSide;
            if (lot > 1) quantityRaw = (quantityRaw / lot) * lot;
            (cost, filled, limitYes) = LeverageMath.walkQuantity(levels, invert, one, quantityRaw);
        }
        if (quantityRaw < minQuantity || filled < quantityRaw) revert BelowMinQuantity(filled, minQuantity);
        q.quantityRaw = quantityRaw;
        q.costRaw = cost;
        q.limitYesRaw = limitYes;
        q.priceRaw = LeverageMath.ceilDiv(cost * one, quantityRaw);
    }
}
