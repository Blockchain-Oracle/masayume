// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IRangeReserve} from "../src/range/IRangeReserve.sol";
import {WindowQuestion} from "../src/range/WindowQuestion.sol";
import {RangeTestBase} from "./RangeTestBase.sol";
import {MockWindow} from "./mocks/MockWindows.sol";

/// @notice What an open charges and why it refuses: the hub's opening print, the asset proof, the book's
///         centre, the model's odds, and the reserve's caps.
contract RangeReservePricingTest is RangeTestBase {
    uint256 internal constant PAYOUT = 100 * ONE;
    IRangeReserve.Side internal constant INSIDE = IRangeReserve.Side.INSIDE;
    IRangeReserve.Side internal constant OUTSIDE = IRangeReserve.Side.OUTSIDE;

    function test_preview_isTheSharedVector() public view {
        (int256 low, int256 high) = band(30);
        (uint256 stake, uint256 probRaw, int256 openingPrint, IRangeReserve.Basis memory basis) = reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
        assertEq(probRaw, 315_946, "P(inside +/-$30) at even odds, four minutes out");
        assertEq(stake, 35_385_952, "fair value plus 12%, rounded up");
        assertEq(openingPrint, P0);
        assertEq(basis.centerQE6, 500_000);
        assertEq(basis.sigmaE8, 6_200);
        assertEq(basis.tauSec, 240);
        (, uint256 outsideProb,,) = reserve.previewOpen(marketA, BTC, OUTSIDE, low, high, PAYOUT);
        assertEq(outsideProb + probRaw, ONE, "outside is the complement");
    }

    function test_open_chargesThePreviewEscrowsThePayoutAndKeepsNoAddress() public {
        (int256 low, int256 high) = band(30);
        (uint256 previewed,,,) = reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
        uint256 before = coll.balanceOf(opener);
        vm.record();
        (uint256 id, uint256 stake) = openAs(opener, INSIDE, low, high, PAYOUT);
        (, bytes32[] memory writes) = vm.accesses(address(reserve));
        for (uint256 i = 0; i < writes.length; i++) {
            assertTrue(vm.load(address(reserve), writes[i]) != bytes32(uint256(uint160(address(windowA)))), "venue address persisted in reserve storage");
        }
        assertEq(id, 1);
        assertEq(stake, previewed);
        assertEq(coll.balanceOf(opener), before - stake);
        assertEq(reserve.liquid(), SUPPLY - (PAYOUT - stake), "the house fronted its part");
        assertEq(reserve.locked(), PAYOUT - stake);
        assertEq(reserve.lockedByExpiry(EXPIRY), PAYOUT - stake);
        assertBooksBalance();

        IRangeReserve.Round memory r = reserve.roundOf(id);
        assertEq(r.owner, opener);
        assertEq(r.oracleQuestionId, Q_CLOSE, "settles on the question the module named");
        assertEq(r.openingPrint, P0);
        assertEq(r.lowPrint, low);
        assertEq(r.highPrint, high);
        assertEq(r.probRaw, 315_946);
        assertEq(reserve.assetKeyOf(marketA), keccak256("BTC"), "the asset proof is cached per Window");
        assertEq(reserve.openingPrintOf(marketA), P0);
        assertEq(reserve.roundsOf(opener, 0, 10).length, 1);
    }

    function test_open_proofsTheAssetThroughTheHubsKey() public {
        (int256 low, int256 high) = band(30);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.WrongAsset.selector, marketA, "ETH"));
        vm.prank(opener);
        reserve.openRange(marketA, "ETH", INSIDE, low, high, PAYOUT, type(uint256).max);

        // Once proven, later opens on the Window need no rebuild: the hub's registry can even be gone.
        openAs(opener, INSIDE, low, high, PAYOUT);
        hub.register(WindowQuestion.build(BTC, EXPIRY), 0);
        hub.register(WindowQuestion.build(BTC, START), 0);
        openAs(opener, INSIDE, low, high, PAYOUT);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.WrongAsset.selector, marketA, "ETH"));
        vm.prank(opener);
        reserve.openRange(marketA, "ETH", INSIDE, low, high, PAYOUT, type(uint256).max);
    }

    function test_open_refusesAWindowWithoutAnOpeningPrint() public {
        (int256 low, int256 high) = band(30);
        hub.clearAnswer(Q_OPEN);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NoOpeningPrint.selector, marketA));
        vm.prank(opener);
        reserve.openRange(marketA, BTC, INSIDE, low, high, PAYOUT, type(uint256).max);
        hub.setAnswer(Q_OPEN, P0, true);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NoOpeningPrint.selector, marketA));
        vm.prank(opener);
        reserve.openRange(marketA, BTC, INSIDE, low, high, PAYOUT, type(uint256).max);
        hub.register(WindowQuestion.build(BTC, START), 0);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NoOpeningPrint.selector, marketA));
        vm.prank(opener);
        reserve.openRange(marketA, BTC, INSIDE, low, high, PAYOUT, type(uint256).max);
    }

    function test_open_refusesAnotherOracleAnotherVenueAndTheWrongAsset() public {
        (int256 low, int256 high) = band(30);
        venue.setOracleAdapter(address(0xBEEF));
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.WrongOracle.selector, address(0xBEEF)));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
        venue.setOracleAdapter(address(hub));
        venue.setVenue(bytes32("other"));
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.WrongVenue.selector, bytes32("other")));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
        venue.setVenue(bytes32("venue"));
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.UnknownMarket.selector, bytes32(uint256(1))));
        reserve.previewOpen(bytes32(uint256(1)), BTC, INSIDE, low, high, PAYOUT);
    }

    function test_open_refusesLateFarBadBandAndNotTrading() public {
        (int256 low, int256 high) = band(30);
        vm.warp(EXPIRY - 30);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.TooLate.selector, marketA, EXPIRY));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
        vm.warp(NOW);
        windowA.setExpiry(NOW + 3 days);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.TooFar.selector, marketA, uint64(NOW + 3 days)));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
        windowA.setExpiry(EXPIRY);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.BadBand.selector, high, low));
        reserve.previewOpen(marketA, BTC, INSIDE, high, low, PAYOUT);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.BadBand.selector, int256(0), high));
        reserve.previewOpen(marketA, BTC, INSIDE, 0, high, PAYOUT);
        windowA.setStatus(2);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.MarketNotTrading.selector, marketA, uint8(2)));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
    }

    function test_open_refusesThinWideAndDecidedBooks() public {
        (int256 low, int256 high) = band(30);
        uint256[] memory p = new uint256[](1);
        uint256[] memory q = new uint256[](1);
        p[0] = 520_000;
        q[0] = 10 * ONE;
        uint256[] memory bp = new uint256[](1);
        uint256[] memory bq = new uint256[](1);
        bp[0] = 480_000;
        bq[0] = 300 * ONE;
        windowA.setBook(p, q, bp, bq);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.ThinBook.selector, marketA, 10 * ONE, 20 * ONE));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);

        setBook(windowA, 800_000, 820_000, 200_000, 180_000);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.WideBook.selector, marketA, 600_000, 200_000));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);

        setBook(windowA, 990_000, 995_000, 980_000, 970_000);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.WindowDecided.selector, marketA, 985_000));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
    }

    function test_theBookMovesTheCentre() public {
        // YES at 0.8413 both sides: the market sits one  sigma above the open, so a band above the open pays less.
        setBook(windowA, 841_345, 850_000, 841_345, 830_000);
        (uint256 stake, uint256 probRaw,, IRangeReserve.Basis memory basis) = reserve.previewOpen(marketA, BTC, INSIDE, P0, P0 + 6_000, PAYOUT);
        assertEq(basis.centerQE6, 841_345);
        assertEq(probRaw, 267_625, "the shared vector");
        assertEq(stake, 29_974_000);
    }

    function test_open_refusesLongshotsAndNearCertainties() public {
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.LongShot.selector, uint256(39), uint256(20_000)));
        reserve.previewOpen(marketA, BTC, INSIDE, P0, P0 + 1, PAYOUT);
        (int256 low, int256 high) = band(4_000);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NearCertain.selector, uint256(1_000_000), uint256(970_000)));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.LongShot.selector, uint256(0), uint256(20_000)));
        reserve.previewOpen(marketA, BTC, OUTSIDE, low, high, PAYOUT);
        reserve.setVolatility(BTC, 0);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NoVolatility.selector, BTC));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
    }

    function test_open_respectsTheCaps() public {
        (int256 low, int256 high) = band(30);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.OverPayoutCap.selector, 501 * ONE, 500 * ONE));
        reserve.previewOpen(marketA, BTC, INSIDE, low, high, 501 * ONE);

        (uint256 stake,,,) = reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.StakeAboveMax.selector, stake, stake - 1));
        vm.prank(opener);
        reserve.openRange(marketA, BTC, INSIDE, low, high, PAYOUT, stake - 1);

        // A 500 payout locks 323.07 of the house's part; the per-expiry cap is 400, so a 200 payout (129.23 more) trips it.
        openAs(opener, INSIDE, low, high, 500 * ONE);
        uint256 lockedNow = reserve.locked();
        assertEq(lockedNow, 323_070_240);
        (uint256 stake2,,,) = reserve.previewOpen(marketA, BTC, INSIDE, low, high, 200 * ONE);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.OverExpiryCap.selector, EXPIRY, lockedNow + 200 * ONE - stake2, 400 * ONE));
        vm.prank(opener);
        reserve.openRange(marketA, BTC, INSIDE, low, high, 200 * ONE, type(uint256).max);

        // Another Window on the same asset lifts the per-expiry cap; the 50% exposure cap then holds.
        (bytes32 marketB, MockWindow windowB) = venue.addWindowAt(START, EXPIRY + 300, 501);
        hub.register(WindowQuestion.build(BTC, EXPIRY + 300), 501);
        setBook(windowB, 520_000, 540_000, 480_000, 460_000);
        (uint256 stakeB,,,) = reserve.previewOpen(marketB, BTC, INSIDE, low, high, 400 * ONE);
        uint256 tv = reserve.totalValue();
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.OverExposure.selector, lockedNow + 400 * ONE - stakeB, tv, uint16(5_000)));
        vm.prank(opener);
        reserve.openRange(marketB, BTC, INSIDE, low, high, 400 * ONE, type(uint256).max);
    }

    function test_open_refusesWhenPausedOrIlliquid() public {
        (int256 low, int256 high) = band(30);
        reserve.setPaused(true);
        vm.expectRevert(IRangeReserve.IsPaused.selector);
        vm.prank(opener);
        reserve.openRange(marketA, BTC, INSIDE, low, high, PAYOUT, type(uint256).max);
        reserve.setPaused(false);
        uint256 houseShares = reserve.sharesOf(house);
        vm.prank(house);
        reserve.withdraw(houseShares);
        (uint256 stake,,,) = reserve.previewOpen(marketA, BTC, INSIDE, low, high, PAYOUT);
        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.InsufficientLiquidity.selector, PAYOUT - stake, 0));
        vm.prank(opener);
        reserve.openRange(marketA, BTC, INSIDE, low, high, PAYOUT, type(uint256).max);
    }
}
