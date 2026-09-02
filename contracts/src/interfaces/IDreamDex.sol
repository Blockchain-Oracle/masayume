// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title The slice of DreamDEX Event Contracts Masayume's contracts talk to.
/// @notice Signatures were taken from `@somnia-chain/markets-sdk` 0.28.1's ABIs
///         (`binaryModuleReadAbi`, `binaryModuleWriteAbi`, `binaryPoolWriteAbi`, `binaryPoolReadAbi`,
///         `erc20VaultReadAbi`, `erc20VaultWriteAbi`, `binaryMarketReadAbi`, `erc6909Abi`).
///         Only what the vault and the reserves call is declared here.
interface IBinaryModule {
    /// @dev Return order mirrors the module's `markets(bytes32)` tuple exactly.
    function markets(bytes32 marketId)
        external
        view
        returns (
            uint256 oracleQuestionId,
            uint8 outcomeSlotCount,
            uint8 voidPolicy,
            address collateral,
            uint32 originOperatorId,
            bytes32 originVenueId,
            address oracleAdapter,
            address creator,
            address market,
            address pool,
            uint256 yesId,
            uint256 noId,
            uint64 tradingStart,
            uint64 expiry
        );

    function redeem(uint32 operatorId, bytes32 venueId, bytes32 marketId, uint8 outcomeIdx, uint256 amount) external;

    /// @dev Burns `amount` YES and `amount` NO held by the caller and returns the collateral that backed them.
    function mergeCompleteSet(uint32 operatorId, bytes32 venueId, bytes32 marketId, uint256 amount) external;

    function finalizeMarket(bytes32 marketId) external;

    function settlement() external view returns (address);
}

interface IBinaryMarket {
    /// @dev `MarketStatus`: Listed(0) Trading(1) Locked(2) Settling(3) Resolved(4) Voided(5).
    function status() external view returns (uint8);
    function isResolved() external view returns (bool);
    function isVoided() external view returns (bool);
    function expiry() external view returns (uint64);
    function settlementWindow() external view returns (uint64);
    /// @dev Settlement v3 stores a payout VECTOR, not a winner: empty until resolved, one-hot for a
    ///      resolved binary. `winningOutcome()` no longer exists on the deployed contract.
    function payoutNumerators() external view returns (uint256[] memory);
    function voidExpired() external;
    function poke() external;
}

interface IBinaryPool {
    /// @dev One aggregated price level of the resting book, in the book's own (YES) terms.
    struct Level {
        uint256 price;
        uint256 quantity;
    }

    /// @dev One resting order as the pool reports it (`getOrder`).
    struct Order {
        uint128 orderId;
        bool isBid;
        address owner;
        uint64 userData;
        uint256 price;
        uint256 fullQuantity;
        uint256 quantityRemaining;
        uint64 expireTimestampNs;
    }

    /// @dev `kind`: BUY_YES(0) SELL_YES(1) BUY_NO(2) SELL_NO(3). `orderType`: 2 = ImmediateOrCancel, 3 = PostOnly.
    ///      Returns the resting order's id (0 when nothing rested).
    function placeBinaryOrder(
        uint8 kind,
        uint256 price,
        uint256 quantity,
        uint64 expireTimestampNs,
        uint8 orderType,
        uint8 selfMatchingOption,
        address builder,
        uint96 builderFeeBpsTimes1k,
        uint64 userData
    ) external returns (bool success, uint128 id);

    /// @dev Cancels one of the caller's resting orders, returning its remaining escrow to the caller.
    function cancelOrder(uint128 orderId) external;

    /// @dev Permissionless: returns the escrow of every EXPIRED order named; live or stale ids are skipped silently.
    function cancelExpiredOrders(uint128[] calldata orderIds) external;

    /// @dev The caller's resting order ids on this pool.
    function getOwnOpenOrders() external view returns (uint128[] memory);

    function getOrder(uint128 orderId) external view returns (Order memory);

    /// @dev The resting book aggregated by price: bids highest first, asks lowest first, expired makers
    ///      skipped. A NO price is one collateral less the YES bid it rests against.
    function getBookLevels(bool isBid, uint64 numLevels) external view returns (Level[] memory);

    /// @dev The pool's internal per-owner credit for `token` (refunds and payouts can land here).
    /// @dev The grid every order sits on: prices in `tickSize` steps, quantities in `lotSize` multiples above `minQuantity`.
    function getOrderBookParameters() external view returns (uint256 tickSize, uint256 minQuantity, uint256 lotSize);

    function getWithdrawableBalance(address owner, address token) external view returns (uint256);
    function withdraw(address token, uint256 amount) external;
    function marketNonce() external view returns (uint64);
}

interface IOutcomeToken6909 {
    function balanceOf(address owner, uint256 id) external view returns (uint256);
    function isOperator(address owner, address spender) external view returns (bool);
    function setOperator(address spender, bool approved) external returns (bool);
}
