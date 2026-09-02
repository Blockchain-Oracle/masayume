// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IMarketMakerVault} from "../src/maker/IMarketMakerVault.sol";
import {MakerTestBase} from "./MakerTestBase.sol";
import {MockMakerPool} from "./mocks/MockMakerVenue.sol";

/// @notice What a quote is allowed to be, what it books, and every bound the maker works under.
contract MarketMakerVaultQuotingTest is MakerTestBase {
    function test_quote_restsAPairAndBooksTheVenuesEscrow() public {
        vm.record();
        uint256 escrow = quoteA();
        (, bytes32[] memory writes) = vm.accesses(address(vault));
        for (uint256 i = 0; i < writes.length; i++) {
            assertTrue(vm.load(address(vault), writes[i]) != bytes32(uint256(uint160(address(poolA)))), "pool address persisted in vault storage");
        }
        assertEq(escrow, (BID_YES + (ONE - ASK_YES)) * QTY / ONE, "0.48 + 0.48 over 20 contracts");
        assertEq(vault.liquid(), SUPPLY - escrow);
        assertEq(vault.deployedOf(marketA), escrow);
        assertEq(vault.totalValue(), SUPPLY, "capital moved, value did not");
        assertEq(vault.sharePriceRaw(), ONE);
        assertEq(vault.utilizationBps(), escrow * 10_000 / SUPPLY);
        assertEq(vault.openWindows().length, 1);
        assertEq(vault.windowCount(), 1);
        uint128[] memory ids = ordersOn(poolA);
        assertEq(ids.length, 2, "a YES bid and a NO bid rest");
        assertEq(poolA.kindOf(ids[0]), 0);
        assertEq(poolA.kindOf(ids[1]), 2);
        IMarketMakerVault.WindowBook memory b = vault.bookOf(marketA);
        assertEq(b.escrowOut, escrow);
        assertEq(b.quoteCount, 1);
        assertEq(b.openedAtSec, NOW);
        assertBooksBalance();
    }

    function test_quote_onlyTheMakerAndNotWhilePaused() public {
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.NotMaker.selector, stranger));
        vm.prank(stranger);
        vault.quote(marketA, BID_YES, ASK_YES, QTY, expireNs());
        vault.setPaused(true);
        vm.expectRevert(IMarketMakerVault.IsPaused.selector);
        vm.prank(maker);
        vault.quote(marketA, BID_YES, ASK_YES, QTY, expireNs());
        vm.expectRevert(IMarketMakerVault.IsPaused.selector);
        vm.prank(house);
        vault.supply(ONE);
        vault.setMaker(address(0));
        vault.setPaused(false);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.NotMaker.selector, maker));
        vm.prank(maker);
        vault.quote(marketA, BID_YES, ASK_YES, QTY, expireNs());
    }

    function test_quote_mustLeaveTheSpreadUncovered() public {
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.SpreadTooThin.selector, 490_000, 505_000, 20_000));
        vm.prank(maker);
        vault.quote(marketA, 490_000, 505_000, QTY, expireNs());
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.SpreadTooThin.selector, 500_000, 490_000, 20_000));
        vm.prank(maker);
        vault.quote(marketA, 500_000, 490_000, QTY, expireNs());
        // Exactly the spread is allowed.
        vm.prank(maker);
        vault.quote(marketA, 490_000, 510_000, QTY, expireNs());
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.BadPrice.selector, 40_000));
        vm.prank(maker);
        vault.quote(marketA, 40_000, 400_000, QTY, expireNs());
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.BadPrice.selector, 960_000));
        vm.prank(maker);
        vault.quote(marketA, 50_000, 960_000, QTY, expireNs());
    }

    function test_quote_refusesSizeTimeAndExpiryOutOfBounds() public {
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.OverQuantity.selector, 51 * ONE, 50 * ONE));
        vm.prank(maker);
        vault.quote(marketA, BID_YES, ASK_YES, 51 * ONE, expireNs());
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.OverQuantity.selector, 0, 50 * ONE));
        vm.prank(maker);
        vault.quote(marketA, BID_YES, ASK_YES, 0, expireNs());
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.BadExpiry.selector, uint64(EXPIRY + 1) * 1e9, EXPIRY));
        vm.prank(maker);
        vault.quote(marketA, BID_YES, ASK_YES, QTY, uint64(EXPIRY + 1) * 1e9);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.BadExpiry.selector, uint64(NOW) * 1e9, EXPIRY));
        vm.prank(maker);
        vault.quote(marketA, BID_YES, ASK_YES, QTY, uint64(NOW) * 1e9);
        vm.warp(EXPIRY - 20);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.TooLate.selector, marketA, EXPIRY));
        vm.prank(maker);
        vault.quote(marketA, BID_YES, ASK_YES, QTY, expireNs());
        vm.warp(NOW);
        poolA.setStatus(2);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.MarketNotTrading.selector, marketA, uint8(2)));
        vm.prank(maker);
        vault.quote(marketA, BID_YES, ASK_YES, QTY, expireNs());
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.UnknownMarket.selector, bytes32(uint256(1))));
        vm.prank(maker);
        vault.quote(bytes32(uint256(1)), BID_YES, ASK_YES, QTY, expireNs());
    }

    function test_quote_respectsTheWindowExposureAndCountCaps() public {
        // 200 per Window: ten quotes of 19.2 fit, the eleventh does not.
        for (uint256 i = 0; i < 10; i++) {
            quoteA();
        }
        uint256 deployed = vault.deployedOf(marketA);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.OverWindowCap.selector, marketA, deployed + (BID_YES + (ONE - ASK_YES)) * QTY / ONE, 200 * ONE));
        quoteA();

        // Three more Windows fill the exposure cap (50% of 1,000) before the count cap (4).
        (bytes32 b, MockMakerPool pb) = venue.addWindow(EXPIRY);
        (bytes32 c, MockMakerPool pc) = venue.addWindow(EXPIRY);
        (bytes32 d,) = venue.addWindow(EXPIRY);
        (bytes32 e,) = venue.addWindow(EXPIRY);
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(maker);
            vault.quote(b, BID_YES, ASK_YES, QTY, expireNs());
        }
        for (uint256 i = 0; i < 6; i++) {
            vm.prank(maker);
            vault.quote(c, BID_YES, ASK_YES, QTY, expireNs());
        }
        uint256 wouldBe = vault.totalDeployed() + (BID_YES + (ONE - ASK_YES)) * QTY / ONE;
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.OverExposure.selector, wouldBe, SUPPLY, uint16(5_000)));
        vm.prank(maker);
        vault.quote(c, BID_YES, ASK_YES, QTY, expireNs());
        // Half a contract on a fourth Window still fits under the cap; a fifth Window does not fit the count.
        vm.prank(maker);
        vault.quote(d, BID_YES, ASK_YES, ONE / 2, expireNs());
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.TooManyWindows.selector, uint32(4), uint32(4)));
        vm.prank(maker);
        vault.quote(e, BID_YES, ASK_YES, ONE, expireNs());
        assertEq(vault.openWindows().length, 4);
        assertBooksBalance();
        pb;
        pc;
    }

    function test_quote_refusesMoreThanLiquid() public {
        uint256 shares = vault.sharesOf(house);
        vm.prank(house);
        vault.withdraw(shares - 10 * ONE);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.InsufficientLiquidity.selector, (BID_YES + (ONE - ASK_YES)) * QTY / ONE, 10 * ONE));
        quoteA();
    }

    function test_admin_isTheOnlyTuner() public {
        IMarketMakerVault.Params memory p = defaultParams();
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.NotAdmin.selector, stranger));
        vault.setParams(p);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.NotAdmin.selector, stranger));
        vault.setMaker(stranger);
        p.maxPriceRaw = ONE;
        vm.expectRevert(IMarketMakerVault.BadParams.selector);
        vault.setParams(p);
        p = defaultParams();
        p.maxOpenWindows = 65;
        vm.expectRevert(IMarketMakerVault.BadParams.selector);
        vault.setParams(p);
        vm.expectRevert(IMarketMakerVault.ZeroAddress.selector);
        vault.setAdmin(address(0));
        vault.setAdmin(stranger);
        assertEq(vault.admin(), stranger);
    }
}
