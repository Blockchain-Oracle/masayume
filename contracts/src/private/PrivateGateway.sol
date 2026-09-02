// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool, IOutcomeToken6909} from "../interfaces/IDreamDex.sol";
import {LeverageMath} from "../leverage/LeverageMath.sol";
import {IPrivateDesk} from "./IPrivateDesk.sol";

/// @title The private desk's one seam to DreamDEX, and its tunables.
/// @notice Every slot's position is bought as an IOC taker by THIS contract, so the venue sees one taker for
///         every private bet ever placed here — the slot is the desk's own storage, never a venue account.
///         Every figure booked is a delta of the desk's own cash and tokens around the venue call, and every
///         price it quotes is read off the book inside the transaction.
/// @dev Nothing here stores or emits a pool address. Every pool is resolved from the venue's market id
///      in-transaction (AD-10).
abstract contract PrivateGateway is IPrivateDesk {
    using SafeERC20 for IERC20;

    uint8 internal constant STATUS_TRADING = 1;
    uint8 internal constant ORDER_TYPE_IOC = 2;
    uint8 internal constant SELF_MATCH_CANCEL_TAKER = 0;
    uint64 internal constant NS = 1e9;
    uint64 internal constant IOC_LIFE_SEC = 60;
    /// @dev Levels read when walking a book; a stake that wants more than these buy gets fewer contracts, never a revert.
    uint64 internal constant LEVELS = 32;

    IERC20 public immutable collateral;
    IBinaryModule public immutable module;
    IOutcomeToken6909 public immutable outcomeToken;
    /// @dev One whole unit of collateral (10^decimals); prices are collateral per whole contract.
    uint256 public immutable one;

    address public admin;
    /// @dev The one key that moves money between the pool and the slots, and signs the claims. Pinned here
    ///      so a claim can be verified against the chain, not against the desk's word.
    address public desk;
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

    constructor(IERC20 collateral_, IBinaryModule module_, IOutcomeToken6909 outcomeToken_, address desk_, Params memory params_) {
        if (desk_ == address(0)) revert ZeroAddress();
        collateral = collateral_;
        module = module_;
        outcomeToken = outcomeToken_;
        one = 10 ** IERC20Metadata(address(collateral_)).decimals();
        admin = msg.sender;
        desk = desk_;
        _setParams(params_);
        // Redemption burns the desk's outcome tokens through the module and its settlement contract.
        outcomeToken_.setOperator(address(module_), true);
        outcomeToken_.setOperator(module_.settlement(), true);
    }

    // ------------------------------------------------------------------ admin

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin(msg.sender);
        _;
    }

    modifier onlyDesk() {
        if (msg.sender != desk) revert NotDesk(msg.sender);
        _;
    }

    /// @notice Rotates the desk key. Claims signed by the old key stop verifying against the chain — cash them out first.
    function setDesk(address next) external onlyAdmin {
        if (next == address(0)) revert ZeroAddress();
        desk = next;
        emit DeskChanged(next);
    }

    function setParams(Params calldata next) external onlyAdmin {
        _setParams(next);
    }

    /// @notice Pauses new charges and new mints. Settlement, sweeps, credits and withdrawals never pause.
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
        if (p.minStake == 0 || p.maxStake < p.minStake || p.minTimeLeftSec == 0) revert BadParams();
        params = p;
        emit ParamsUpdated(p);
    }

    // ------------------------------------------------------------------ the venue

    /// @notice Moves the desk's own credit on `pool` into its wallet. Anyone may call; the credit is the desk's
    ///         either way, so nothing changes hands.
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

    /// @dev Collateral the desk can count on `pool`: its wallet balance plus the pool's credit for it.
    function _cash(address pool) internal view returns (uint256) {
        return collateral.balanceOf(address(this)) + IBinaryPool(pool).getWithdrawableBalance(address(this), address(collateral));
    }

    /// @dev Moves the desk's credit on `pool` into its wallet, so the wallet always equals what it owes.
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

    /// @dev Places one IOC buy as the desk and reports what actually moved. `priceYesRaw` is the venue's
    ///      price — the YES price for every kind (context/44).
    /// @return cashDelta collateral spent, fees included
    /// @return tokenDelta outcome tokens gained
    function _buyIoc(MarketRef memory ref, uint8 outcomeIdx, uint256 priceYesRaw, uint256 quantityRaw) internal returns (uint256 cashDelta, uint256 tokenDelta) {
        uint256 id = _outcomeId(ref, outcomeIdx);
        _ensurePoolApprovals(ref.pool);
        uint256 cash0 = _cash(ref.pool);
        uint256 tokens0 = outcomeToken.balanceOf(address(this), id);
        IBinaryPool(ref.pool).placeBinaryOrder(outcomeIdx * 2, priceYesRaw, quantityRaw, _expireNs(ref), ORDER_TYPE_IOC, SELF_MATCH_CANCEL_TAKER, address(0), 0, 0);
        return (cash0 - _cash(ref.pool), outcomeToken.balanceOf(address(this), id) - tokens0);
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

    /// @notice The size `stake` affords on a side off the live book right now — the stake-first quote, and
    ///         exactly what the mint will size at execution — then that size priced.
    function sizeForStake(bytes32 marketId, uint8 outcomeIdx, uint256 stake) external view returns (Preview memory) {
        return _sizeEntry(_resolve(marketId), marketId, outcomeIdx, stake);
    }

    /// @dev Validates the Window and the stake, walks the entry side for what the stake buys, then caps the size so
    ///      the venue's escrow at the walk's limit never exceeds the stake — the slot's own money covers the worst
    ///      case, nobody else's is borrowed even for a block (the vault's rule, `EventVault._requireEscrow`).
    function _sizeEntry(MarketRef memory ref, bytes32 marketId, uint8 outcomeIdx, uint256 stake) internal view returns (Preview memory q) {
        _outcomeId(ref, outcomeIdx);
        Params memory p = params;
        if (stake < p.minStake || stake > p.maxStake) revert StakeOutsideBand(stake, p.minStake, p.maxStake);
        uint8 status = IBinaryMarket(ref.market).status();
        if (status != STATUS_TRADING) revert MarketNotTrading(marketId, status);
        if (ref.expiry < block.timestamp + p.minTimeLeftSec) revert TooLate(marketId, ref.expiry);
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
