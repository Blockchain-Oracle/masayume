// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title RangeReserve's public vocabulary — rounds, params, events and errors.
/// @notice One interface so the adapter, the tests and the contract read the same ABI.
interface IRangeReserve {
    /// @dev LIVE until the hub answers the Window's question; WON is claimable; LOST kept the stake;
    ///      VOID refunded it; CLAIMED after a won round's payout has left.
    enum RoundStatus {
        LIVE,
        WON,
        LOST,
        VOID,
        CLAIMED
    }

    /// @dev INSIDE wins when the closing print lands in `[low, high]`; OUTSIDE when it does not.
    enum Side {
        INSIDE,
        OUTSIDE
    }

    struct Round {
        address owner;
        RoundStatus status;
        Side side;
        bytes32 marketId;
        /// @dev The closing question the module row named at open — the round's only settlement source.
        uint256 oracleQuestionId;
        uint64 expirySec;
        uint64 openedAtSec;
        uint64 settledAtSec;
        /// @dev Prints in the oracle's own scale (cents). `closingPrint` is 0 until settled.
        int256 openingPrint;
        int256 lowPrint;
        int256 highPrint;
        int256 closingPrint;
        uint256 stake;
        uint256 maxPayout;
        /// @dev `maxPayout - stake`: the reserve's contingent contribution, escrowed at open.
        uint256 houseLocked;
        /// @dev The fair win probability the contract priced the round at, per whole unit of collateral.
        uint256 probRaw;
    }

    /// @dev What the pricing read off the venue and the hub for one open — kept for audit.
    struct Basis {
        uint256 centerQE6;
        uint64 sigmaE8;
        uint32 tauSec;
    }

    struct Params {
        /// @dev House edge over fair value.
        uint16 marginBps;
        /// @dev Aggregate `locked` cap as a fraction of total value.
        uint16 maxExposureBps;
        /// @dev Widest YES bid–ask the centre read accepts, per whole unit.
        uint256 maxSpreadRaw;
        /// @dev Depth (raw contracts) each side of the book is read over for the centre.
        uint256 centerDepthRaw;
        /// @dev P(close ≥ open) off the book must sit inside these, per 1e6: outside, the Window is decided.
        uint32 minCenterQE6;
        uint32 maxCenterQE6;
        /// @dev Reject longshots and near-certainties, per whole unit.
        uint256 minProbRaw;
        uint256 maxProbRaw;
        /// @dev No entries inside the last seconds of a Window, none beyond the model's horizon.
        uint32 minTimeLeftSec;
        uint32 maxHorizonSec;
        /// @dev Anyone may void a round this long after expiry if the hub still has no answer.
        uint32 staleAfterSec;
        /// @dev Per-round jackpot cap and per-expiry aggregate contingent-liability cap, base units.
        uint256 maxPayoutCap;
        uint256 maxExpiryLocked;
    }

    event Supplied(address indexed who, uint256 amount, uint256 shares, uint256 liquid);
    event SupplyRedeemed(address indexed who, uint256 amount, uint256 shares, uint256 liquid);
    event ParamsUpdated(Params params);
    event VolatilitySet(string asset, uint64 sigmaE8);
    event PausedSet(bool paused);
    event AdminChanged(address indexed admin);
    /// @dev Carries the market id only — never a pool or market address (AD-10).
    event RangeOpened(
        uint256 indexed roundId,
        address indexed owner,
        bytes32 indexed marketId,
        Side side,
        int256 lowPrint,
        int256 highPrint,
        uint256 stake,
        uint256 maxPayout,
        uint256 probRaw,
        uint64 expirySec
    );
    event RangeBasis(uint256 indexed roundId, uint256 oracleQuestionId, int256 openingPrint, uint256 centerQE6, uint64 sigmaE8, uint32 tauSec);
    event RangeSettled(uint256 indexed roundId, address indexed owner, RoundStatus status, int256 closingPrint, address by);
    event RangeClaimed(uint256 indexed roundId, address indexed owner, uint256 payout, address by);

    error NotAdmin(address caller);
    error ZeroAddress();
    error ZeroAmount();
    error BadParams();
    error IsPaused();
    error UnknownMarket(bytes32 marketId);
    error WrongCollateral(address got);
    error WrongVenue(bytes32 venueId);
    error WrongOracle(address adapter);
    error WrongAsset(bytes32 marketId, string asset);
    error NoOpeningPrint(bytes32 marketId);
    error NoVolatility(string asset);
    error MarketNotTrading(bytes32 marketId, uint8 status);
    error TooLate(bytes32 marketId, uint64 expirySec);
    error TooFar(bytes32 marketId, uint64 expirySec);
    error BadBand(int256 lowPrint, int256 highPrint);
    error ThinBook(bytes32 marketId, uint256 availableRaw, uint256 neededRaw);
    error WideBook(bytes32 marketId, uint256 spreadRaw, uint256 maxSpreadRaw);
    error WindowDecided(bytes32 marketId, uint256 centerQE6);
    error LongShot(uint256 probRaw, uint256 minProbRaw);
    error NearCertain(uint256 probRaw, uint256 maxProbRaw);
    error OverPayoutCap(uint256 maxPayout, uint256 cap);
    error StakeAboveMax(uint256 stake, uint256 maxStake);
    error Underpriced(uint256 stake, uint256 maxPayout);
    error InsufficientLiquidity(uint256 needed, uint256 liquid);
    error OverExposure(uint256 wouldBeLocked, uint256 totalValue, uint16 maxExposureBps);
    error OverExpiryCap(uint64 expirySec, uint256 wouldBe, uint256 cap);
    error NoSuchRound(uint256 roundId);
    error NotSettled(uint256 roundId);
    error NotStale(uint256 roundId, uint64 staleAtSec);
    error NotWon(uint256 roundId, RoundStatus status);
    error InsufficientShares(uint256 requested, uint256 held);
}
