// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title MarketMakerVault's public vocabulary — the book per Window, params, events and errors.
/// @notice One interface so the adapter, the actor, the tests and the contract read the same ABI.
interface IMarketMakerVault {
    /// @dev What flowed through one Window, in collateral: out to the venue as escrow, back from
    ///      cancels, back from merged pairs, back from settlement. Deployed capital is
    ///      `escrowOut − escrowBack − merged − payout` (floored at zero); the Window's realized
    ///      result is the same sum, signed, once settled.
    struct WindowBook {
        uint128 escrowOut;
        uint128 escrowBack;
        uint128 merged;
        uint128 payout;
        uint64 openedAtSec;
        uint64 settledAtSec;
        uint32 quoteCount;
        bool settled;
    }

    struct Params {
        /// @dev Aggregate deployed capital cap as a fraction of total value.
        uint16 maxExposureBps;
        /// @dev A pair's ask must sit at least this far above its bid, in YES terms: `askYes − bidYes ≥ minSpreadRaw`.
        uint256 minSpreadRaw;
        /// @dev Both prices sit inside these, per whole unit — no quoting a decided Window.
        uint256 minPriceRaw;
        uint256 maxPriceRaw;
        /// @dev Contracts per side per quote, raw.
        uint256 maxQuantityRaw;
        /// @dev Deployed capital cap per Window, base units.
        uint256 maxWindowDeployed;
        uint32 maxOpenWindows;
        /// @dev No quotes inside the last seconds of a Window.
        uint32 minTimeLeftSec;
    }

    event Supplied(address indexed who, uint256 amount, uint256 shares, uint256 liquid);
    event SupplyRedeemed(address indexed who, uint256 amount, uint256 shares, uint256 liquid);
    event ParamsUpdated(Params params);
    event MakerChanged(address indexed maker);
    event PausedSet(bool paused);
    event AdminChanged(address indexed admin);
    /// @dev Carries the market id only — never a pool or market address (AD-10).
    event Quoted(bytes32 indexed marketId, uint256 bidYesRaw, uint256 askYesRaw, uint256 quantityRaw, uint256 escrow, uint128 bidOrderId, uint128 askOrderId);
    event Pulled(bytes32 indexed marketId, uint256 orders, uint256 returned, address by);
    event Merged(bytes32 indexed marketId, uint256 pairs, uint256 returned, address by);
    event WindowSettled(bytes32 indexed marketId, uint256 payout, uint256 yesRaw, uint256 noRaw, int256 realized, address by);
    event Swept(uint256 amount);

    error NotAdmin(address caller);
    error NotMaker(address caller);
    error ZeroAddress();
    error ZeroAmount();
    error BadParams();
    error IsPaused();
    error UnknownMarket(bytes32 marketId);
    error WrongCollateral(address got);
    error MarketNotTrading(bytes32 marketId, uint8 status);
    error TooLate(bytes32 marketId, uint64 expirySec);
    error BadExpiry(uint64 expireNs, uint64 expirySec);
    error BadPrice(uint256 priceRaw);
    error SpreadTooThin(uint256 bidYesRaw, uint256 askYesRaw, uint256 minSpreadRaw);
    error OverQuantity(uint256 quantityRaw, uint256 cap);
    error OverWindowCap(bytes32 marketId, uint256 wouldBe, uint256 cap);
    error OverExposure(uint256 wouldBeDeployed, uint256 totalValue, uint16 maxExposureBps);
    error TooManyWindows(uint32 open, uint32 cap);
    error InsufficientLiquidity(uint256 needed, uint256 liquid);
    error InsufficientShares(uint256 requested, uint256 held);
    error UnsettledWindow(bytes32 marketId);
    error MarketNotSettled(bytes32 marketId);
    error NothingToMerge(bytes32 marketId);
    error NotQuoted(bytes32 marketId);
    error OrderNotRested(bytes32 marketId);
}
