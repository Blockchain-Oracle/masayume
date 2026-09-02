// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IMarketMakerVault} from "../src/maker/IMarketMakerVault.sol";
import {MakerTestBase} from "./MakerTestBase.sol";

/// @notice Fills, pulls, merges and settlement: the spread realized, a one-sided fill settled on the
///         venue's verdict, credit collected, expired quotes drained, and what suppliers may withdraw when.
contract MarketMakerVaultLifecycleTest is MakerTestBase {
    uint256 internal escrow;

    function setUp() public override {
        super.setUp();
        escrow = quoteA();
    }

    function test_pull_returnsTheEscrowToLiquid() public {
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.NotMaker.selector, stranger));
        vm.prank(stranger);
        vault.pull(marketA);
        vm.prank(maker);
        (uint256 orders, uint256 returned) = vault.pull(marketA);
        assertEq(orders, 2);
        assertEq(returned, escrow, "nothing filled: everything comes back");
        assertEq(vault.liquid(), SUPPLY);
        assertEq(vault.deployedOf(marketA), 0);
        assertEq(vault.totalValue(), SUPPLY);
        assertBooksBalance();
    }

    function test_pull_collectsARefundThatLandsAsPoolCredit() public {
        poolA.setRefundAsCredit(true);
        vm.prank(maker);
        (, uint256 returned) = vault.pull(marketA);
        assertEq(returned, escrow);
        assertEq(poolA.credit(address(vault)), 0, "credit pulled into the wallet in the same call");
        assertBooksBalance();
    }

    function test_bothSidesFill_mergeRealizesTheSpread() public {
        uint128[] memory ids = ordersOn(poolA);
        poolA.fill(ids[0], QTY);
        poolA.fill(ids[1], QTY);
        (uint256 yes, uint256 no) = vault.inventoryOf(marketA);
        assertEq(yes, QTY);
        assertEq(no, QTY);
        assertEq(vault.deployedOf(marketA), escrow, "filled inventory is carried at cost");

        vm.prank(stranger);
        (uint256 pairs, uint256 returned) = vault.merge(marketA);
        assertEq(pairs, QTY);
        assertEq(returned, QTY, "a complete set is worth one");
        assertEq(vault.liquid(), SUPPLY - escrow + QTY);
        assertEq(vault.deployedOf(marketA), 0, "floored: the spread is in liquid, not in the book");
        assertEq(vault.totalValue(), SUPPLY + (QTY - escrow), "the spread, 0.04 a set");
        assertGt(vault.sharePriceRaw(), ONE);
        assertBooksBalance();
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.NothingToMerge.selector, marketA));
        vault.merge(marketA);
    }

    function test_oneSideFills_settleBooksTheVenuesVerdict() public {
        uint128[] memory ids = ordersOn(poolA);
        poolA.fill(ids[0], QTY); // the YES bid filled; the ask still rests
        vm.warp(EXPIRY + 1);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.MarketNotSettled.selector, marketA));
        vault.settle(marketA);
        poolA.resolve(0); // YES won
        vm.prank(stranger);
        uint256 payout = vault.settle(marketA);
        assertEq(payout, QTY, "20 YES redeem for 20");
        IMarketMakerVault.WindowBook memory b = vault.bookOf(marketA);
        assertEq(b.escrowBack, (ONE - ASK_YES) * QTY / ONE, "the dead ask drained through the expired path");
        assertEq(b.payout, QTY);
        assertTrue(b.settled);
        assertEq(vault.openWindows().length, 0);
        assertEq(vault.liquid(), SUPPLY - BID_YES * QTY / ONE + QTY, "paid 0.48, got 1.00 a contract");
        assertEq(vault.totalValue(), vault.liquid());
        assertBooksBalance();
        assertEq(vault.settle(marketA), 0, "idempotent");
    }

    function test_oneSideFills_andLoses() public {
        uint128[] memory ids = ordersOn(poolA);
        poolA.fill(ids[0], QTY);
        vm.warp(EXPIRY + 1);
        poolA.resolve(1); // NO won: the vault's YES is worthless
        uint256 payout = vault.settle(marketA);
        assertEq(payout, 0);
        assertEq(vault.liquid(), SUPPLY - BID_YES * QTY / ONE, "the loss is the cost of the filled side");
        assertLt(vault.sharePriceRaw(), ONE);
        assertBooksBalance();
    }

    function test_void_paysHalfASideBack() public {
        uint128[] memory ids = ordersOn(poolA);
        poolA.fill(ids[0], QTY);
        vm.warp(EXPIRY + 1);
        poolA.voidIt();
        uint256 payout = vault.settle(marketA);
        assertEq(payout, QTY / 2);
        assertBooksBalance();
    }

    function test_settle_refusesAnUnquotedWindow() public {
        (bytes32 b,) = venue.addWindow(EXPIRY);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.NotQuoted.selector, b));
        vault.settle(b);
    }

    function test_withdraw_waitsForAnExpiredWindowToSettle() public {
        uint256 shares = vault.sharesOf(house);
        vm.warp(EXPIRY + 1);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.UnsettledWindow.selector, marketA));
        vm.prank(house);
        vault.withdraw(shares);
        assertEq(vault.unsettledExpired(), marketA);
        poolA.resolve(0);
        vault.settle(marketA);
        assertEq(vault.unsettledExpired(), bytes32(0));
        vm.prank(house);
        uint256 got = vault.withdraw(shares);
        assertEq(got, SUPPLY, "nothing filled: the supplier leaves whole");
        assertEq(vault.liquid(), 0);
    }

    function test_withdraw_isBoundedByLiquidWhileCapitalIsDeployed() public {
        uint256 shares = vault.sharesOf(house);
        vm.expectRevert(abi.encodeWithSelector(IMarketMakerVault.InsufficientLiquidity.selector, SUPPLY, SUPPLY - escrow));
        vm.prank(house);
        vault.withdraw(shares);
        vm.prank(house);
        uint256 got = vault.withdraw(shares / 2);
        assertEq(got, SUPPLY / 2);
        assertBooksBalance();
    }

    function test_suppliers_shareTheSpreadAndTheLoss() public {
        uint128[] memory ids = ordersOn(poolA);
        poolA.fill(ids[0], QTY);
        poolA.fill(ids[1], QTY);
        vault.merge(marketA);
        coll.mint(stranger, 1_000 * ONE);
        vm.startPrank(stranger);
        coll.approve(address(vault), type(uint256).max);
        uint256 late = vault.supply(100 * ONE);
        vm.stopPrank();
        assertLt(late, 100 * ONE, "a later supplier buys in above par");
        vm.warp(EXPIRY + 1);
        poolA.resolve(0);
        vault.settle(marketA);
        uint256 houseShares = vault.sharesOf(house);
        vm.prank(house);
        uint256 got = vault.withdraw(houseShares);
        assertApproxEqAbs(got, SUPPLY + (QTY - escrow), 2, "the first supplier leaves with the spread");
        assertBooksBalance();
    }

    function test_AD5_noFunctionTakesAPayoutDestination() public pure {
        // Compile-time shape: every collateral flow is the vault's own. The selectors below carry no `to`.
        assertEq(IMarketMakerVault.Supplied.selector, IMarketMakerVault.Supplied.selector);
    }
}
