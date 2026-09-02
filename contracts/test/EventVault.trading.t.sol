// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IEventVault} from "../src/vault/IEventVault.sol";
import {VaultTestBase} from "./VaultTestBase.sol";

contract EventVaultTradingTest is VaultTestBase {
    uint256 internal yesId;
    uint256 internal noId;

    function setUp() public override {
        super.setUp();
        yesId = venue.YES();
        noId = venue.NO();
        depositAs(owner, DEPOSIT);
    }

    // --- attended lane ---

    function test_place_buyBooksTokensAndChargesActualCost() public {
        vm.prank(owner);
        (uint256 spent, uint256 gained) = vault.place(market, 0, true, 700_000, 100 * ONE, EXPIRE_NS);
        assertEq(gained, 100 * ONE, "IOC filled in full");
        assertEq(spent, 60 * ONE, "charged the 0.60 fill, not the 0.70 limit");
        assertEq(available(owner), DEPOSIT - 60 * ONE);
        assertEq(vault.positionOf(owner, yesId), 100 * ONE);
    }

    function test_place_refundLandingAsPoolCreditIsStillCash() public {
        venue.setRefundAsCredit(true);
        vm.prank(owner);
        (uint256 spent,) = vault.place(market, 0, true, 700_000, 100 * ONE, EXPIRE_NS);
        assertEq(spent, 60 * ONE, "the credited refund counts as the vault's cash");
        assertEq(venue.credit(address(vault)), 10 * ONE);
        assertEq(vault.sweep(address(venue)), 10 * ONE);
        assertEq(venue.credit(address(vault)), 0);
        vm.prank(owner);
        vault.withdraw(DEPOSIT - 60 * ONE);
    }

    function test_place_partialFillChargesOnlyWhatFilled() public {
        venue.setFill(600_000, 2_500);
        vm.prank(owner);
        (uint256 spent, uint256 gained) = vault.place(market, 0, true, 700_000, 100 * ONE, EXPIRE_NS);
        assertEq(gained, 25 * ONE);
        assertEq(spent, 15 * ONE);
    }

    function test_place_nothingFilledIsANoOp() public {
        vm.prank(owner);
        (uint256 spent, uint256 gained) = vault.place(market, 0, true, 500_000, 100 * ONE, EXPIRE_NS);
        assertEq(spent, 0);
        assertEq(gained, 0);
        assertEq(available(owner), DEPOSIT);
    }

    function test_place_noBuyRunsInNoTerms() public {
        vm.prank(owner);
        (uint256 spent, uint256 gained) = vault.place(market, 1, true, 500_000, 100 * ONE, EXPIRE_NS); // NO limit 0.50 ≥ 0.40 fill
        assertEq(gained, 100 * ONE);
        assertEq(spent, 40 * ONE);
        assertEq(vault.positionOf(owner, noId), 100 * ONE);
    }

    function test_place_sellCreditsProceedsAndRefusesOversell() public {
        vm.startPrank(owner);
        vault.place(market, 0, true, 700_000, 100 * ONE, EXPIRE_NS);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.Insufficient.selector, 101 * ONE, 100 * ONE));
        vault.place(market, 0, false, 500_000, 101 * ONE, EXPIRE_NS);
        (uint256 received, uint256 sold) = vault.place(market, 0, false, 500_000, 40 * ONE, EXPIRE_NS);
        vm.stopPrank();
        assertEq(sold, 40 * ONE);
        assertEq(received, 24 * ONE);
        assertEq(vault.positionOf(owner, yesId), 60 * ONE);
        assertEq(available(owner), DEPOSIT - 60 * ONE + 24 * ONE);
    }

    function test_place_refusesWhenNotTrading() public {
        venue.setStatus(2);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.MarketNotTrading.selector, uint8(2)));
        vault.place(market, 0, true, 700_000, ONE, EXPIRE_NS);
    }

    function test_place_refusesMoreThanAvailable() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.Insufficient.selector, 1_200 * ONE, DEPOSIT));
        vault.place(market, 0, true, 600_000, 2_000 * ONE, EXPIRE_NS);
    }

    function test_place_feesAreInTheCharge() public {
        venue.setFee(100); // 1% taker fee
        vm.prank(owner);
        (uint256 spent,) = vault.place(market, 0, true, 700_000, 100 * ONE, EXPIRE_NS);
        assertEq(spent, 60 * ONE + 600_000);
    }

    // --- delegated lane ---

    function test_placeFor_spendsBudgetNotAvailable() public {
        uint256 id = grantStrategy(200 * ONE, caps(50 * ONE, 100 * ONE, 5, 0));
        vm.prank(actor);
        (uint256 spent, uint256 gained) = vault.placeFor(id, market, 0, true, 700_000, 50 * ONE, EXPIRE_NS);
        assertEq(spent, 30 * ONE);
        assertEq(gained, 50 * ONE);
        assertEq(vault.grantOf(id).budget, 170 * ONE);
        assertEq(available(owner), DEPOSIT - 200 * ONE, "the owner's free balance is untouched");
        assertEq(vault.positionOf(owner, yesId), 50 * ONE, "the position is the owner's");
        assertEq(vault.grantOf(id).openPositions, 1);
    }

    function test_placeFor_onlyTheActor() public {
        uint256 id = grantStrategy(200 * ONE, caps(50 * ONE, 100 * ONE, 5, 0));
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.NotGrantActor.selector, id, stranger));
        vault.placeFor(id, market, 0, true, 700_000, ONE, EXPIRE_NS);
    }

    function test_placeFor_revokedAndExpiredStop() public {
        uint256 id = grantStrategy(200 * ONE, caps(50 * ONE, 100 * ONE, 5, 0));
        vm.warp(block.timestamp + 1 days + 1);
        uint64 expiresAt = vault.grantOf(id).expiresAtSec;
        vm.prank(actor);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.GrantExpired.selector, id, expiresAt));
        vault.placeFor(id, market, 0, true, 700_000, ONE, EXPIRE_NS);
        vm.warp(block.timestamp - 2);
        vm.prank(owner);
        vault.revoke(id);
        vm.prank(actor);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.GrantIsRevoked.selector, id));
        vault.placeFor(id, market, 0, true, 700_000, ONE, EXPIRE_NS);
    }

    function test_placeFor_perTradeCapRevertsWholeTx() public {
        uint256 id = grantStrategy(200 * ONE, caps(10 * ONE, 100 * ONE, 5, 0));
        vm.prank(actor);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.OverStakeCap.selector, 30 * ONE, uint128(10 * ONE)));
        vault.placeFor(id, market, 0, true, 700_000, 50 * ONE, EXPIRE_NS);
        assertEq(vault.grantOf(id).budget, 200 * ONE);
        assertEq(vault.positionOf(owner, yesId), 0);
    }

    function test_placeFor_dailyCapBucketsByUtcDay() public {
        uint256 id = grantStrategy(500 * ONE, caps(50 * ONE, 50 * ONE, 9, 0));
        vm.startPrank(actor);
        vault.placeFor(id, market, 0, true, 700_000, 50 * ONE, EXPIRE_NS); // 30
        vm.expectRevert(abi.encodeWithSelector(IEventVault.OverDailyCap.selector, 60 * ONE, uint128(50 * ONE)));
        vault.placeFor(id, market, 0, true, 700_000, 50 * ONE, EXPIRE_NS);
        vm.warp((block.timestamp / 1 days + 1) * 1 days); // 00:00 UTC next day
        vault.placeFor(id, market, 0, true, 700_000, 50 * ONE, EXPIRE_NS);
        vm.stopPrank();
        assertEq(vault.grantOf(id).spentToday, 30 * ONE);
    }

    function test_placeFor_openPositionCap() public {
        uint256 id = grantStrategy(500 * ONE, caps(50 * ONE, 500 * ONE, 1, 0));
        vm.startPrank(actor);
        vault.placeFor(id, market, 0, true, 700_000, 10 * ONE, EXPIRE_NS);
        vault.placeFor(id, market, 0, true, 700_000, 10 * ONE, EXPIRE_NS); // same position, not a new one
        vm.expectRevert(abi.encodeWithSelector(IEventVault.OverPositionCap.selector, uint32(2), uint32(1)));
        vault.placeFor(id, market, 1, true, 500_000, 10 * ONE, EXPIRE_NS);
        vm.stopPrank();
    }

    function test_placeFor_priceCapInTheSidesOwnTerms() public {
        uint256 id = grantStrategy(500 * ONE, caps(50 * ONE, 500 * ONE, 9, 650_000));
        vm.startPrank(actor);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.OverPriceCap.selector, 700_000, uint64(650_000)));
        vault.placeFor(id, market, 0, true, 700_000, 10 * ONE, EXPIRE_NS);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.OverPriceCap.selector, 700_000, uint64(650_000)));
        vault.placeFor(id, market, 1, true, 300_000, 10 * ONE, EXPIRE_NS); // a YES limit of 0.30 is NO at 0.70
        (, uint256 gained) = vault.placeFor(id, market, 1, true, 400_000, 10 * ONE, EXPIRE_NS); // NO at 0.60, under the cap
        vm.stopPrank();
        assertEq(gained, 10 * ONE);
    }

    function test_placeFor_saleProceedsGoToOwnerNotBudget() public {
        uint256 id = grantStrategy(200 * ONE, caps(50 * ONE, 100 * ONE, 5, 0));
        vm.startPrank(actor);
        vault.placeFor(id, market, 0, true, 700_000, 50 * ONE, EXPIRE_NS);
        vault.placeFor(id, market, 0, false, 500_000, 50 * ONE, EXPIRE_NS);
        vm.stopPrank();
        assertEq(vault.grantOf(id).budget, 170 * ONE, "budget only ever goes down");
        assertEq(available(owner), DEPOSIT - 200 * ONE + 30 * ONE);
    }

    function test_placeFor_budgetIsTheCeiling() public {
        uint256 id = grantStrategy(20 * ONE, caps(50 * ONE, 100 * ONE, 5, 0));
        vm.prank(actor);
        // refused up front at the escrow the pool would take (50 × 0.70), not at the 0.60 fill
        vm.expectRevert(abi.encodeWithSelector(IEventVault.Insufficient.selector, 35 * ONE, 20 * ONE));
        vault.placeFor(id, market, 0, true, 700_000, 50 * ONE, EXPIRE_NS);
    }

    // --- settlement ---

    function test_crankSettle_winnerPaysIntoAvailable_anyoneCranks() public {
        uint256 id = grantStrategy(200 * ONE, caps(50 * ONE, 100 * ONE, 5, 0));
        vm.prank(actor);
        vault.placeFor(id, market, 0, true, 700_000, 50 * ONE, EXPIRE_NS);
        vm.prank(stranger);
        vm.expectRevert(IEventVault.MarketNotSettled.selector);
        vault.crankSettle(owner, market);
        venue.resolve(0);
        vm.prank(stranger);
        uint256 payout = vault.crankSettle(owner, market);
        assertEq(payout, 50 * ONE);
        assertEq(available(owner), DEPOSIT - 200 * ONE + 50 * ONE);
        assertEq(vault.positionOf(owner, yesId), 0);
        assertEq(vault.grantOf(id).openPositions, 0);
        assertEq(coll.balanceOf(stranger), 0);
    }

    function test_crankSettle_voidPaysHalfToBothSides_loserPaysZero() public {
        vm.startPrank(owner);
        vault.place(market, 0, true, 700_000, 100 * ONE, EXPIRE_NS);
        vault.place(market, 1, true, 500_000, 100 * ONE, EXPIRE_NS);
        vm.stopPrank();
        venue.voidIt();
        assertEq(vault.crankSettle(owner, market), 100 * ONE);
        vm.expectRevert(IEventVault.NothingToSettle.selector);
        vault.crankSettle(owner, market);
    }

    // --- the two named invariants from the spine ---

    /// @dev A compromised delegate key can at worst open in-cap positions for the rightful owner.
    function test_AD5_no_divert() public {
        uint256 id = grantStrategy(200 * ONE, caps(50 * ONE, 100 * ONE, 5, 0));
        uint256 actorBefore = coll.balanceOf(actor);
        vm.startPrank(actor);
        vault.placeFor(id, market, 0, true, 700_000, 50 * ONE, EXPIRE_NS);
        vault.placeFor(id, market, 0, false, 500_000, 20 * ONE, EXPIRE_NS);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.Insufficient.selector, 1, 0));
        vault.withdraw(1); // the actor has no account of its own to draw on
        vm.expectRevert(abi.encodeWithSelector(IEventVault.NotGrantOwner.selector, id, actor));
        vault.fundGrant(id, 1);
        vm.stopPrank();
        venue.resolve(0);
        vault.crankSettle(owner, market);
        assertEq(coll.balanceOf(actor), actorBefore, "the actor never receives collateral");
        // Every unit the owner deposited is still theirs: free balance + budget + what the fills returned.
        uint256 spent = 30 * ONE;
        uint256 saleProceeds = 12 * ONE;
        uint256 payout = 30 * ONE;
        assertEq(available(owner) + vault.grantOf(id).budget, DEPOSIT - spent + saleProceeds + payout);
    }

    /// @dev Storage carries the venue's market id, never the pool the market happened to run on.
    function test_AD10_no_pool_address_in_storage() public {
        uint256 id = grantStrategy(200 * ONE, caps(50 * ONE, 100 * ONE, 5, 0));
        vm.record();
        vm.prank(owner);
        vault.place(market, 0, true, 700_000, 10 * ONE, EXPIRE_NS);
        vm.prank(actor);
        vault.placeFor(id, market, 1, true, 500_000, 10 * ONE, EXPIRE_NS);
        venue.voidIt();
        vault.crankSettle(owner, market);
        (, bytes32[] memory writes) = vm.accesses(address(vault));
        assertGt(writes.length, 0);
        assertNoPoolInStorage(writes);
    }
}
