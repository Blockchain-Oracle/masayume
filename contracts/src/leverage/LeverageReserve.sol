// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IBinaryModule, IOutcomeToken6909} from "../interfaces/IDreamDex.sol";
import {LeverageGateway} from "./LeverageGateway.sol";
import {LeverageMath} from "./LeverageMath.sol";

/// @title LeverageReserve — prefunded, capped leverage on DreamDEX Windows: a knock-out certificate on
///        the venue's own contracts.
/// @notice Ported from the Ticket's own arithmetic in Yosuku (`ticket624.core.ts`: a stake at L× buys
///         `stake·L / price` contracts, a win pays that quantity less the financed `stake·(L−1)`, and
///         "L× can knock out before expiry"). Here the reserve fronts `(L−1)·stake` for a premium, buys
///         the contracts off the resting book as the venue's taker, and holds them as its own hedge.
///         Its claim is repaid first out of whatever the contracts fetch: at settlement, at the owner's
///         cash-out, or at the knock-out anyone may trigger once the book's mark reaches the maintenance
///         line. The owner's loss is never more than the stake; the reserve's is the gap between that
///         line and what the book actually pays, bounded by public caps. Suppliers hold shares of
///         `liquid + outstanding` and may withdraw idle capital once every expired position is settled.
/// @dev Storage and events carry market ids only (AD-10). Every exit pays `owner`, never the caller (AD-5).
contract LeverageReserve is LeverageGateway, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Withdrawable supplier capital plus premiums kept and fronts reclaimed. The reserve's wallet
    ///      balance equals it after every call: venue credit is collected in the same transaction.
    uint256 public liquid;
    /// @dev Σ `fronted` over LIVE positions — the reserve's capital out on the venue, at cost.
    uint256 public outstanding;
    uint256 public supplyShares;
    mapping(address supplier => uint256 shares) public sharesOf;
    /// @dev Fronted capital per Window (the same-print correlation sub-cap).
    mapping(bytes32 marketId => uint256 amount) public frontedByMarket;

    /// @dev `positionId` is the 1-based index; 0 means "none".
    Position[] private _positions;
    mapping(address owner => uint256[] positionIds) private _positionsOf;
    /// @dev LIVE positions, bounded by `maxOpenPositions`, so the keeper's scan and `unsettledExpired` are too.
    uint256[] private _open;
    mapping(uint256 positionId => uint256 indexPlusOne) private _openAt;

    constructor(IERC20 collateral_, IBinaryModule module_, IOutcomeToken6909 outcomeToken_, Params memory params_)
        LeverageGateway(collateral_, module_, outcomeToken_, params_)
    {}

    // ------------------------------------------------------------------ suppliers

    /// @notice Capital for the reserve, as shares of its total value.
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
    ///         Refused while a position past its Window's expiry is unsettled — settle it first (anyone may).
    function withdraw(uint256 shares) external nonReentrant returns (uint256 amount) {
        if (shares == 0) revert ZeroAmount();
        uint256 held = sharesOf[msg.sender];
        if (held < shares) revert InsufficientShares(shares, held);
        uint256 stale = unsettledExpired();
        if (stale != 0) revert UnsettledPosition(stale);
        amount = shares * totalValue() / supplyShares;
        if (liquid < amount) revert InsufficientLiquidity(amount, liquid);
        sharesOf[msg.sender] = held - shares;
        supplyShares -= shares;
        liquid -= amount;
        collateral.safeTransfer(msg.sender, amount);
        emit SupplyRedeemed(msg.sender, amount, shares, liquid);
    }

    // ------------------------------------------------------------------ open

    /// @notice Buys `quantityRaw` of a side at `leverageBps` off the live book and books the position to the
    ///         caller. The stake is what the fill implies (`terms`), charged exactly and never above `maxStake`.
    function open(bytes32 marketId, uint8 outcomeIdx, uint256 quantityRaw, uint32 leverageBps, uint256 maxStake)
        external
        nonReentrant
        returns (uint256 positionId, uint256 stake)
    {
        if (paused) revert IsPaused();
        MarketRef memory ref = _resolve(marketId);
        Preview memory q = _priceEntry(ref, marketId, outcomeIdx, quantityRaw, leverageBps);
        if (q.stake > maxStake) revert StakeAboveMax(q.stake, maxStake);
        if (_open.length >= params.maxOpenPositions) revert TooManyOpen(uint32(_open.length), params.maxOpenPositions);
        // The venue escrows the limit for the whole size up front; the wallet covers it beyond the stake.
        uint256 escrow = LeverageMath.ceilDiv(quantityRaw * LeverageMath.sidePrice(q.limitYesRaw, outcomeIdx == 1, one), one);
        if (liquid + q.stake < escrow) revert InsufficientLiquidity(escrow - q.stake, liquid);

        collateral.safeTransferFrom(msg.sender, address(this), q.stake);
        (uint256 cost, uint256 got) = _placeIoc(ref, outcomeIdx, true, q.limitYesRaw, quantityRaw);
        _collect(ref.pool);
        if (got == 0) revert NothingFilled(marketId);
        uint256 fronted;
        uint256 premium;
        (stake, fronted, premium) = LeverageMath.terms(cost, leverageBps, params.premiumBps);
        if (stake > q.stake) {
            if (stake > maxStake) revert StakeAboveMax(stake, maxStake);
            collateral.safeTransferFrom(msg.sender, address(this), stake - q.stake);
        } else if (stake < q.stake) {
            collateral.safeTransfer(msg.sender, q.stake - stake);
        }
        if (liquid + premium < fronted) revert InsufficientLiquidity(fronted, liquid + premium);
        liquid = liquid + premium - fronted;
        outstanding += fronted;
        frontedByMarket[marketId] += fronted;
        _requireCapacity(marketId, fronted);

        _positions.push(
            Position({
                owner: msg.sender,
                status: PositionStatus.LIVE,
                outcomeIdx: outcomeIdx,
                leverageBps: leverageBps,
                marketId: marketId,
                openedAtSec: uint64(block.timestamp),
                expirySec: ref.expiry,
                exitedAtSec: 0,
                quantityRaw: got,
                stake: stake,
                fronted: fronted,
                premium: premium,
                entryPriceRaw: LeverageMath.ceilDiv(cost * one, got),
                proceeds: 0,
                reclaimed: 0,
                returned: 0
            })
        );
        positionId = _positions.length;
        _positionsOf[msg.sender].push(positionId);
        _open.push(positionId);
        _openAt[positionId] = _open.length;
        emit Opened(positionId, msg.sender, marketId, outcomeIdx, leverageBps, got, stake, fronted, premium, cost);
    }

    // ------------------------------------------------------------------ exits

    /// @notice The owner's cash-out: sells what the book will take at its resting bids, repays the reserve
    ///         first and sends the rest to the owner. `minProceeds` is the owner's own slippage guard.
    function close(uint256 positionId, uint256 minProceeds) external nonReentrant returns (uint256 proceeds, uint256 returned) {
        Position storage p = _live(positionId);
        if (p.owner != msg.sender) revert NotOwner(positionId, msg.sender);
        MarketRef memory ref = _resolve(p.marketId);
        (, uint256 filled, uint256 limit) = _markOver(ref, p.outcomeIdx, p.quantityRaw);
        if (filled == 0) revert NothingFilled(p.marketId);
        uint256 sold;
        (proceeds, sold) = _placeIoc(ref, p.outcomeIdx, false, limit, p.quantityRaw);
        _collect(ref.pool);
        if (sold == 0) revert NothingFilled(p.marketId);
        if (proceeds < minProceeds) revert Slippage(proceeds, minProceeds);
        (, returned) = _exit(positionId, p, PositionStatus.CLOSED, sold, proceeds);
    }

    /// @notice The knock-out anyone may trigger once the book's mark for the position has fallen to the
    ///         maintenance line: sells at the resting bids, repays the reserve first, sends the rest to the owner.
    function knockOut(uint256 positionId) external nonReentrant returns (uint256 proceeds, uint256 reclaimed, uint256 returned) {
        Position storage p = _live(positionId);
        MarketRef memory ref = _resolve(p.marketId);
        (uint256 mark, uint256 filled, uint256 limit) = _markOver(ref, p.outcomeIdx, p.quantityRaw);
        uint256 line = p.fronted * params.maintenanceBps / BPS;
        if (!LeverageMath.isKnockable(mark, p.fronted, params.maintenanceBps)) revert StillHealthy(positionId, mark, line);
        if (filled == 0) revert NothingFilled(p.marketId);
        uint256 sold;
        (proceeds, sold) = _placeIoc(ref, p.outcomeIdx, false, limit, p.quantityRaw);
        _collect(ref.pool);
        if (sold == 0) revert NothingFilled(p.marketId);
        (reclaimed, returned) = _exit(positionId, p, PositionStatus.KNOCKED_OUT, sold, proceeds);
    }

    /// @notice Settles a position whose Window the venue has resolved or voided: redeems the contracts,
    ///         repays the reserve first, sends the rest to the owner. Permissionless.
    function settle(uint256 positionId) external nonReentrant returns (uint256 payout, uint256 reclaimed, uint256 returned) {
        Position storage p = _live(positionId);
        MarketRef memory ref = _resolve(p.marketId);
        if (!_isSettled(ref)) revert MarketNotSettled(p.marketId);
        uint256 quantity = p.quantityRaw;
        payout = _redeem(ref, p.marketId, p.outcomeIdx, quantity);
        _collect(ref.pool);
        (reclaimed, returned) = _exit(positionId, p, PositionStatus.SETTLED, quantity, payout);
    }

    // ------------------------------------------------------------------ views

    function totalValue() public view returns (uint256) {
        return liquid + outstanding;
    }

    function utilizationBps() external view returns (uint256) {
        uint256 tv = totalValue();
        return tv == 0 ? 0 : outstanding * BPS / tv;
    }

    function positionCount() external view returns (uint256) {
        return _positions.length;
    }

    function positionOf(uint256 positionId) external view returns (Position memory) {
        return _positionOf(positionId);
    }

    function positionCountOf(address owner) external view returns (uint256) {
        return _positionsOf[owner].length;
    }

    /// @notice An owner's positions, oldest first, paged — readable without an event scan.
    function positionsOf(address owner, uint256 offset, uint256 limit) external view returns (uint256[] memory page) {
        uint256[] storage all = _positionsOf[owner];
        if (offset >= all.length) return page;
        uint256 end = offset + limit;
        if (end > all.length) end = all.length;
        page = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = all[i];
        }
    }

    /// @notice Every LIVE position — what the keeper watches.
    function openPositions() external view returns (uint256[] memory) {
        return _open;
    }

    /// @notice The first LIVE position whose Window has expired, or zero — what blocks a withdrawal until settled.
    function unsettledExpired() public view returns (uint256) {
        for (uint256 i = 0; i < _open.length; i++) {
            if (_positions[_open[i] - 1].expirySec <= block.timestamp) return _open[i];
        }
        return 0;
    }

    /// @notice What the book would pay for a position right now, and whether that is under the knock-out line.
    function markOf(uint256 positionId) external view returns (uint256 markRaw, uint256 filledRaw, uint256 lineRaw, bool knockable) {
        Position storage p = _positionOf(positionId);
        if (p.status != PositionStatus.LIVE) return (0, 0, 0, false);
        (markRaw, filledRaw,) = _markOver(_resolve(p.marketId), p.outcomeIdx, p.quantityRaw);
        lineRaw = p.fronted * params.maintenanceBps / BPS;
        knockable = LeverageMath.isKnockable(markRaw, p.fronted, params.maintenanceBps);
    }

    // ------------------------------------------------------------------ internals

    /// @dev Books what a sale or redemption fetched: the reserve's claim first, the rest to the owner. A
    ///      partial sale leaves the position LIVE with fewer contracts and a smaller claim; a full exit
    ///      books whatever claim went unrecovered as the reserve's loss and closes the position.
    function _exit(uint256 positionId, Position storage p, PositionStatus status, uint256 sold, uint256 proceeds)
        internal
        returns (uint256 reclaimed, uint256 returned)
    {
        (reclaimed, returned) = LeverageMath.split(proceeds, p.fronted);
        p.quantityRaw -= sold;
        p.fronted -= reclaimed;
        p.proceeds += proceeds;
        p.reclaimed += reclaimed;
        p.returned += returned;
        liquid += reclaimed;
        uint256 released = reclaimed;
        if (p.quantityRaw == 0) {
            released += p.fronted;
            p.fronted = 0;
            p.status = status;
            p.exitedAtSec = uint64(block.timestamp);
            _removeOpen(positionId);
        }
        outstanding -= released;
        frontedByMarket[p.marketId] -= released;
        if (returned != 0) collateral.safeTransfer(p.owner, returned);
        emit Exited(positionId, p.owner, p.quantityRaw == 0 ? status : PositionStatus.LIVE, sold, proceeds, reclaimed, returned, msg.sender);
    }

    /// @dev The per-position cap, then the per-Window sub-cap, then the exposure cap — after the front is booked.
    function _requireCapacity(bytes32 marketId, uint256 fronted) internal view {
        Params memory p = params;
        if (fronted > p.maxFrontedPerPosition) revert OverPositionCap(fronted, p.maxFrontedPerPosition);
        if (frontedByMarket[marketId] > p.maxWindowFronted) revert OverWindowCap(marketId, frontedByMarket[marketId], p.maxWindowFronted);
        uint256 tv = totalValue();
        if (outstanding * BPS > tv * p.maxExposureBps) revert OverExposure(outstanding, tv, p.maxExposureBps);
    }

    function _live(uint256 positionId) internal view returns (Position storage p) {
        p = _positionOf(positionId);
        if (p.status != PositionStatus.LIVE) revert NotLive(positionId, p.status);
    }

    function _positionOf(uint256 positionId) internal view returns (Position storage) {
        if (positionId == 0 || positionId > _positions.length) revert NoSuchPosition(positionId);
        return _positions[positionId - 1];
    }

    function _removeOpen(uint256 positionId) internal {
        uint256 at = _openAt[positionId];
        if (at == 0) return;
        uint256 last = _open.length - 1;
        if (at - 1 != last) {
            uint256 moved = _open[last];
            _open[at - 1] = moved;
            _openAt[moved] = at;
        }
        _open.pop();
        delete _openAt[positionId];
    }
}
