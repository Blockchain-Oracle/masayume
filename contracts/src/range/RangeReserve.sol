// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IBinaryModule} from "../interfaces/IDreamDex.sol";
import {IOracleHub} from "../interfaces/IOracleHub.sol";
import {RangeMath} from "./RangeMath.sol";
import {RangePricing} from "./RangePricing.sol";

/// @title RangeReserve — a band on one Window's closing print; the house pre-funds the whole payout.
/// @notice The reference's Range is a both-ends-finite band the venue priced and settled on its own
///         feed (`ticket624.core.ts` §range, `Ticket624Drawer` range mode). Here the band settles on the
///         OracleHub's answer to the Window's own closing question (context/43): the same print the
///         Window's Up/Down settles on, in cents, readable two seconds after expiry. Suppliers hold shares
///         of `liquid + locked`; they earn lost stakes and pay winning bands.
/// @dev Settlement is permissionless and idempotent: `settle` reads the hub; while the hub is pending it
///      reverts `NotSettled` — crank again. A voided question refunds. A question the hub never answers is
///      voidable by anyone after `staleAfterSec`. Storage and events carry market ids only (AD-10). Claim
///      and refund pay `owner`, never the caller (AD-5).
contract RangeReserve is RangePricing, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Withdrawable supplier capital plus kept stakes. The escrow of LIVE and WON rounds sits outside
    ///      it: `balanceOf(this) == liquid + Σ (stake + houseLocked)` over those rounds.
    uint256 public liquid;
    /// @dev Σ `houseLocked` over LIVE and WON rounds — the reserve's contingent liability.
    uint256 public locked;
    uint256 public supplyShares;
    mapping(address supplier => uint256 shares) public sharesOf;
    /// @dev Contingent liability per settlement instant: every band on one print is decided together.
    mapping(uint64 expirySec => uint256 amount) public lockedByExpiry;

    /// @dev `roundId` is the 1-based index; 0 means "none".
    Round[] private _rounds;
    mapping(uint256 roundId => Basis) private _basisOf;
    mapping(address owner => uint256[] roundIds) private _roundsOf;

    constructor(IERC20 collateral_, IBinaryModule module_, IOracleHub hub_, bytes32 venueId_, Params memory params_)
        RangePricing(collateral_, module_, hub_, venueId_, params_)
    {}

    // ------------------------------------------------------------------ suppliers

    /// @notice Capital for the reserve, as shares of its total value. Locked capital is not withdrawable.
    function supply(uint256 amount) external nonReentrant returns (uint256 shares) {
        if (paused) revert IsPaused();
        if (amount == 0) revert ZeroAmount();
        uint256 tv = totalValue();
        shares = (supplyShares == 0 || tv == 0) ? amount : amount * supplyShares / tv;
        if (shares == 0) revert ZeroAmount();
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        supplyShares += shares;
        sharesOf[msg.sender] += shares;
        liquid += amount;
        emit Supplied(msg.sender, amount, shares, liquid);
    }

    /// @notice Redeems shares for their part of the total value, from `liquid` only, to the caller.
    function withdraw(uint256 shares) external nonReentrant returns (uint256 amount) {
        if (shares == 0) revert ZeroAmount();
        uint256 held = sharesOf[msg.sender];
        if (held < shares) revert InsufficientShares(shares, held);
        amount = shares * totalValue() / supplyShares;
        if (liquid < amount) revert InsufficientLiquidity(amount, liquid);
        sharesOf[msg.sender] = held - shares;
        supplyShares -= shares;
        liquid -= amount;
        collateral.safeTransfer(msg.sender, amount);
        emit SupplyRedeemed(msg.sender, amount, shares, liquid);
    }

    // ------------------------------------------------------------------ open

    /// @notice Opens a round: prices the band off the hub's opening print, the Window's book and the house's
    ///         volatility, takes the floored stake from the caller (at most `maxStake`) and escrows the whole
    ///         `maxPayout` — stake plus the house's part.
    function openRange(
        bytes32 marketId,
        string calldata asset,
        Side side,
        int256 lowPrint,
        int256 highPrint,
        uint256 maxPayout,
        uint256 maxStake
    ) external nonReentrant returns (uint256 roundId, uint256 stake) {
        if (paused) revert IsPaused();
        Priced memory q = _price(marketId, asset, side, lowPrint, highPrint, maxPayout);
        stake = q.stake;
        if (stake > maxStake) revert StakeAboveMax(stake, maxStake);
        uint256 houseLocked = maxPayout - stake;
        _requireCapacity(houseLocked, q.expiry);

        if (!q.proven) assetKeyOf[marketId] = q.assetKey;
        if (openingPrintOf[marketId] == 0) openingPrintOf[marketId] = q.openingPrint;

        collateral.safeTransferFrom(msg.sender, address(this), stake);
        liquid -= houseLocked;
        locked += houseLocked;
        lockedByExpiry[q.expiry] += houseLocked;

        _rounds.push(
            Round({
                owner: msg.sender,
                status: RoundStatus.LIVE,
                side: side,
                marketId: marketId,
                oracleQuestionId: q.questionId,
                expirySec: q.expiry,
                openedAtSec: uint64(block.timestamp),
                settledAtSec: 0,
                openingPrint: q.openingPrint,
                lowPrint: lowPrint,
                highPrint: highPrint,
                closingPrint: 0,
                stake: stake,
                maxPayout: maxPayout,
                houseLocked: houseLocked,
                probRaw: q.probRaw
            })
        );
        roundId = _rounds.length;
        _basisOf[roundId] = q.basis;
        _roundsOf[msg.sender].push(roundId);
        emit RangeOpened(roundId, msg.sender, marketId, side, lowPrint, highPrint, stake, maxPayout, q.probRaw, q.expiry);
        emit RangeBasis(roundId, q.questionId, q.openingPrint, q.basis.centerQE6, q.basis.sigmaE8, q.basis.tauSec);
    }

    /// @notice The reserve's caps for a round that would lock `houseLocked` on `expirySec`: what `openRange` checks after pricing.
    function checkCapacity(uint256 houseLocked, uint64 expirySec) external view {
        _requireCapacity(houseLocked, expirySec);
    }

    // ------------------------------------------------------------------ settlement

    /// @notice Settles a round on the hub's answer to its Window's question. Permissionless and idempotent:
    ///         a settled round is a no-op; a pending question reverts — crank again later. A voided question
    ///         refunds the stake to the owner; a print inside the band pays INSIDE, outside pays OUTSIDE.
    function settle(uint256 roundId) external nonReentrant {
        Round storage r = _roundOf(roundId);
        if (r.status != RoundStatus.LIVE) return;
        (int256 print, bool voided, bool answered) = _answer(r.oracleQuestionId);
        if (!answered) revert NotSettled(roundId);
        r.settledAtSec = uint64(block.timestamp);
        if (voided) {
            _refund(roundId, r);
            return;
        }
        r.closingPrint = print;
        bool inside = print >= r.lowPrint && print <= r.highPrint;
        bool won = (r.side == Side.INSIDE) == inside;
        if (won) {
            r.status = RoundStatus.WON;
        } else {
            r.status = RoundStatus.LOST;
            liquid += r.stake + r.houseLocked;
            _release(r);
        }
        emit RangeSettled(roundId, r.owner, r.status, print, msg.sender);
    }

    /// @notice Voids a round whose question the hub still has not answered `staleAfterSec` after expiry,
    ///         refunding the stake to the owner. Anyone may call; a question that has answered must be settled instead.
    function voidStale(uint256 roundId) external nonReentrant {
        Round storage r = _roundOf(roundId);
        if (r.status != RoundStatus.LIVE) return;
        uint64 staleAt = r.expirySec + params.staleAfterSec;
        if (block.timestamp < staleAt) revert NotStale(roundId, staleAt);
        (,, bool answered) = _answer(r.oracleQuestionId);
        if (answered) revert NotStale(roundId, staleAt);
        r.settledAtSec = uint64(block.timestamp);
        _refund(roundId, r);
    }

    /// @notice Pays a won round's whole escrow to its owner. Anyone may call; the money only ever goes to
    ///         `owner`, so a payout never waits on a keeper.
    function claim(uint256 roundId) external nonReentrant returns (uint256 payout) {
        Round storage r = _roundOf(roundId);
        if (r.status != RoundStatus.WON) revert NotWon(roundId, r.status);
        r.status = RoundStatus.CLAIMED;
        _release(r);
        payout = r.maxPayout;
        collateral.safeTransfer(r.owner, payout);
        emit RangeClaimed(roundId, r.owner, payout, msg.sender);
    }

    // ------------------------------------------------------------------ views

    function totalValue() public view returns (uint256) {
        return liquid + locked;
    }

    function utilizationBps() external view returns (uint256) {
        uint256 tv = totalValue();
        return tv == 0 ? 0 : locked * RangeMath.BPS / tv;
    }

    function roundCount() external view returns (uint256) {
        return _rounds.length;
    }

    function roundOf(uint256 roundId) external view returns (Round memory) {
        return _roundOf(roundId);
    }

    function basisOf(uint256 roundId) external view returns (Basis memory) {
        _roundOf(roundId);
        return _basisOf[roundId];
    }

    function roundCountOf(address owner) external view returns (uint256) {
        return _roundsOf[owner].length;
    }

    /// @notice An owner's rounds, oldest first, paged — readable without an event scan.
    function roundsOf(address owner, uint256 offset, uint256 limit) external view returns (uint256[] memory page) {
        uint256[] storage all = _roundsOf[owner];
        if (offset >= all.length) return page;
        uint256 end = offset + limit;
        if (end > all.length) end = all.length;
        page = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = all[i];
        }
    }

    /// @notice The hub's answer to a question as the reserve reads it: `answered` is false while the hub is pending.
    function answerOf(uint256 oracleQuestionId) external view returns (int256 print, bool voided, bool answered) {
        return _answer(oracleQuestionId);
    }

    // ------------------------------------------------------------------ internals

    /// @dev The hub reverts with one selector while pending; any revert reads as "not yet", never as a verdict.
    function _answer(uint256 oracleQuestionId) internal view returns (int256 print, bool voided, bool answered) {
        try hub.pullNumericAnswer(oracleQuestionId) returns (int256 value, bool isVoided) {
            return (value, isVoided, true);
        } catch {
            return (0, false, false);
        }
    }

    /// @dev Liquidity first (an empty reserve says so plainly), then the exposure cap, then the per-expiry sub-cap.
    function _requireCapacity(uint256 houseLocked, uint64 expirySec) internal view {
        if (liquid < houseLocked) revert InsufficientLiquidity(houseLocked, liquid);
        uint256 tv = totalValue();
        uint256 wouldBe = locked + houseLocked;
        if (wouldBe * RangeMath.BPS > tv * params.maxExposureBps) revert OverExposure(wouldBe, tv, params.maxExposureBps);
        uint256 next = lockedByExpiry[expirySec] + houseLocked;
        if (next > params.maxExpiryLocked) revert OverExpiryCap(expirySec, next, params.maxExpiryLocked);
    }

    function _refund(uint256 roundId, Round storage r) internal {
        r.status = RoundStatus.VOID;
        liquid += r.houseLocked;
        _release(r);
        collateral.safeTransfer(r.owner, r.stake);
        emit RangeSettled(roundId, r.owner, RoundStatus.VOID, 0, msg.sender);
    }

    /// @dev Releases a round's contingent liability from the aggregate and from its expiry instant.
    function _release(Round storage r) internal {
        uint256 h = r.houseLocked;
        locked = locked > h ? locked - h : 0;
        uint256 cur = lockedByExpiry[r.expirySec];
        lockedByExpiry[r.expirySec] = cur > h ? cur - h : 0;
    }

    function _roundOf(uint256 roundId) internal view returns (Round storage) {
        if (roundId == 0 || roundId > _rounds.length) revert NoSuchRound(roundId);
        return _rounds[roundId - 1];
    }
}
