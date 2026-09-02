// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IEventVault} from "../vault/IEventVault.sol";
import {IStrategyRegistry} from "./IStrategyRegistry.sol";

/// @dev The vault views the registry reads; declared here so the registry needs no vault bytecode.
interface IEventVaultReads {
    function grantOf(uint256 grantId) external view returns (IEventVault.Grant memory);
    function isGrantLive(uint256 grantId) external view returns (bool);
}

/// @title StrategyRegistry — who may copy-trade whom, under which ceilings, for what fee.
/// @notice Ported from Yosuku's `strategy.move` + `social_vault::Subscription`. A creator
///         publishes a strategy bound to one runner key and a caps envelope; a subscriber
///         proves a live EventVault STRATEGY grant to that runner, inside the envelope, and pays
///         the creator's fee. The registry moves no user funds beyond that fee: execution and
///         every cap live on the vault (AD-5), and the runner can only ever open positions the
///         subscriber owns.
/// @dev Stores and emits no pool address (AD-10); market identity never enters this contract.
contract StrategyRegistry is IStrategyRegistry, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IEventVaultReads public immutable vault;
    IERC20 public immutable collateral;

    /// @dev `strategyId` is the 1-based index; 0 means "none".
    Strategy[] private _strategies;
    mapping(uint256 strategyId => mapping(address subscriber => Subscription)) private _subscriptions;
    /// @dev Every wallet that ever subscribed, so a runner can page through them; `active` says who still is.
    mapping(uint256 strategyId => address[]) private _subscribersOf;

    constructor(IEventVaultReads vault_, IERC20 collateral_) {
        vault = vault_;
        collateral = collateral_;
    }

    // ------------------------------------------------------------------ creators

    function publish(address runner, bytes32 specHash, string calldata metadata, IEventVault.Caps calldata envelope, uint128 fee)
        external
        returns (uint256 strategyId)
    {
        if (runner == address(0)) revert ZeroRunner();
        if (envelope.maxStakePerTrade == 0 || envelope.maxDailySpend == 0 || envelope.maxOpenPositions == 0) revert BadEnvelope();
        _strategies.push(
            Strategy({
                creator: msg.sender,
                runner: runner,
                specHash: specHash,
                metadata: metadata,
                envelope: envelope,
                subscriptionFee: fee,
                active: true,
                createdAtSec: uint64(block.timestamp),
                subscribers: 0,
                revision: 0
            })
        );
        strategyId = _strategies.length;
        emit Published(strategyId, msg.sender, runner, specHash, envelope, fee);
    }

    /// @notice A new spec revision or fee. The envelope is fixed for life: subscribers agreed to it.
    function update(uint256 strategyId, bytes32 specHash, string calldata metadata, uint128 fee) external {
        Strategy storage s = _owned(strategyId);
        s.specHash = specHash;
        s.metadata = metadata;
        s.subscriptionFee = fee;
        s.revision += 1;
        emit Updated(strategyId, specHash, fee, s.revision);
    }

    /// @notice Rotate the runner key. Existing grants name the old key, so subscribers re-grant to follow.
    function setRunner(uint256 strategyId, address runner) external {
        if (runner == address(0)) revert ZeroRunner();
        _owned(strategyId).runner = runner;
        emit RunnerChanged(strategyId, runner);
    }

    function deactivate(uint256 strategyId) external {
        _owned(strategyId).active = false;
        emit Deactivated(strategyId);
    }

    // ------------------------------------------------------------------ subscribers

    /// @notice Consent to be copied: the caller's live STRATEGY grant to this strategy's runner,
    ///         inside the envelope. The fee, if any, goes straight from the caller to the creator.
    function subscribe(uint256 strategyId, uint256 grantId) external nonReentrant {
        Strategy storage s = _strategyOf(strategyId);
        if (!s.active) revert StrategyInactive(strategyId);
        _requireEligibleGrant(s, grantId, msg.sender);

        Subscription storage sub = _subscriptions[strategyId][msg.sender];
        if (sub.subscribedAtSec == 0) _subscribersOf[strategyId].push(msg.sender);
        if (!sub.active) s.subscribers += 1;
        sub.grantId = grantId;
        sub.subscribedAtSec = uint64(block.timestamp);
        sub.active = true;

        uint128 fee = s.subscriptionFee;
        if (fee != 0) collateral.safeTransferFrom(msg.sender, s.creator, fee);
        emit Subscribed(strategyId, msg.sender, grantId, fee, s.subscribers);
    }

    /// @notice Ends the consent record. Revoking the grant on the vault is what actually stops the runner;
    ///         this keeps the registry's count honest either way.
    function unsubscribe(uint256 strategyId) external {
        Strategy storage s = _strategyOf(strategyId);
        Subscription storage sub = _subscriptions[strategyId][msg.sender];
        if (!sub.active) revert NotSubscribed(strategyId, msg.sender);
        sub.active = false;
        s.subscribers -= 1;
        emit Unsubscribed(strategyId, msg.sender, s.subscribers);
    }

    // ------------------------------------------------------------------ views

    function strategyCount() external view returns (uint256) {
        return _strategies.length;
    }

    function strategyOf(uint256 strategyId) external view returns (Strategy memory) {
        return _strategyOf(strategyId);
    }

    function subscriptionOf(uint256 strategyId, address subscriber) external view returns (Subscription memory) {
        return _subscriptions[strategyId][subscriber];
    }

    function subscriberCountOf(uint256 strategyId) external view returns (uint256) {
        return _subscribersOf[strategyId].length;
    }

    /// @notice Everyone who ever subscribed, oldest first, paged; read `subscriptionOf` for who still is.
    function subscribersOf(uint256 strategyId, uint256 offset, uint256 limit) external view returns (address[] memory page) {
        address[] storage all = _subscribersOf[strategyId];
        if (offset >= all.length) return page;
        uint256 end = offset + limit;
        if (end > all.length) end = all.length;
        page = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = all[i];
        }
    }

    /// @notice A subscription the runner may act on right now: consent on record, and a live grant to it.
    function isSubscriptionLive(uint256 strategyId, address subscriber) external view returns (bool) {
        Subscription storage sub = _subscriptions[strategyId][subscriber];
        if (!sub.active || !vault.isGrantLive(sub.grantId)) return false;
        IEventVault.Grant memory g = vault.grantOf(sub.grantId);
        return g.owner == subscriber && g.actor == _strategyOf(strategyId).runner && g.kind == IEventVault.GrantKind.STRATEGY;
    }

    // ------------------------------------------------------------------ internals

    function _strategyOf(uint256 strategyId) internal view returns (Strategy storage) {
        if (strategyId == 0 || strategyId > _strategies.length) revert NoSuchStrategy(strategyId);
        return _strategies[strategyId - 1];
    }

    function _owned(uint256 strategyId) internal view returns (Strategy storage s) {
        s = _strategyOf(strategyId);
        if (s.creator != msg.sender) revert NotCreator(strategyId, msg.sender);
    }

    function _requireEligibleGrant(Strategy storage s, uint256 grantId, address subscriber) internal view {
        IEventVault.Grant memory g = vault.grantOf(grantId);
        if (g.owner != subscriber) revert NotGrantOwner(grantId, subscriber);
        if (g.kind != IEventVault.GrantKind.STRATEGY) revert WrongGrantKind(grantId);
        if (g.actor != s.runner) revert WrongActor(grantId, s.runner, g.actor);
        if (!vault.isGrantLive(grantId)) revert GrantNotLive(grantId);
        IEventVault.Caps memory env = s.envelope;
        bool inside = g.caps.maxStakePerTrade <= env.maxStakePerTrade && g.caps.maxDailySpend <= env.maxDailySpend
            && g.caps.maxOpenPositions <= env.maxOpenPositions
            && (env.maxPriceRaw == 0 || (g.caps.maxPriceRaw != 0 && g.caps.maxPriceRaw <= env.maxPriceRaw));
        if (!inside) revert CapsOutsideEnvelope(grantId);
    }
}
