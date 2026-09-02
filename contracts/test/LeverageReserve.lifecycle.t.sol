// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ILeverageReserve} from "../src/leverage/ILeverageReserve.sol";
import {LeverageTestBase} from "./LeverageTestBase.sol";

/// @notice Every way a position leaves: settlement on the venue's verdict, the owner's cash-out, the
///         knock-out anyone may trigger at the maintenance line, the partial exits a thin book forces,
///         and the supplier accounting around all of it.
contract LeverageReserveLifecycleTest is LeverageTestBase {
    uint256 internal id;

    function setUp() public override {
        super.setUp();
        (id,) = openFor(opener, marketA, 0, STAKE, TWO_X);
    }

    function test_settle_aWinPaysTheOwnerTheContractsLessTheFront() public {
        poolA.resolve(0);
        uint256 ownerBefore = coll.balanceOf(opener);
        vm.prank(stranger);
        (uint256 payout, uint256 reclaimed, uint256 returned) = reserve.settle(id);
        assertEq(payout, 32 * ONE);
        assertEq(reclaimed, 10 * ONE);
        assertEq(returned, 22 * ONE);
        assertEq(coll.balanceOf(opener), ownerBefore + 22 * ONE, "the owner is paid, whoever cranked");
        ILeverageReserve.Position memory p = reserve.positionOf(id);
        assertEq(uint8(p.status), uint8(ILeverageReserve.PositionStatus.SETTLED));
        assertEq(p.quantityRaw, 0);
        assertEq(p.fronted, 0);
        assertEq(p.returned, 22 * ONE);
        assertEq(reserve.liquid(), SUPPLY + 800_000, "the front is back and the premium stays");
        assertEq(reserve.outstanding(), 0);
        assertEq(reserve.openPositions().length, 0);
        assertBooksBalance();
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.NotLive.selector, id, ILeverageReserve.PositionStatus.SETTLED));
        reserve.settle(id);
    }

    function test_settle_aLossCostsTheOwnerTheStakeAndTheReserveTheFront() public {
        poolA.resolve(1);
        uint256 ownerBefore = coll.balanceOf(opener);
        (uint256 payout,, uint256 returned) = reserve.settle(id);
        assertEq(payout, 0);
        assertEq(returned, 0);
        assertEq(coll.balanceOf(opener), ownerBefore, "nothing more leaves the owner");
        assertEq(reserve.liquid(), SUPPLY - 10 * ONE + 800_000, "the reserve lost its front, kept the premium");
        assertEq(reserve.totalValue(), SUPPLY - 10 * ONE + 800_000);
        assertEq(reserve.outstanding(), 0);
        assertBooksBalance();
        // Suppliers carry it.
        uint256 shares = reserve.sharesOf(house);
        vm.prank(house);
        assertEq(reserve.withdraw(shares), SUPPLY - 10 * ONE + 800_000);
    }

    function test_settle_aVoidPaysHalfAContract() public {
        poolA.voidIt();
        (uint256 payout, uint256 reclaimed, uint256 returned) = reserve.settle(id);
        assertEq(payout, 16 * ONE);
        assertEq(reclaimed, 10 * ONE);
        assertEq(returned, 6 * ONE);
        assertBooksBalance();
    }

    function test_settle_refusesAnUnsettledWindow() public {
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.MarketNotSettled.selector, marketA));
        reserve.settle(id);
    }

    function test_close_theOwnerCashesOutAtTheBids() public {
        // 32 sold at the 0.58 bid: 18.56; the reserve takes 10; 8.56 back — the spread and the premium lost.
        uint256 ownerBefore = coll.balanceOf(opener);
        vm.prank(opener);
        (uint256 proceeds, uint256 returned) = reserve.close(id, 18 * ONE);
        assertEq(proceeds, 18_560_000);
        assertEq(returned, 8_560_000);
        assertEq(coll.balanceOf(opener), ownerBefore + 8_560_000);
        ILeverageReserve.Position memory p = reserve.positionOf(id);
        assertEq(uint8(p.status), uint8(ILeverageReserve.PositionStatus.CLOSED));
        assertEq(reserve.liquid(), SUPPLY + 800_000);
        assertEq(venue.balanceOf(address(reserve), venue.yesIdOf(marketA)), 0);
        assertBooksBalance();
    }

    function test_close_isTheOwnersAndGuardsSlippage() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.NotOwner.selector, id, stranger));
        reserve.close(id, 0);
        vm.prank(opener);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.Slippage.selector, 18_560_000, 19 * ONE));
        reserve.close(id, 19 * ONE);
    }

    function test_knockOut_refusesWhileTheMarkHoldsAboveTheLine() public {
        // Line: 10 x 1.2 = 12. At the 0.58 bid 32 contracts mark 18.56.
        (uint256 mark,, uint256 line, bool knockable) = reserve.markOf(id);
        assertEq(mark, 18_559_999, "a unit under the ceiling-rounded walk");
        assertEq(line, 12 * ONE);
        assertFalse(knockable);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.StillHealthy.selector, id, 18_559_999, 12 * ONE));
        reserve.knockOut(id);
        // Just above the line still holds.
        setBids(poolA, 380_000, 300 * ONE);
        (,,, knockable) = reserve.markOf(id);
        assertFalse(knockable, "12.16 is above 12");
    }

    function test_knockOut_atTheLineRepaysTheReserveFirstAndTheOwnerTheRest() public {
        setBids(poolA, 350_000, 300 * ONE);
        (uint256 mark,,, bool knockable) = reserve.markOf(id);
        assertEq(mark, 11_199_999);
        assertTrue(knockable);
        uint256 ownerBefore = coll.balanceOf(opener);
        uint256 strangerBefore = coll.balanceOf(stranger);
        vm.prank(stranger);
        (uint256 proceeds, uint256 reclaimed, uint256 returned) = reserve.knockOut(id);
        assertEq(proceeds, 11_200_000);
        assertEq(reclaimed, 10 * ONE);
        assertEq(returned, 1_200_000);
        assertEq(coll.balanceOf(opener), ownerBefore + 1_200_000, "what the line left is the owner's");
        assertEq(coll.balanceOf(stranger), strangerBefore, "the cranker gets nothing");
        assertEq(uint8(reserve.positionOf(id).status), uint8(ILeverageReserve.PositionStatus.KNOCKED_OUT));
        assertEq(reserve.liquid(), SUPPLY + 800_000, "the reserve is whole");
        assertBooksBalance();
    }

    function test_knockOut_onAGappedBookBooksTheShortfallAsTheReservesLoss() public {
        setBids(poolA, 250_000, 300 * ONE);
        (uint256 proceeds, uint256 reclaimed, uint256 returned) = reserve.knockOut(id);
        assertEq(proceeds, 8 * ONE);
        assertEq(reclaimed, 8 * ONE);
        assertEq(returned, 0);
        assertEq(reserve.liquid(), SUPPLY - 2 * ONE + 800_000, "2 of the 10 fronted did not come back");
        assertEq(reserve.outstanding(), 0, "the whole claim is released, recovered or not");
        assertEq(reserve.frontedByMarket(marketA), 0);
        assertBooksBalance();
    }

    function test_knockOut_onAThinBookSellsWhatItCanAndStaysLive() public {
        setBids(poolA, 300_000, 20 * ONE);
        (uint256 proceeds, uint256 reclaimed,) = reserve.knockOut(id);
        assertEq(proceeds, 6 * ONE);
        assertEq(reclaimed, 6 * ONE);
        ILeverageReserve.Position memory p = reserve.positionOf(id);
        assertEq(uint8(p.status), uint8(ILeverageReserve.PositionStatus.LIVE), "12 contracts and a 4 claim remain");
        assertEq(p.quantityRaw, 12 * ONE);
        assertEq(p.fronted, 4 * ONE);
        assertEq(reserve.outstanding(), 4 * ONE);
        assertBooksBalance();
        // With no bids left the knock-out has nothing to sell into.
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.NothingFilled.selector, marketA));
        reserve.knockOut(id);
        // Settlement finishes it: 12 pay 12, the 4 first.
        poolA.resolve(0);
        (uint256 payout, uint256 reclaimed2, uint256 returned) = reserve.settle(id);
        assertEq(payout, 12 * ONE);
        assertEq(reclaimed2, 4 * ONE);
        assertEq(returned, 8 * ONE);
        assertEq(reserve.liquid(), SUPPLY + 800_000);
        assertBooksBalance();
    }

    function test_withdraw_isRefusedWhileAnExpiredPositionIsUnsettled() public {
        vm.warp(EXPIRY + 1);
        assertEq(reserve.unsettledExpired(), id);
        uint256 shares = reserve.sharesOf(house);
        vm.prank(house);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.UnsettledPosition.selector, id));
        reserve.withdraw(shares);
        poolA.resolve(0);
        reserve.settle(id);
        assertEq(reserve.unsettledExpired(), 0);
        vm.prank(house);
        assertEq(reserve.withdraw(shares), SUPPLY + 800_000, "the premium is the suppliers' once the position is out");
    }

    function test_withdraw_drawsOnIdleCapitalOnly() public {
        uint256 shares = reserve.sharesOf(house);
        vm.prank(house);
        vm.expectPartialRevert(ILeverageReserve.InsufficientLiquidity.selector);
        reserve.withdraw(shares);
        // Half the shares fit inside liquid.
        vm.prank(house);
        uint256 out = reserve.withdraw(shares / 2);
        assertEq(out, (SUPPLY + 800_000) / 2);
        assertBooksBalance();
    }

    function test_sharePrice_countsTheFrontAtCostAndThePremiumAsIncome() public {
        // A second supplier joins after the open: shares priced on liquid + outstanding.
        coll.mint(stranger, 1_000 * ONE);
        vm.startPrank(stranger);
        coll.approve(address(reserve), type(uint256).max);
        uint256 shares = reserve.supply(1_000 * ONE);
        vm.stopPrank();
        assertLt(shares, 1_000 * ONE, "the pot is worth more than par after the premium");
        assertEq(shares, 1_000 * ONE * SUPPLY / (SUPPLY + 800_000));
    }

    function test_refundsLandingAsCreditAreCollectedInTheSameCall() public {
        poolA.setRefundAsCredit(true);
        setBook(poolA, 600_000, 620_000, 580_000, 550_000);
        openFor(opener, marketA, 1, STAKE, TWO_X);
        assertBooksBalance();
        vm.prank(opener);
        reserve.close(2, 0);
        assertBooksBalance();
        assertEq(poolA.credit(address(reserve)), 0, "no credit left on the pool");
    }

    function test_positionViews_refuseWhatDoesNotExist() public {
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.NoSuchPosition.selector, 9));
        reserve.positionOf(9);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.NoSuchPosition.selector, 0));
        reserve.knockOut(0);
    }
}
