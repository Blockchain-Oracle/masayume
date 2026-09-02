// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool, IOutcomeToken6909} from "../interfaces/IDreamDex.sol";
import {IEventVault} from "./IEventVault.sol";

/// @title The vault's one seam to DreamDEX.
/// @notice The vault is the venue's trader: it places IOC orders as itself and holds the outcome
///         tokens, so what it can attribute to an owner is exactly what moved in that call —
///         collateral in or out, outcome tokens in or out — measured before and after.
/// @dev Nothing here stores or emits a pool address. Every pool is resolved from the venue's
///      market id inside the transaction (AD-10).
abstract contract VenueGateway is IEventVault {
    using SafeERC20 for IERC20;

    uint8 internal constant STATUS_TRADING = 1;
    uint8 internal constant ORDER_TYPE_IOC = 2;
    uint8 internal constant SELF_MATCH_CANCEL_TAKER = 0;

    IERC20 public immutable collateral;
    IBinaryModule public immutable module;
    IOutcomeToken6909 public immutable outcomeToken;
    /// @dev One whole unit of collateral (10^decimals); prices are collateral per whole outcome token.
    uint256 public immutable one;

    struct MarketRef {
        address market;
        address pool;
        uint256 yesId;
        uint256 noId;
        uint32 operatorId;
        bytes32 venueId;
    }

    constructor(IERC20 collateral_, IBinaryModule module_, IOutcomeToken6909 outcomeToken_) {
        collateral = collateral_;
        module = module_;
        outcomeToken = outcomeToken_;
        one = 10 ** IERC20Metadata(address(collateral_)).decimals();
    }

    /// @notice Moves the vault's own credit on `pool` into its wallet balance. Anyone may call;
    ///         the credit is the vault's either way, so nothing changes hands.
    function sweep(address pool) external returns (uint256 amount) {
        amount = IBinaryPool(pool).getWithdrawableBalance(address(this), address(collateral));
        if (amount == 0) return 0;
        IBinaryPool(pool).withdraw(address(collateral), amount);
        emit Swept(amount);
    }

    /// @dev Everything about a Window comes off the module by market id, in-transaction.
    function _resolve(bytes32 marketId) internal view returns (MarketRef memory ref) {
        (,,, address coll, uint32 operatorId, bytes32 venueId,,, address market, address pool, uint256 yesId, uint256 noId,,) =
            module.markets(marketId);
        if (market == address(0) || pool == address(0)) revert UnknownMarket(marketId);
        if (coll != address(collateral)) revert WrongCollateral(coll);
        ref = MarketRef(market, pool, yesId, noId, operatorId, venueId);
    }

    function _outcomeId(MarketRef memory ref, uint8 outcomeIdx) internal pure returns (uint256) {
        if (outcomeIdx > 1) revert BadOutcome(outcomeIdx);
        return outcomeIdx == 0 ? ref.yesId : ref.noId;
    }

    /// @dev Collateral the vault can spend on `pool`: its wallet balance plus the pool's credit for it.
    ///      Escrow is drawn credit-first, and refunds may land as credit, so both halves count.
    function _cash(address pool) internal view returns (uint256) {
        return collateral.balanceOf(address(this)) + IBinaryPool(pool).getWithdrawableBalance(address(this), address(collateral));
    }

    function _ensurePoolApprovals(address pool, bool isBuy) internal {
        if (isBuy) {
            if (collateral.allowance(address(this), pool) < type(uint128).max) collateral.forceApprove(pool, type(uint256).max);
        } else if (!outcomeToken.isOperator(address(this), pool)) {
            outcomeToken.setOperator(pool, true);
        }
    }

    /// @dev Places one IOC order as the vault and reports what actually moved.
    /// @return cashDelta collateral spent (buy) or received (sell), fees included
    /// @return tokenDelta outcome tokens gained (buy) or sold (sell)
    function _placeIoc(MarketRef memory ref, uint8 outcomeIdx, bool isBuy, uint256 priceRaw, uint256 quantityRaw, uint64 expireNs)
        internal
        returns (uint256 cashDelta, uint256 tokenDelta)
    {
        uint8 status = IBinaryMarket(ref.market).status();
        if (status != STATUS_TRADING) revert MarketNotTrading(status);
        uint256 id = _outcomeId(ref, outcomeIdx);
        _ensurePoolApprovals(ref.pool, isBuy);

        uint256 cash0 = _cash(ref.pool);
        uint256 tokens0 = outcomeToken.balanceOf(address(this), id);
        IBinaryPool(ref.pool).placeBinaryOrder(
            _kind(outcomeIdx, isBuy), priceRaw, quantityRaw, expireNs, ORDER_TYPE_IOC, SELF_MATCH_CANCEL_TAKER, address(0), 0, 0
        );
        uint256 cash1 = _cash(ref.pool);
        uint256 tokens1 = outcomeToken.balanceOf(address(this), id);

        if (isBuy) return (cash0 - cash1, tokens1 - tokens0);
        return (cash1 - cash0, tokens0 - tokens1);
    }

    /// @dev BUY_YES 0, SELL_YES 1, BUY_NO 2, SELL_NO 3 — the pool's `OrderKind`.
    function _kind(uint8 outcomeIdx, bool isBuy) internal pure returns (uint8) {
        return (outcomeIdx * 2) + (isBuy ? 0 : 1);
    }

    /// @dev The order's price in the bought side's own terms: the pool quotes YES; NO costs the rest.
    function _sidePrice(uint8 outcomeIdx, uint256 priceRaw) internal view returns (uint256) {
        return outcomeIdx == 0 ? priceRaw : one - priceRaw;
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
}
