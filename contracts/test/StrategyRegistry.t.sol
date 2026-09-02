// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IEventVaultReads, StrategyRegistry} from "../src/strategy/StrategyRegistry.sol";
import {IStrategyRegistry} from "../src/strategy/IStrategyRegistry.sol";
import {IEventVault} from "../src/vault/IEventVault.sol";
import {VaultTestBase} from "./VaultTestBase.sol";

/// @notice The registry over the real EventVault and the mock venue: consent is a live grant, the fee
///         is the only money it ever moves, and nothing here can reach a subscriber's balance.
contract StrategyRegistryTest is VaultTestBase {
    StrategyRegistry internal registry;
    address internal creator = makeAddr("creator");
    address internal runner = makeAddr("runner");
    uint256 internal strategyId;
    uint128 internal constant FEE = 2 * 1e6;

    function setUp() public override {
        super.setUp();
        registry = new StrategyRegistry(IEventVaultReads(address(vault)), IERC20(address(coll)));
        depositAs(owner, DEPOSIT);
        vm.prank(creator);
        strategyId = registry.publish(runner, keccak256("momentum:6:20"), '{"name":"Oracle follow"}', caps(50 * ONE, 200 * ONE, 3, 0), FEE);
        vm.prank(owner);
        coll.approve(address(registry), type(uint256).max);
    }

    function _grantTo(address actor, IEventVault.Caps memory c, uint256 budget) internal returns (uint256 id) {
        vm.prank(owner);
        id = vault.grant(IEventVault.GrantKind.STRATEGY, actor, c, uint64(block.timestamp + 1 days), budget);
    }

    function test_publish_recordsTheStrategy() public view {
        IStrategyRegistry.Strategy memory s = registry.strategyOf(strategyId);
        assertEq(s.creator, creator);
        assertEq(s.runner, runner);
        assertTrue(s.active);
        assertEq(s.subscriptionFee, FEE);
        assertEq(registry.strategyCount(), 1);
    }

    function test_publish_refusesEmptyEnvelopeOrRunner() public {
        vm.startPrank(creator);
        vm.expectRevert(IStrategyRegistry.ZeroRunner.selector);
        registry.publish(address(0), bytes32(0), "", caps(1, 1, 1, 0), 0);
        vm.expectRevert(IStrategyRegistry.BadEnvelope.selector);
        registry.publish(runner, bytes32(0), "", caps(0, 1, 1, 0), 0);
        vm.stopPrank();
    }

    function test_subscribe_withLiveGrantInsideEnvelope_paysFeeToCreator() public {
        uint256 grantId = _grantTo(runner, caps(20 * ONE, 100 * ONE, 2, 0), 100 * ONE);
        uint256 creatorBefore = coll.balanceOf(creator);
        vm.prank(owner);
        registry.subscribe(strategyId, grantId);
        IStrategyRegistry.Subscription memory sub = registry.subscriptionOf(strategyId, owner);
        assertTrue(sub.active);
        assertEq(sub.grantId, grantId);
        assertEq(registry.strategyOf(strategyId).subscribers, 1);
        assertEq(coll.balanceOf(creator), creatorBefore + FEE, "the fee reaches the creator");
        assertEq(coll.balanceOf(address(registry)), 0, "the registry holds nothing");
        assertTrue(registry.isSubscriptionLive(strategyId, owner));
        assertEq(registry.subscribersOf(strategyId, 0, 10)[0], owner);
    }

    function test_subscribe_refusesSomeoneElsesGrant() public {
        uint256 grantId = _grantTo(runner, caps(20 * ONE, 100 * ONE, 2, 0), 100 * ONE);
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IStrategyRegistry.NotGrantOwner.selector, grantId, stranger));
        registry.subscribe(strategyId, grantId);
    }

    function test_subscribe_refusesWrongKindActorOrDeadGrant() public {
        vm.prank(owner);
        uint256 sessionGrant = vault.grant(IEventVault.GrantKind.SESSION, runner, caps(1 * ONE, 1 * ONE, 1, 0), uint64(block.timestamp + 1 days), 0);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IStrategyRegistry.WrongGrantKind.selector, sessionGrant));
        registry.subscribe(strategyId, sessionGrant);

        uint256 wrongActor = _grantTo(stranger, caps(20 * ONE, 100 * ONE, 2, 0), 10 * ONE);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IStrategyRegistry.WrongActor.selector, wrongActor, runner, stranger));
        registry.subscribe(strategyId, wrongActor);

        uint256 revoked = _grantTo(runner, caps(20 * ONE, 100 * ONE, 2, 0), 10 * ONE);
        vm.prank(owner);
        vault.revoke(revoked);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IStrategyRegistry.GrantNotLive.selector, revoked));
        registry.subscribe(strategyId, revoked);
    }

    function test_subscribe_refusesCapsOutsideEnvelope() public {
        uint256 tooBig = _grantTo(runner, caps(60 * ONE, 100 * ONE, 2, 0), 100 * ONE);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IStrategyRegistry.CapsOutsideEnvelope.selector, tooBig));
        registry.subscribe(strategyId, tooBig);
    }

    function test_unsubscribe_andRevokedGrantEndsLiveness() public {
        uint256 grantId = _grantTo(runner, caps(20 * ONE, 100 * ONE, 2, 0), 100 * ONE);
        vm.prank(owner);
        registry.subscribe(strategyId, grantId);
        vm.prank(owner);
        vault.revoke(grantId);
        assertFalse(registry.isSubscriptionLive(strategyId, owner), "a revoked grant is not a live subscription");
        vm.prank(owner);
        registry.unsubscribe(strategyId);
        assertEq(registry.strategyOf(strategyId).subscribers, 0);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IStrategyRegistry.NotSubscribed.selector, strategyId, owner));
        registry.unsubscribe(strategyId);
    }

    function test_creatorOnly_update_setRunner_deactivate() public {
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IStrategyRegistry.NotCreator.selector, strategyId, stranger));
        registry.update(strategyId, bytes32(0), "", 0);
        vm.startPrank(creator);
        registry.update(strategyId, keccak256("v2"), "{}", 0);
        assertEq(registry.strategyOf(strategyId).revision, 1);
        registry.setRunner(strategyId, stranger);
        registry.deactivate(strategyId);
        vm.stopPrank();
        uint256 grantId = _grantTo(stranger, caps(20 * ONE, 100 * ONE, 2, 0), 10 * ONE);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IStrategyRegistry.StrategyInactive.selector, strategyId));
        registry.subscribe(strategyId, grantId);
    }

    /// @dev The runner trades the subscriber's grant on the vault; the registry is never in the money path.
    function test_AD5_registry_never_touches_subscriber_funds() public {
        uint256 grantId = _grantTo(runner, caps(20 * ONE, 100 * ONE, 2, 0), 100 * ONE);
        vm.prank(owner);
        registry.subscribe(strategyId, grantId);
        vm.prank(runner);
        vault.placeFor(grantId, market, 0, true, 700_000, 20 * ONE, EXPIRE_NS);
        assertEq(vault.positionOf(owner, venue.YES()), 20 * ONE, "the position is the subscriber's");
        assertEq(coll.balanceOf(address(registry)), 0);
        assertEq(coll.balanceOf(runner), 0);
    }

    function test_AD10_no_pool_address_in_storage() public {
        uint256 grantId = _grantTo(runner, caps(20 * ONE, 100 * ONE, 2, 0), 100 * ONE);
        vm.record();
        vm.prank(owner);
        registry.subscribe(strategyId, grantId);
        (, bytes32[] memory writes) = vm.accesses(address(registry));
        bytes32 pool = bytes32(uint256(uint160(address(venue))));
        for (uint256 i = 0; i < writes.length; i++) {
            assertTrue(vm.load(address(registry), writes[i]) != pool, "pool address persisted in registry storage");
        }
    }
}
