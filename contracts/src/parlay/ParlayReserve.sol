// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IBinaryMarket, IBinaryModule} from "../interfaces/IDreamDex.sol";
import {ParlayMath} from "./ParlayMath.sol";
import {ParlayPricing} from "./ParlayPricing.sol";

/// @title ParlayReserve — one ticket, many Windows; the house pre-funds the whole payout.
/// @notice Ported from Yosuku's `parlay624.move`: escrow both sides at open, resolve leg by leg
///         as each Window settles, kill the ticket on the first losing leg, force-pay the owner
///         on a full streak. Suppliers hold shares of `liquid + locked`; they earn lost stakes
///         and pay winning streaks.
/// @dev What DreamDEX changes: a leg settles on the venue's own resolution, read from the market
///      contract. A voided Window voids the ticket and refunds the stake, and `voidExpired()` on
///      the venue is permissionless, so no admin void exists — nothing can trap a refund (AD-5).
///      Storage and events carry market ids only (AD-10). Claim and void pay `owner`, never the caller.
contract ParlayReserve is ParlayPricing, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Withdrawable supplier capital plus kept stakes. The escrow of LIVE and WON tickets sits
    ///      outside it: `balanceOf(this) == liquid + Σ (stake + houseLocked)` over those tickets.
    uint256 public liquid;
    /// @dev Σ `houseLocked` over LIVE and WON tickets — the reserve's contingent liability.
    uint256 public locked;
    uint256 public supplyShares;
    mapping(address supplier => uint256 shares) public sharesOf;
    /// @dev Contingent liability per settlement instant (the same-print correlation sub-cap).
    mapping(uint64 expirySec => uint256 amount) public lockedByExpiry;

    /// @dev `parlayId` is the 1-based index; 0 means "none".
    Parlay[] private _parlays;
    mapping(uint256 parlayId => Leg[]) private _legs;
    mapping(address owner => uint256[] parlayIds) private _parlaysOf;

    constructor(IERC20 collateral_, IBinaryModule module_, Params memory params_) ParlayPricing(collateral_, module_, params_) {}

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

    /// @notice Opens a ticket: prices every leg off the venue's book, takes the floored stake from the
    ///         caller (at most `maxStake`) and escrows the whole `maxPayout` — stake plus the house's part.
    function openParlay(LegInput[] calldata legs, uint256 maxPayout, uint256 maxStake)
        external
        nonReentrant
        returns (uint256 parlayId, uint256 stake)
    {
        if (paused) revert IsPaused();
        Priced memory q = _price(legs, maxPayout);
        stake = q.stake;
        if (stake > maxStake) revert StakeAboveMax(stake, maxStake);
        uint256 houseLocked = maxPayout - stake;
        _requireCapacity(houseLocked, q.expiries);

        collateral.safeTransferFrom(msg.sender, address(this), stake);
        liquid -= houseLocked;
        locked += houseLocked;
        for (uint256 i = 0; i < q.expiries.length; i++) {
            if (!ParlayMath.seenBefore(q.expiries, i)) lockedByExpiry[q.expiries[i]] += houseLocked;
        }

        _parlays.push(
            Parlay({
                owner: msg.sender,
                status: ParlayStatus.LIVE,
                legCount: uint8(legs.length),
                wonCount: 0,
                openedAtSec: uint64(block.timestamp),
                lastExpirySec: q.lastExpirySec,
                stake: stake,
                maxPayout: maxPayout,
                houseLocked: houseLocked,
                combinedProbRaw: q.combinedProbRaw
            })
        );
        parlayId = _parlays.length;
        _parlaysOf[msg.sender].push(parlayId);
        Leg[] storage stored = _legs[parlayId];
        for (uint256 i = 0; i < legs.length; i++) {
            stored.push(
                Leg({
                    marketId: legs[i].marketId,
                    outcomeIdx: legs[i].outcomeIdx,
                    status: LegStatus.PENDING,
                    expirySec: q.expiries[i],
                    resolvedAtSec: 0,
                    priceRaw: q.pricesRaw[i]
                })
            );
            emit LegPriced(parlayId, uint8(i), legs[i].marketId, legs[i].outcomeIdx, q.pricesRaw[i], q.expiries[i]);
        }
        emit ParlayOpened(parlayId, msg.sender, uint8(legs.length), stake, maxPayout, q.combinedProbRaw, q.lastExpirySec);
    }

    /// @notice The reserve's caps for a ticket that would lock `houseLocked`: what `openParlay` checks after pricing.
    function checkCapacity(uint256 houseLocked, uint64[] calldata expiries) external view {
        _requireCapacity(houseLocked, expiries);
    }

    // ------------------------------------------------------------------ settlement

    /// @notice Settles one leg on the venue's resolution. Permissionless and idempotent: a finished
    ///         ticket or a settled leg is a no-op; an unsettled Window reverts — crank again later.
    ///         A losing leg kills the ticket and keeps the escrow; a voided Window voids the ticket
    ///         and refunds the stake to the owner; the last winning leg makes it claimable.
    function resolveLeg(uint256 parlayId, uint256 legIdx) external nonReentrant {
        Parlay storage p = _parlayOf(parlayId);
        Leg[] storage legs = _legs[parlayId];
        if (legIdx >= legs.length) revert NoSuchLeg(parlayId, legIdx);
        if (p.status != ParlayStatus.LIVE) return;
        Leg storage leg = legs[legIdx];
        if (leg.status != LegStatus.PENDING) return;

        (address market,,) = _resolve(leg.marketId);
        LegStatus outcome = _outcomeOf(IBinaryMarket(market), leg.outcomeIdx, leg.marketId);
        leg.status = outcome;
        leg.resolvedAtSec = uint64(block.timestamp);
        emit LegResolved(parlayId, uint8(legIdx), leg.marketId, outcome, msg.sender);

        if (outcome == LegStatus.WON) {
            p.wonCount += 1;
            if (p.wonCount == p.legCount) {
                p.status = ParlayStatus.WON;
                emit ParlayWon(parlayId, p.owner, p.maxPayout);
            }
        } else if (outcome == LegStatus.LOST) {
            p.status = ParlayStatus.LOST;
            liquid += p.stake + p.houseLocked;
            _release(p, legs);
            emit ParlayLost(parlayId, p.owner, p.stake, uint8(legIdx));
        } else {
            p.status = ParlayStatus.VOID;
            liquid += p.houseLocked;
            _release(p, legs);
            collateral.safeTransfer(p.owner, p.stake);
            emit ParlayVoided(parlayId, p.owner, p.stake, uint8(legIdx));
        }
    }

    /// @notice Pays a won ticket's whole escrow to its owner. Anyone may call; the money only ever
    ///         goes to `owner`, so a payout never waits on a keeper (FR-31).
    function claim(uint256 parlayId) external nonReentrant returns (uint256 payout) {
        Parlay storage p = _parlayOf(parlayId);
        if (p.status != ParlayStatus.WON) revert NotWon(parlayId, p.status);
        p.status = ParlayStatus.CLAIMED;
        _release(p, _legs[parlayId]);
        payout = p.maxPayout;
        collateral.safeTransfer(p.owner, payout);
        emit ParlayClaimed(parlayId, p.owner, payout, msg.sender);
    }

    // ------------------------------------------------------------------ views

    function totalValue() public view returns (uint256) {
        return liquid + locked;
    }

    function utilizationBps() external view returns (uint256) {
        uint256 tv = totalValue();
        return tv == 0 ? 0 : locked * ParlayMath.BPS / tv;
    }

    function parlayCount() external view returns (uint256) {
        return _parlays.length;
    }

    function parlayOf(uint256 parlayId) external view returns (Parlay memory) {
        return _parlayOf(parlayId);
    }

    function legsOf(uint256 parlayId) external view returns (Leg[] memory) {
        _parlayOf(parlayId);
        return _legs[parlayId];
    }

    function parlayCountOf(address owner) external view returns (uint256) {
        return _parlaysOf[owner].length;
    }

    /// @notice An owner's tickets, oldest first, paged — readable without an event scan.
    function parlaysOf(address owner, uint256 offset, uint256 limit) external view returns (uint256[] memory page) {
        uint256[] storage all = _parlaysOf[owner];
        if (offset >= all.length) return page;
        uint256 end = offset + limit;
        if (end > all.length) end = all.length;
        page = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = all[i];
        }
    }

    // ------------------------------------------------------------------ internals

    /// @dev Liquidity first (an empty reserve says so plainly), then the exposure cap, then the per-expiry sub-cap.
    function _requireCapacity(uint256 houseLocked, uint64[] memory expiries) internal view {
        if (liquid < houseLocked) revert InsufficientLiquidity(houseLocked, liquid);
        uint256 tv = totalValue();
        uint256 wouldBe = locked + houseLocked;
        if (wouldBe * ParlayMath.BPS > tv * params.maxExposureBps) revert OverExposure(wouldBe, tv, params.maxExposureBps);
        for (uint256 i = 0; i < expiries.length; i++) {
            if (ParlayMath.seenBefore(expiries, i)) continue;
            uint256 next = lockedByExpiry[expiries[i]] + houseLocked;
            if (next > params.maxExpiryLocked) revert OverExpiryCap(expiries[i], next, params.maxExpiryLocked);
        }
    }

    /// @dev The venue's verdict for one side: void when the Window voided, won when its payout beats
    ///      the other side's, lost when the other's beats it. A vector that names no winner is a void.
    function _outcomeOf(IBinaryMarket market, uint8 outcomeIdx, bytes32 marketId) internal view returns (LegStatus) {
        if (market.isVoided()) return LegStatus.VOID;
        if (!market.isResolved()) revert MarketNotSettled(marketId);
        uint256[] memory numerators = market.payoutNumerators();
        if (numerators.length < 2) return LegStatus.VOID;
        uint256 mine = numerators[outcomeIdx];
        uint256 other = numerators[1 - outcomeIdx];
        if (mine > other) return LegStatus.WON;
        if (other > mine) return LegStatus.LOST;
        return LegStatus.VOID;
    }

    /// @dev Releases a ticket's contingent liability from the aggregate and from each distinct expiry.
    function _release(Parlay storage p, Leg[] storage legs) internal {
        uint256 h = p.houseLocked;
        locked = locked > h ? locked - h : 0;
        uint64[] memory expiries = new uint64[](legs.length);
        for (uint256 i = 0; i < legs.length; i++) {
            expiries[i] = legs[i].expirySec;
            if (ParlayMath.seenBefore(expiries, i)) continue;
            uint256 cur = lockedByExpiry[expiries[i]];
            lockedByExpiry[expiries[i]] = cur > h ? cur - h : 0;
        }
    }

    function _parlayOf(uint256 parlayId) internal view returns (Parlay storage) {
        if (parlayId == 0 || parlayId > _parlays.length) revert NoSuchParlay(parlayId);
        return _parlays[parlayId - 1];
    }
}
