// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IRangeReserve} from "../src/range/IRangeReserve.sol";
import {RangeTestBase} from "./RangeTestBase.sol";

/// @notice Settlement on the hub's answer, the claim that pays the owner and nobody else, the void that
///         refunds, the stale void, and the supplier accounting around all of it.
contract RangeReserveLifecycleTest is RangeTestBase {
    uint256 internal constant PAYOUT = 100 * ONE;
    uint256 internal id;
    uint256 internal stake;
    int256 internal low;
    int256 internal high;

    function setUp() public override {
        super.setUp();
        (low, high) = band(30);
        (id, stake) = openAs(opener, IRangeReserve.Side.INSIDE, low, high, PAYOUT);
    }

    function test_settle_waitsOnTheHub() public {
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NotSettled.selector, id));
        reserve.settle(id);
        (,, bool answered) = reserve.answerOf(Q_CLOSE);
        assertFalse(answered);
    }

    function test_settle_insideWinsAndClaimPaysTheOwnerWhoeverCalls() public {
        hub.setAnswer(Q_CLOSE, P0 + 1_000, false);
        vm.prank(stranger);
        reserve.settle(id);
        IRangeReserve.Round memory r = reserve.roundOf(id);
        assertEq(uint8(r.status), uint8(IRangeReserve.RoundStatus.WON));
        assertEq(r.closingPrint, P0 + 1_000);
        assertEq(r.settledAtSec, NOW);
        assertEq(reserve.locked(), r.houseLocked, "liability stays until the payout leaves");
        assertBooksBalance();

        uint256 ownerBefore = coll.balanceOf(opener);
        uint256 strangerBefore = coll.balanceOf(stranger);
        vm.prank(stranger);
        uint256 paid = reserve.claim(id);
        assertEq(paid, PAYOUT);
        assertEq(coll.balanceOf(opener), ownerBefore + PAYOUT, "the owner is paid");
        assertEq(coll.balanceOf(stranger), strangerBefore, "the caller gets nothing");
        assertEq(uint8(reserve.roundOf(id).status), uint8(IRangeReserve.RoundStatus.CLAIMED));
        assertEq(reserve.locked(), 0);
        assertEq(reserve.lockedByExpiry(EXPIRY), 0);
        assertEq(reserve.liquid(), SUPPLY - (PAYOUT - stake), "the house paid its part");
        assertBooksBalance();

        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NotWon.selector, id, IRangeReserve.RoundStatus.CLAIMED));
        reserve.claim(id);
    }

    function test_settle_outsideThePrintLosesAndKeepsTheStake() public {
        hub.setAnswer(Q_CLOSE, P0 + 5_000, false);
        reserve.settle(id);
        assertEq(uint8(reserve.roundOf(id).status), uint8(IRangeReserve.RoundStatus.LOST));
        assertEq(reserve.liquid(), SUPPLY + stake, "the stake is the suppliers'");
        assertEq(reserve.locked(), 0);
        assertBooksBalance();
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NotWon.selector, id, IRangeReserve.RoundStatus.LOST));
        reserve.claim(id);
        // Idempotent: settling again changes nothing.
        reserve.settle(id);
        assertEq(reserve.liquid(), SUPPLY + stake);
    }

    function test_settle_theBandIsInclusive() public {
        hub.setAnswer(Q_CLOSE, high, false);
        reserve.settle(id);
        assertEq(uint8(reserve.roundOf(id).status), uint8(IRangeReserve.RoundStatus.WON), "the top edge is inside");
        (uint256 id2,) = openAs(opener, IRangeReserve.Side.OUTSIDE, low, high, PAYOUT);
        reserve.settle(id2);
        assertEq(uint8(reserve.roundOf(id2).status), uint8(IRangeReserve.RoundStatus.LOST), "so OUTSIDE loses on it");
    }

    function test_settle_outsideSideWinsWhenThePrintLeavesTheBand() public {
        (uint256 id2, uint256 stake2) = openAs(opener, IRangeReserve.Side.OUTSIDE, low, high, PAYOUT);
        hub.setAnswer(Q_CLOSE, P0 - 9_000, false);
        reserve.settle(id2);
        assertEq(uint8(reserve.roundOf(id2).status), uint8(IRangeReserve.RoundStatus.WON));
        reserve.settle(id);
        assertEq(uint8(reserve.roundOf(id).status), uint8(IRangeReserve.RoundStatus.LOST));
        reserve.claim(id2);
        assertEq(reserve.liquid(), SUPPLY + stake - (PAYOUT - stake2));
        assertBooksBalance();
    }

    function test_settle_aVoidedQuestionRefundsTheOwner() public {
        hub.setAnswer(Q_CLOSE, 0, true);
        uint256 before = coll.balanceOf(opener);
        vm.prank(stranger);
        reserve.settle(id);
        assertEq(uint8(reserve.roundOf(id).status), uint8(IRangeReserve.RoundStatus.VOID));
        assertEq(coll.balanceOf(opener), before + stake, "the stake goes home");
        assertEq(reserve.liquid(), SUPPLY, "the house's part is back");
        assertEq(reserve.locked(), 0);
        assertBooksBalance();
    }

    function test_voidStale_refundsOnlyAfterTheGraceAndOnlyWhilePending() public {
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NotStale.selector, id, uint64(EXPIRY + 6 hours)));
        reserve.voidStale(id);
        vm.warp(EXPIRY + 6 hours);
        hub.setAnswer(Q_CLOSE, P0, false);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NotStale.selector, id, uint64(EXPIRY + 6 hours)));
        reserve.voidStale(id);
        hub.clearAnswer(Q_CLOSE);
        uint256 before = coll.balanceOf(opener);
        vm.prank(stranger);
        reserve.voidStale(id);
        assertEq(uint8(reserve.roundOf(id).status), uint8(IRangeReserve.RoundStatus.VOID));
        assertEq(coll.balanceOf(opener), before + stake);
        assertEq(reserve.liquid(), SUPPLY);
        assertBooksBalance();
        reserve.voidStale(id);
        assertEq(reserve.liquid(), SUPPLY, "idempotent");
    }

    function test_suppliers_earnLostStakesAndPayWins() public {
        hub.setAnswer(Q_CLOSE, P0 + 5_000, false);
        reserve.settle(id);
        assertEq(reserve.totalValue(), SUPPLY + stake);
        coll.mint(stranger, 1_000 * ONE);
        vm.startPrank(stranger);
        coll.approve(address(reserve), type(uint256).max);
        uint256 shares = reserve.supply(100 * ONE);
        vm.stopPrank();
        assertLt(shares, 100 * ONE, "a later supplier buys in at the higher share price");
        uint256 houseShares = reserve.sharesOf(house);
        vm.prank(house);
        uint256 got = reserve.withdraw(houseShares);
        assertApproxEqAbs(got, SUPPLY + stake, 2, "the first supplier leaves with the kept stake");
        assertBooksBalance();
    }

    function test_withdraw_refusesWhatIsLockedAndSettlementNeverPauses() public {
        reserve.setPaused(true);
        vm.expectRevert(IRangeReserve.IsPaused.selector);
        vm.prank(house);
        reserve.supply(ONE);
        uint256 shares = reserve.sharesOf(house);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.InsufficientLiquidity.selector, SUPPLY, SUPPLY - (PAYOUT - stake)));
        vm.prank(house);
        reserve.withdraw(shares);
        hub.setAnswer(Q_CLOSE, P0, false);
        reserve.settle(id);
        reserve.claim(id);
        vm.prank(house);
        reserve.withdraw(shares);
        assertEq(reserve.liquid(), 0);
    }

    function test_admin_isTheOnlyTuner() public {
        IRangeReserve.Params memory p = defaultParams();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NotAdmin.selector, stranger));
        reserve.setParams(p);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NotAdmin.selector, stranger));
        reserve.setVolatility(BTC, 1);
        p.minProbRaw = p.maxProbRaw;
        vm.expectRevert(IRangeReserve.BadParams.selector);
        reserve.setParams(p);
        p = defaultParams();
        p.maxHorizonSec = p.minTimeLeftSec;
        vm.expectRevert(IRangeReserve.BadParams.selector);
        reserve.setParams(p);
        vm.expectRevert(IRangeReserve.ZeroAddress.selector);
        reserve.setAdmin(address(0));
        reserve.setAdmin(stranger);
        assertEq(reserve.admin(), stranger);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NoSuchRound.selector, 0));
        reserve.roundOf(0);
    }
}
