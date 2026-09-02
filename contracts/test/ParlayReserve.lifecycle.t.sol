// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IParlayReserve} from "../src/parlay/IParlayReserve.sol";
import {ParlayTestBase} from "./ParlayTestBase.sol";

/// @notice Settlement leg by leg on the venue's own verdicts, the claim that pays the owner and
///         nobody else, the void that refunds, and the supplier accounting around all of it.
contract ParlayReserveLifecycleTest is ParlayTestBase {
    uint256 internal id;
    uint256 internal stake;
    uint256 internal constant PAYOUT = 100 * ONE;

    function setUp() public override {
        super.setUp();
        (id, stake) = openAs(opener, legs2(marketA, 0, marketB, 1), PAYOUT);
    }

    function test_resolve_refusesAnUnsettledWindow() public {
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.MarketNotSettled.selector, marketA));
        reserve.resolveLeg(id, 0);
    }

    function test_streak_winsThenClaimPaysTheOwnerWhoeverCalls() public {
        windowA.resolve(1, 0); // UP won
        vm.prank(stranger);
        reserve.resolveLeg(id, 0);
        IParlayReserve.Parlay memory p = reserve.parlayOf(id);
        assertEq(p.wonCount, 1);
        assertEq(uint8(p.status), uint8(IParlayReserve.ParlayStatus.LIVE));
        assertEq(uint8(reserve.legsOf(id)[0].status), uint8(IParlayReserve.LegStatus.WON));

        windowB.resolve(0, 1); // DOWN won
        reserve.resolveLeg(id, 1);
        p = reserve.parlayOf(id);
        assertEq(uint8(p.status), uint8(IParlayReserve.ParlayStatus.WON));
        assertEq(reserve.locked(), p.houseLocked, "liability stays until the payout leaves");
        assertBooksBalance();

        uint256 ownerBefore = coll.balanceOf(opener);
        uint256 strangerBefore = coll.balanceOf(stranger);
        vm.prank(stranger);
        uint256 paid = reserve.claim(id);
        assertEq(paid, PAYOUT);
        assertEq(coll.balanceOf(opener), ownerBefore + PAYOUT, "the owner is paid");
        assertEq(coll.balanceOf(stranger), strangerBefore, "the caller gets nothing");
        assertEq(uint8(reserve.parlayOf(id).status), uint8(IParlayReserve.ParlayStatus.CLAIMED));
        assertEq(reserve.locked(), 0);
        assertEq(reserve.lockedByExpiry(NOW + 300), 0);
        assertEq(reserve.lockedByExpiry(NOW + 600), 0);
        assertEq(reserve.liquid(), SUPPLY - (PAYOUT - stake), "the house paid its part");
        assertBooksBalance();

        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.NotWon.selector, id, IParlayReserve.ParlayStatus.CLAIMED));
        reserve.claim(id);
    }

    function test_firstLosingLegKillsTheTicketAndKeepsTheStake() public {
        windowA.resolve(1, 0);
        reserve.resolveLeg(id, 0);
        windowB.resolve(1, 0); // UP won, the ticket had DOWN
        uint256 ownerBefore = coll.balanceOf(opener);
        reserve.resolveLeg(id, 1);
        IParlayReserve.Parlay memory p = reserve.parlayOf(id);
        assertEq(uint8(p.status), uint8(IParlayReserve.ParlayStatus.LOST));
        assertEq(coll.balanceOf(opener), ownerBefore);
        assertEq(reserve.liquid(), SUPPLY + stake, "the stake is the suppliers' now");
        assertEq(reserve.locked(), 0);
        assertBooksBalance();
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.NotWon.selector, id, IParlayReserve.ParlayStatus.LOST));
        reserve.claim(id);
        // Suppliers can take the profit home.
        uint256 houseBefore = coll.balanceOf(house);
        uint256 shares = reserve.sharesOf(house);
        vm.prank(house);
        uint256 out = reserve.withdraw(shares);
        assertEq(out, SUPPLY + stake);
        assertEq(coll.balanceOf(house), houseBefore + out);
    }

    function test_aLossOnTheFirstLegSettlesBeforeTheSecondWindowCloses() public {
        windowA.resolve(0, 1); // DOWN won, the ticket had UP
        reserve.resolveLeg(id, 0);
        assertEq(uint8(reserve.parlayOf(id).status), uint8(IParlayReserve.ParlayStatus.LOST));
        assertEq(reserve.lockedByExpiry(NOW + 600), 0, "the later instant's liability is released too");
        // The second leg is dead weight: resolving it is a no-op even once B settles.
        windowB.resolve(0, 1);
        reserve.resolveLeg(id, 1);
        assertEq(uint8(reserve.legsOf(id)[1].status), uint8(IParlayReserve.LegStatus.PENDING));
    }

    function test_aVoidedWindowVoidsTheTicketAndRefundsTheStake() public {
        windowA.resolve(1, 0);
        reserve.resolveLeg(id, 0);
        windowB.voidIt();
        uint256 ownerBefore = coll.balanceOf(opener);
        vm.prank(stranger);
        reserve.resolveLeg(id, 1);
        IParlayReserve.Parlay memory p = reserve.parlayOf(id);
        assertEq(uint8(p.status), uint8(IParlayReserve.ParlayStatus.VOID));
        assertEq(uint8(reserve.legsOf(id)[1].status), uint8(IParlayReserve.LegStatus.VOID));
        assertEq(coll.balanceOf(opener), ownerBefore + stake, "the stake comes back to the owner");
        assertEq(reserve.liquid(), SUPPLY, "the house's part is back in liquid");
        assertEq(reserve.locked(), 0);
        assertBooksBalance();
    }

    function test_aVectorNamingNoWinnerIsAVoid() public {
        windowA.resolve(1, 1);
        reserve.resolveLeg(id, 0);
        assertEq(uint8(reserve.parlayOf(id).status), uint8(IParlayReserve.ParlayStatus.VOID));
    }

    function test_resolve_isIdempotentUnderRacingCrankers() public {
        windowA.resolve(1, 0);
        reserve.resolveLeg(id, 0);
        reserve.resolveLeg(id, 0);
        assertEq(reserve.parlayOf(id).wonCount, 1, "a settled leg counts once");
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.NoSuchLeg.selector, id, 2));
        reserve.resolveLeg(id, 2);
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.NoSuchParlay.selector, 9));
        reserve.resolveLeg(9, 0);
    }

    function test_threeLegsSharingAnInstantReleaseOnce() public {
        (uint256 id3,) = openAs(opener, legs3(marketA, marketB, marketC), 50 * ONE);
        IParlayReserve.Parlay memory p = reserve.parlayOf(id3);
        uint256 atB = reserve.lockedByExpiry(NOW + 600);
        assertEq(atB, (PAYOUT - stake) + p.houseLocked, "one lock per distinct instant");
        windowA.resolve(1, 0);
        windowB.resolve(1, 0);
        windowC.resolve(1, 0);
        reserve.resolveLeg(id3, 0);
        reserve.resolveLeg(id3, 1);
        reserve.resolveLeg(id3, 2);
        assertEq(uint8(reserve.parlayOf(id3).status), uint8(IParlayReserve.ParlayStatus.WON));
        reserve.claim(id3);
        assertEq(reserve.lockedByExpiry(NOW + 600), PAYOUT - stake, "only the first ticket's lock remains");
        assertBooksBalance();
    }

    function test_supply_sharesTrackTotalValueIncludingLockedCapital() public {
        // Locked capital is part of the value a new supplier buys into.
        uint256 tvBefore = reserve.totalValue();
        uint256 sharesBefore = reserve.supplyShares();
        assertEq(tvBefore, SUPPLY, "locked + liquid is unchanged by an open");
        vm.prank(house);
        uint256 shares = reserve.supply(500 * ONE);
        assertEq(shares, 500 * ONE * sharesBefore / tvBefore, "pro rata");
        // The whole liquid can be withdrawn; the locked part cannot.
        uint256 liquid = reserve.liquid();
        uint256 all = reserve.sharesOf(house);
        uint256 worth = all * reserve.totalValue() / reserve.supplyShares();
        assertGt(worth, liquid);
        vm.prank(house);
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.InsufficientLiquidity.selector, worth, liquid));
        reserve.withdraw(all);
        vm.prank(house);
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.InsufficientShares.selector, all + 1, all));
        reserve.withdraw(all + 1);
    }

    function test_AD5_noFunctionTakesAPayoutDestination() public {
        // The only exits: claim → owner, void → owner, withdraw → the supplier itself. The stranger holds
        // no shares, so its withdraw is refused, and nothing it calls can move the opener's money to it.
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.InsufficientShares.selector, 1, 0));
        reserve.withdraw(1);
    }

    function test_views_pageAnOwnersTickets() public {
        openAs(opener, legs2(marketA, 1, marketB, 0), 20 * ONE);
        assertEq(reserve.parlayCountOf(opener), 2);
        uint256[] memory page = reserve.parlaysOf(opener, 0, 10);
        assertEq(page.length, 2);
        assertEq(page[0], 1);
        assertEq(page[1], 2);
        assertEq(reserve.parlaysOf(opener, 1, 10).length, 1);
        assertEq(reserve.parlaysOf(opener, 5, 10).length, 0);
        assertEq(reserve.parlayCountOf(stranger), 0);
    }
}
