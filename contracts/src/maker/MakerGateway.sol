// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool, IOutcomeToken6909} from "../interfaces/IDreamDex.sol";
import {IMarketMakerVault} from "./IMarketMakerVault.sol";

/// @title The maker vault's one seam to DreamDEX.
/// @notice The vault is the venue's maker: it rests post-only bids as itself and holds the outcome
///         tokens the fills leave behind. Every figure it books is a delta of its own cash —
///         wallet balance plus the pool's credit for it — measured around the venue call, and any
///         credit the venue leaves behind is pulled back into the wallet in the same call.
/// @dev Nothing here stores or emits a pool address. Every pool is resolved from the venue's
///      market id inside the transaction (AD-10).
abstract contract MakerGateway is IMarketMakerVault {
    using SafeERC20 for IERC20;

    uint8 internal constant STATUS_TRADING = 1;
    uint8 internal constant BUY_YES = 0;
    uint8 internal constant BUY_NO = 2;
    uint8 internal constant ORDER_TYPE_POST_ONLY = 3;
    uint8 internal constant SELF_MATCH_CANCEL_TAKER = 0;
    uint64 internal constant NS = 1e9;

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
        uint64 expiry;
    }

    constructor(IERC20 collateral_, IBinaryModule module_, IOutcomeToken6909 outcomeToken_) {
        collateral = collateral_;
        module = module_;
        outcomeToken = outcomeToken_;
        one = 10 ** IERC20Metadata(address(collateral_)).decimals();
        // Redemption and merging burn the vault's outcome tokens through the module and its settlement contract.
        outcomeToken_.setOperator(address(module_), true);
        outcomeToken_.setOperator(module_.settlement(), true);
    }

    /// @dev Everything about a Window comes off the module by market id, in-transaction.
    function _resolve(bytes32 marketId) internal view returns (MarketRef memory ref) {
        (,,, address coll, uint32 operatorId, bytes32 venueId,,, address market, address pool, uint256 yesId, uint256 noId,, uint64 expiry) =
            module.markets(marketId);
        if (market == address(0) || pool == address(0)) revert UnknownMarket(marketId);
        if (coll != address(collateral)) revert WrongCollateral(coll);
        ref = MarketRef(market, pool, yesId, noId, operatorId, venueId, expiry);
    }

    /// @dev Collateral the vault can count on `pool`: its wallet balance plus the pool's credit for it.
    function _cash(address pool) internal view returns (uint256) {
        return collateral.balanceOf(address(this)) + IBinaryPool(pool).getWithdrawableBalance(address(this), address(collateral));
    }

    /// @dev Moves the vault's credit on `pool` into its wallet, so `liquid` is always the wallet's balance.
    function _collect(address pool) internal returns (uint256 amount) {
        amount = IBinaryPool(pool).getWithdrawableBalance(address(this), address(collateral));
        if (amount == 0) return 0;
        IBinaryPool(pool).withdraw(address(collateral), amount);
        emit Swept(amount);
    }

    function _ensureAllowance(address pool) internal {
        if (collateral.allowance(address(this), pool) < type(uint128).max) collateral.forceApprove(pool, type(uint256).max);
    }

    /// @dev Rests one post-only order as the vault and reports the escrow the venue took for it. The venue's
    ///      `price` is always the YES price: a BUY_NO at `p` rests as a YES ask at `p` and escrows `one − p` a contract.
    function _rest(MarketRef memory ref, uint8 kind, uint256 priceRaw, uint256 quantityRaw, uint64 expireNs)
        internal
        returns (uint256 escrow, uint128 orderId)
    {
        uint256 cash0 = _cash(ref.pool);
        (bool ok, uint128 id) =
            IBinaryPool(ref.pool).placeBinaryOrder(kind, priceRaw, quantityRaw, expireNs, ORDER_TYPE_POST_ONLY, SELF_MATCH_CANCEL_TAKER, address(0), 0, 0);
        if (!ok || id == 0) revert OrderNotRested(bytes32(0));
        escrow = cash0 - _cash(ref.pool);
        orderId = id;
    }

    /// @dev Cancels every resting order the vault has on the Window's pool — live ones one by one, expired
    ///      ones through the permissionless drain — and reports how many and what came back.
    function _pullAll(MarketRef memory ref) internal returns (uint256 orders, uint256 returned) {
        IBinaryPool pool = IBinaryPool(ref.pool);
        uint128[] memory ids = pool.getOwnOpenOrders();
        if (ids.length == 0) return (0, 0);
        uint256 cash0 = _cash(ref.pool);
        uint128[] memory expired = new uint128[](ids.length);
        uint256 nExpired;
        uint64 nowNs = uint64(block.timestamp) * NS;
        for (uint256 i = 0; i < ids.length; i++) {
            IBinaryPool.Order memory o = pool.getOrder(ids[i]);
            if (o.expireTimestampNs <= nowNs) {
                expired[nExpired++] = ids[i];
            } else {
                pool.cancelOrder(ids[i]);
            }
        }
        if (nExpired != 0) {
            assembly {
                mstore(expired, nExpired)
            }
            pool.cancelExpiredOrders(expired);
        }
        orders = ids.length;
        returned = _cash(ref.pool) - cash0;
    }

    /// @dev Burns `pairs` complete sets through the module and reports the collateral that came back.
    function _merge(MarketRef memory ref, bytes32 marketId, uint256 pairs) internal returns (uint256 back) {
        uint256 cash0 = _cash(ref.pool);
        module.mergeCompleteSet(ref.operatorId, ref.venueId, marketId, pairs);
        back = _cash(ref.pool) - cash0;
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

    function _held(MarketRef memory ref) internal view returns (uint256 yes, uint256 no) {
        yes = outcomeToken.balanceOf(address(this), ref.yesId);
        no = outcomeToken.balanceOf(address(this), ref.noId);
    }
}
