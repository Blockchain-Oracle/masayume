// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IParlayReserve} from "../src/parlay/IParlayReserve.sol";
import {ParlayTestBase} from "./ParlayTestBase.sol";

/// @notice The open: every leg priced off the venue's own book inside the transaction, the stake
///         floored on-chain, the whole payout escrowed, every cap enforced before money moves.
contract ParlayReservePricingTest is ParlayTestBase {
    function test_open_pricesLegsOffTheBookAndEscrowsTheWholePayout() public {
        uint256 maxPayout = 100 * ONE;
        (uint256 previewStake, uint256 combined, uint256[] memory prices,) = reserve.previewOpen(legs2(marketA, 0, marketB, 1), maxPayout);
        // UP on A costs the 0.60 ask; DOWN on B costs 1 − 0.58 = 0.42 (the top bid inverted); both fill inside one level.
        assertEq(prices[0], 600_000);
        assertEq(prices[1], 420_000);
        assertEq(combined, 252_000, "0.60 x 0.42");
        // floor = ceil(100 × 0.252) × 1.12 = 28.224
        assertEq(previewStake, 28_224_000);

        uint256 openerBefore = coll.balanceOf(opener);
        vm.record();
        (uint256 id, uint256 stake) = openAs(opener, legs2(marketA, 0, marketB, 1), maxPayout);
        (, bytes32[] memory writes) = vm.accesses(address(reserve));
        assertNoVenueAddressInStorage(writes);

        assertEq(id, 1);
        assertEq(stake, previewStake, "the open charges exactly the preview");
        assertEq(coll.balanceOf(opener), openerBefore - stake);
        IParlayReserve.Parlay memory p = reserve.parlayOf(id);
        assertEq(p.owner, opener);
        assertEq(uint8(p.status), uint8(IParlayReserve.ParlayStatus.LIVE));
        assertEq(p.maxPayout, maxPayout);
        assertEq(p.houseLocked, maxPayout - stake);
        assertEq(p.combinedProbRaw, combined);
        assertEq(p.lastExpirySec, NOW + 600);
        assertEq(reserve.locked(), maxPayout - stake);
        assertEq(reserve.liquid(), SUPPLY - (maxPayout - stake));
        assertEq(reserve.lockedByExpiry(NOW + 300), maxPayout - stake);
        assertEq(reserve.lockedByExpiry(NOW + 600), maxPayout - stake);
        IParlayReserve.Leg[] memory legs = reserve.legsOf(id);
        assertEq(legs[0].priceRaw, 600_000);
        assertEq(legs[1].priceRaw, 420_000);
        assertEq(legs[1].expirySec, NOW + 600);
        assertBooksBalance();
    }

    function test_open_pricesOverTheDepthItMustHedge() public {
        // A 400-contract payout walks past the 300 resting at 0.60 into the 0.62 level: (180 + 62) / 400 = 0.605.
        (,, uint256[] memory prices,) = reserve.previewOpen(legs2(marketA, 0, marketB, 0), 400 * ONE);
        assertEq(prices[0], 605_000);
        // A small payout is still priced over the floor depth (20 contracts), all at the top level.
        (,, uint256[] memory small,) = reserve.previewOpen(legs2(marketA, 0, marketB, 0), 5 * ONE);
        assertEq(small[0], 600_000);
    }

    function test_open_sameSettlementInstantIsSurcharged() public {
        // B and C settle at the same instant: the product 0.36 beats the floor 0.40 x 0.60 = 0.24, so it stands.
        (, uint256 combinedBC,,) = reserve.previewOpen(legs2(marketB, 0, marketC, 0), 100 * ONE);
        assertEq(combinedBC, 360_000);
        // At 0.15 a side the product is 0.0225 but the floor is 0.40 x 0.15 = 0.06: the floor wins.
        setBook(windowB, 150_000, 160_000, 140_000, 130_000);
        setBook(windowC, 150_000, 160_000, 140_000, 130_000);
        (, uint256 floored,,) = reserve.previewOpen(legs2(marketB, 0, marketC, 0), 100 * ONE);
        assertEq(floored, 60_000, "lambda x min leg");
        // The same two prices on distinct instants keep the product.
        setBook(windowA, 150_000, 160_000, 140_000, 130_000);
        (, uint256 product,,) = reserve.previewOpen(legs2(marketA, 0, marketB, 0), 100 * ONE);
        assertEq(product, 22_500);
    }

    function test_open_refusesLongShots() public {
        setBook(windowA, 100_000, 110_000, 90_000, 80_000);
        setBook(windowB, 100_000, 110_000, 90_000, 80_000);
        // 0.10 × 0.10 = 1% < the 2% floor
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.LongShot.selector, 10_000, 20_000));
        openAs(opener, legs2(marketA, 0, marketB, 0), 100 * ONE);
    }

    function test_open_refusesAThinBook() public {
        // 20 contracts rest in total; a 100-contract payout cannot be priced over its own depth.
        uint256[] memory p = new uint256[](1);
        uint256[] memory q = new uint256[](1);
        p[0] = 600_000;
        q[0] = 20 * ONE;
        windowA.setBook(p, q, p, q);
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.ThinBook.selector, marketA, 20 * ONE, 100 * ONE));
        openAs(opener, legs2(marketA, 0, marketB, 0), 100 * ONE);
        // An empty side is a thin book too.
        windowA.setBook(new uint256[](0), new uint256[](0), new uint256[](0), new uint256[](0));
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.ThinBook.selector, marketA, 0, 20 * ONE));
        openAs(opener, legs2(marketA, 0, marketB, 0), 10 * ONE);
    }

    function test_open_refusesLegsTheVenueWouldNotTake() public {
        windowA.setStatus(2);
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.MarketNotTrading.selector, marketA, uint8(2)));
        openAs(opener, legs2(marketA, 0, marketB, 0), 100 * ONE);
        windowA.setStatus(1);

        windowA.setExpiry(NOW);
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.LegExpired.selector, marketA, NOW));
        openAs(opener, legs2(marketA, 0, marketB, 0), 100 * ONE);
        windowA.setExpiry(NOW + 300);

        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.DuplicateMarket.selector, marketA));
        openAs(opener, legs2(marketA, 0, marketA, 1), 100 * ONE);

        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.UnknownMarket.selector, bytes32(uint256(0xdead))));
        openAs(opener, legs2(marketA, 0, bytes32(uint256(0xdead)), 0), 100 * ONE);

        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.BadOutcome.selector, uint8(2)));
        openAs(opener, legs2(marketA, 2, marketB, 0), 100 * ONE);

        IParlayReserve.LegInput[] memory one = new IParlayReserve.LegInput[](1);
        one[0] = IParlayReserve.LegInput(marketA, 0);
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.BadLegCount.selector, 1));
        vm.prank(opener);
        reserve.openParlay(one, 100 * ONE, type(uint256).max);
    }

    function test_open_refusesAStakeAboveTheOpenersGuard() public {
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.StakeAboveMax.selector, 28_224_000, 28 * ONE));
        vm.prank(opener);
        reserve.openParlay(legs2(marketA, 0, marketB, 1), 100 * ONE, 28 * ONE);
    }

    function test_open_refusesWhenTheHouseWouldFrontNothing() public {
        // Two near-certain legs at 0.99: combined 0.9801 × 1.12 > 1, so the floor stake exceeds the payout.
        setBook(windowA, 990_000, 990_000, 980_000, 970_000);
        setBook(windowB, 990_000, 990_000, 980_000, 970_000);
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.Underpriced.selector, 109_771_200, 100 * ONE));
        openAs(opener, legs2(marketA, 0, marketB, 0), 100 * ONE);
    }

    function test_open_capsPayoutExposureAndPerExpiryLiability() public {
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.OverPayoutCap.selector, 501 * ONE, 500 * ONE));
        openAs(opener, legs2(marketA, 0, marketB, 0), 501 * ONE);

        // A 500 payout is priced over 500 contracts (VWAP 0.608): stake 207.01, house 292.99 — inside both caps.
        (, uint256 stake1) = openAs(opener, legs2(marketA, 0, marketB, 0), 500 * ONE);
        uint256 house1 = 500 * ONE - stake1;
        assertEq(house1, 292_988_160);
        assertEq(reserve.locked(), house1);

        // A second identical ticket would lock 585.98 of a 1,000 reserve: over the 50% exposure cap.
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.OverExposure.selector, house1 * 2, SUPPLY, uint16(5_000)));
        openAs(opener, legs2(marketA, 0, marketB, 0), 500 * ONE);

        // Per-expiry: 200 more on B's instant passes exposure (412.35) but breaches the 400 sub-cap at NOW+600.
        (uint256 stake2,,,) = reserve.previewOpen(legs2(marketB, 0, marketC, 0), 200 * ONE);
        uint256 house2 = 200 * ONE - stake2;
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.OverExpiryCap.selector, uint64(NOW + 600), house1 + house2, 400 * ONE));
        openAs(opener, legs2(marketB, 0, marketC, 0), 200 * ONE);
    }

    function test_open_refusesMoreThanTheReserveHolds() public {
        uint256 shares = reserve.sharesOf(house);
        vm.prank(house);
        reserve.withdraw(shares - 10 * ONE);
        // 10 liquid cannot front the house's part of a 100 payout.
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.InsufficientLiquidity.selector, 100 * ONE - 28_224_000, 10 * ONE));
        openAs(opener, legs2(marketA, 0, marketB, 1), 100 * ONE);
    }

    function test_open_pausedRefusesOpensAndSupplyOnly() public {
        reserve.setPaused(true);
        vm.expectRevert(IParlayReserve.IsPaused.selector);
        openAs(opener, legs2(marketA, 0, marketB, 1), 100 * ONE);
        vm.prank(house);
        vm.expectRevert(IParlayReserve.IsPaused.selector);
        reserve.supply(ONE);
        // Withdrawals never pause.
        vm.prank(house);
        reserve.withdraw(ONE);
    }

    function test_admin_onlyAdminSetsParamsAndParamsAreChecked() public {
        IParlayReserve.Params memory p = defaultParams();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IParlayReserve.NotAdmin.selector, stranger));
        reserve.setParams(p);

        p.maxLegs = 1;
        vm.expectRevert(IParlayReserve.BadParams.selector);
        reserve.setParams(p);
        p.maxLegs = 4;
        p.correlationBps = 10_001;
        vm.expectRevert(IParlayReserve.BadParams.selector);
        reserve.setParams(p);
        p.correlationBps = 4_000;
        reserve.setParams(p);
        (,,, uint8 maxLegs,,,,) = reserve.params();
        assertEq(maxLegs, 4);

        vm.expectRevert(IParlayReserve.ZeroAddress.selector);
        reserve.setAdmin(address(0));
        reserve.setAdmin(stranger);
        assertEq(reserve.admin(), stranger);
    }
}
