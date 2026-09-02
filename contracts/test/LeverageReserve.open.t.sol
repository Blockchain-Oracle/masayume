// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ILeverageReserve} from "../src/leverage/ILeverageReserve.sol";
import {LeverageMath} from "../src/leverage/LeverageMath.sol";
import {LeverageTestBase} from "./LeverageTestBase.sol";
import {MockLeveragePool} from "./mocks/MockLeverageVenue.sol";

/// @notice The open: the size a stake affords off the live book, the terms behind the fill, the stake
///         charged exactly, and every refusal the reserve raises before money moves.
contract LeverageReserveOpenTest is LeverageTestBase {
    function test_sizeForStake_sizesOffTheBookAndPricesTheTerms() public view {
        ILeverageReserve.Preview memory q = reserve.sizeForStake(marketA, 0, STAKE, TWO_X);
        // 10 at 2x deploys 19.20 (the 0.80 premium on the 10 fronted comes off the notional): 32 contracts at 0.60.
        assertEq(q.quantityRaw, 32 * ONE);
        assertEq(q.costRaw, 19_200_000);
        assertEq(q.filledRaw, 32 * ONE);
        assertEq(q.limitYesRaw, 600_000, "the worst ask touched, in YES terms");
        assertEq(q.priceRaw, 600_000);
        assertEq(q.stake, STAKE, "the stake is what was typed when the book fills it exactly");
        assertEq(q.fronted, 10 * ONE);
        assertEq(q.premium, 800_000);
        assertEq(q.winIfRight, 22 * ONE, "32 contracts pay 32; the reserve takes its 10 first");
    }

    function test_sizeForStake_DOWNBuysTheBidsInverted() public view {
        ILeverageReserve.Preview memory q = reserve.sizeForStake(marketA, 1, STAKE, TWO_X);
        // NO costs 0.42 at the 0.58 bid: 19.20 / 0.42 = 45.71 contracts on the 0.01 lot.
        assertEq(q.quantityRaw, 45_710_000);
        assertEq(q.limitYesRaw, 580_000, "the bid it takes, in the venue's YES terms");
        assertEq(q.priceRaw, 420_000);
        assertEq(q.costRaw, LeverageMath.ceilDiv(45_710_000 * 420_000, ONE));
        assertLe(q.stake, STAKE, "the lot floor can only make the stake smaller");
    }

    function test_open_chargesExactlyTheFillsTermsAndBooksTheFront() public {
        uint256 openerBefore = coll.balanceOf(opener);
        vm.record();
        (uint256 id, uint256 charged) = openFor(opener, marketA, 0, STAKE, TWO_X);
        (, bytes32[] memory writes) = vm.accesses(address(reserve));
        for (uint256 i = 0; i < writes.length; i++) {
            assertTrue(vm.load(address(reserve), writes[i]) != bytes32(uint256(uint160(address(poolA)))), "pool address persisted (AD-10)");
        }
        assertEq(id, 1);
        assertEq(charged, STAKE);
        assertEq(coll.balanceOf(opener), openerBefore - STAKE, "the owner paid the stake and nothing else");

        ILeverageReserve.Position memory p = reserve.positionOf(id);
        assertEq(p.owner, opener);
        assertEq(uint8(p.status), uint8(ILeverageReserve.PositionStatus.LIVE));
        assertEq(p.quantityRaw, 32 * ONE);
        assertEq(p.stake, STAKE);
        assertEq(p.fronted, 10 * ONE);
        assertEq(p.premium, 800_000);
        assertEq(p.entryPriceRaw, 600_000);
        assertEq(p.expirySec, EXPIRY);
        assertEq(venue.balanceOf(address(reserve), venue.yesIdOf(marketA)), 32 * ONE, "the reserve holds the contracts");

        assertEq(reserve.liquid(), SUPPLY - 10 * ONE + 800_000, "the front left liquid, the premium joined it");
        assertEq(reserve.outstanding(), 10 * ONE);
        assertEq(reserve.frontedByMarket(marketA), 10 * ONE);
        assertEq(reserve.totalValue(), SUPPLY + 800_000, "total value counts the front at cost plus the premium");
        assertEq(reserve.openPositions().length, 1);
        assertBooksBalance();
    }

    function test_open_refundsWhenTheBookFillsCheaperThanTheWalk() public {
        // The walk sees only the second level once the first is gone; a better ask arrives before the send.
        ILeverageReserve.Preview memory q = reserve.sizeForStake(marketA, 0, STAKE, TWO_X);
        setBook(poolA, 590_000, 620_000, 580_000, 550_000);
        uint256 before = coll.balanceOf(opener);
        vm.prank(opener);
        (, uint256 charged) = reserve.open(marketA, 0, q.quantityRaw, TWO_X, STAKE);
        assertLt(charged, STAKE, "a cheaper fill is a smaller stake");
        assertEq(coll.balanceOf(opener), before - charged, "the difference came back in the same call");
        assertEq(reserve.positionOf(1).entryPriceRaw, 590_000);
        assertBooksBalance();
    }

    function test_open_walksIntoTheSecondLevelForABigSize() public {
        // 200 at 3x deploys 568: past the 300 contracts at 0.60 into the 0.62 level.
        ILeverageReserve.Preview memory q = reserve.sizeForStake(marketA, 0, 200 * ONE, THREE_X);
        assertGt(q.quantityRaw, 300 * ONE);
        assertEq(q.limitYesRaw, 620_000);
        assertGt(q.priceRaw, 600_000);
        assertLt(q.priceRaw, 620_000);
    }

    function test_open_refusesAThinBook() public {
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.ThinBook.selector, marketA, 600 * ONE, 700 * ONE));
        reserve.previewOpen(marketA, 0, 700 * ONE, TWO_X);
        vm.prank(opener);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.ThinBook.selector, marketA, 600 * ONE, 700 * ONE));
        reserve.open(marketA, 0, 700 * ONE, TWO_X, type(uint256).max);
    }

    function test_open_refusesOutsideTheLeverageBounds() public {
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.BadLeverage.selector, uint32(10_000), THREE_X));
        reserve.sizeForStake(marketA, 0, STAKE, 10_000);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.BadLeverage.selector, uint32(40_000), THREE_X));
        reserve.previewOpen(marketA, 0, 32 * ONE, 40_000);
    }

    function test_open_refusesADecidedWindow() public {
        setBook(poolA, 970_000, 980_000, 960_000, 950_000);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.OutsideBand.selector, 970_000, 20_000, 950_000));
        reserve.previewOpen(marketA, 0, 20 * ONE, TWO_X);
    }

    function test_open_refusesABoostThatCannotBeatThePlainBet() public {
        // At 0.97 a 2x boost of 10 buys 19.79 contracts and collects 9.79 when right: a fee, not a product.
        ILeverageReserve.Params memory p = defaultParams();
        p.maxEntryPriceRaw = 990_000;
        reserve.setParams(p);
        setBook(poolA, 970_000, 980_000, 960_000, 950_000);
        vm.expectPartialRevert(ILeverageReserve.Underpriced.selector);
        reserve.sizeForStake(marketA, 0, STAKE, TWO_X);
    }

    function test_open_refusesTheLastSecondsOfAWindow() public {
        vm.warp(EXPIRY - 10);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.TooLate.selector, marketA, EXPIRY));
        reserve.previewOpen(marketA, 0, 32 * ONE, TWO_X);
    }

    function test_open_refusesAWindowThatIsNotTrading() public {
        poolA.setStatus(2);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.MarketNotTrading.selector, marketA, uint8(2)));
        reserve.previewOpen(marketA, 0, 32 * ONE, TWO_X);
    }

    function test_open_refusesBelowTheVenuesMinimumAndUnknownMarkets() public {
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.BelowMinQuantity.selector, 0, 100_000));
        reserve.sizeForStake(marketA, 0, 1_000, TWO_X);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.UnknownMarket.selector, bytes32(uint256(9))));
        reserve.previewOpen(bytes32(uint256(9)), 0, 32 * ONE, TWO_X);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.BadOutcome.selector, uint8(2)));
        reserve.previewOpen(marketA, 2, 32 * ONE, TWO_X);
    }

    function test_open_honoursTheOpenersMaxStake() public {
        ILeverageReserve.Preview memory q = reserve.sizeForStake(marketA, 0, STAKE, TWO_X);
        vm.prank(opener);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.StakeAboveMax.selector, STAKE, STAKE - 1));
        reserve.open(marketA, 0, q.quantityRaw, TWO_X, STAKE - 1);
    }

    function test_open_capsTheFrontPerPositionPerWindowAndInAggregate() public {
        // Per position: 3x on 150 fronts 300 > 200.
        ILeverageReserve.Preview memory big = reserve.sizeForStake(marketA, 0, 150 * ONE, THREE_X);
        vm.prank(opener);
        vm.expectPartialRevert(ILeverageReserve.OverPositionCap.selector);
        reserve.open(marketA, 0, big.quantityRaw, THREE_X, type(uint256).max);

        // Aggregate: 50% of ~1,000 is 500; three 2x opens of 190 front 570.
        openFor(opener, marketA, 0, 190 * ONE, TWO_X);
        setBook(poolA, 600_000, 620_000, 580_000, 550_000);
        openFor(opener, marketA, 0, 190 * ONE, TWO_X);
        setBook(poolA, 600_000, 620_000, 580_000, 550_000);
        ILeverageReserve.Preview memory third = reserve.sizeForStake(marketA, 0, 190 * ONE, TWO_X);
        vm.prank(opener);
        vm.expectPartialRevert(ILeverageReserve.OverWindowCap.selector);
        reserve.open(marketA, 0, third.quantityRaw, TWO_X, type(uint256).max);

        // On a second Window the per-Window cap is fresh, so the exposure cap is what refuses.
        (bytes32 marketB, MockLeveragePool poolB) = venue.addWindow(EXPIRY + 300);
        coll.mint(address(poolB), 1_000_000 * ONE);
        setBook(poolB, 600_000, 620_000, 580_000, 550_000);
        ILeverageReserve.Preview memory onB = reserve.sizeForStake(marketB, 0, 190 * ONE, TWO_X);
        vm.prank(opener);
        vm.expectPartialRevert(ILeverageReserve.OverExposure.selector);
        reserve.open(marketB, 0, onB.quantityRaw, TWO_X, type(uint256).max);
        assertBooksBalance();
    }

    function test_open_capsOpenPositions() public {
        ILeverageReserve.Params memory p = defaultParams();
        p.maxOpenPositions = 1;
        reserve.setParams(p);
        openFor(opener, marketA, 0, STAKE, TWO_X);
        ILeverageReserve.Preview memory q = reserve.sizeForStake(marketA, 0, STAKE, TWO_X);
        vm.prank(opener);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.TooManyOpen.selector, uint32(1), uint32(1)));
        reserve.open(marketA, 0, q.quantityRaw, TWO_X, STAKE);
    }

    function test_open_needsLiquidToFrontAndToEscrow() public {
        uint256 shares = reserve.sharesOf(house);
        vm.prank(house);
        reserve.withdraw(shares);
        ILeverageReserve.Preview memory q = reserve.sizeForStake(marketA, 0, STAKE, TWO_X);
        vm.prank(opener);
        vm.expectPartialRevert(ILeverageReserve.InsufficientLiquidity.selector);
        reserve.open(marketA, 0, q.quantityRaw, TWO_X, STAKE);
    }

    function test_pause_stopsOpensAndSupplyOnly() public {
        reserve.setPaused(true);
        vm.prank(opener);
        vm.expectRevert(ILeverageReserve.IsPaused.selector);
        reserve.open(marketA, 0, 32 * ONE, TWO_X, STAKE);
        vm.prank(house);
        vm.expectRevert(ILeverageReserve.IsPaused.selector);
        reserve.supply(ONE);
        uint256 shares = reserve.sharesOf(house);
        vm.prank(house);
        assertEq(reserve.withdraw(shares), SUPPLY, "withdrawals never pause");
    }

    function test_params_refuseNonsense() public {
        ILeverageReserve.Params memory p = defaultParams();
        p.maintenanceBps = 9_000;
        vm.expectRevert(ILeverageReserve.BadParams.selector);
        reserve.setParams(p);
        p = defaultParams();
        p.premiumBps = 10_000;
        vm.expectRevert(ILeverageReserve.BadParams.selector);
        reserve.setParams(p);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(ILeverageReserve.NotAdmin.selector, stranger));
        reserve.setParams(defaultParams());
    }

    function test_positionsOf_pages() public {
        openFor(opener, marketA, 0, STAKE, TWO_X);
        setBook(poolA, 600_000, 620_000, 580_000, 550_000);
        openFor(opener, marketA, 1, STAKE, TWO_X);
        assertEq(reserve.positionCountOf(opener), 2);
        uint256[] memory page = reserve.positionsOf(opener, 1, 5);
        assertEq(page.length, 1);
        assertEq(page[0], 2);
        assertEq(reserve.positionsOf(opener, 2, 5).length, 0);
        assertEq(reserve.positionCountOf(stranger), 0);
    }
}
