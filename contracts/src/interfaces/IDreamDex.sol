// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title The slice of DreamDEX Event Contracts the vault talks to.
/// @notice Signatures were taken from `@somnia-chain/markets-sdk` 0.28.1's ABIs
///         (`binaryModuleReadAbi`, `binaryModuleWriteAbi`, `binaryPoolWriteAbi`,
///         `erc20VaultReadAbi`, `erc20VaultWriteAbi`, `binaryMarketReadAbi`, `erc6909Abi`).
///         Only what the vault calls is declared here.
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
    function voidExpired() external;
    function poke() external;
}

interface IBinaryPool {
    /// @dev `kind`: BUY_YES(0) SELL_YES(1) BUY_NO(2) SELL_NO(3). `orderType`: 2 = ImmediateOrCancel.
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
    ) external;

    /// @dev The pool's internal per-owner credit for `token` (refunds and payouts can land here).
    function getWithdrawableBalance(address owner, address token) external view returns (uint256);
    function withdraw(address token, uint256 amount) external;
    function marketNonce() external view returns (uint64);
}

interface IOutcomeToken6909 {
    function balanceOf(address owner, uint256 id) external view returns (uint256);
    function isOperator(address owner, address spender) external view returns (bool);
    function setOperator(address spender, bool approved) external returns (bool);
}
