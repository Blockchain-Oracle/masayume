// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IEventVault} from "../vault/IEventVault.sol";

/// @title The registry's vocabulary — records, events and errors.
interface IStrategyRegistry {
    /// @dev A published, copyable strategy. `envelope` is the widest caps a subscriber's STRATEGY
    ///      grant may carry; the grant itself lives on the EventVault and does the enforcing.
    struct Strategy {
        address creator;
        /// @dev The actor every subscriber's grant must name — the one key that trades this strategy.
        address runner;
        /// @dev keccak256 of the canonical spec encoding the runner evaluates (data, never code).
        bytes32 specHash;
        /// @dev Human-readable metadata (name, description, the spec itself), stored plainly.
        string metadata;
        IEventVault.Caps envelope;
        /// @dev Flat fee in collateral base units, paid to the creator on subscribe.
        uint128 subscriptionFee;
        bool active;
        uint64 createdAtSec;
        uint32 subscribers;
        uint32 revision;
    }

    /// @dev One wallet's standing consent to be copied: which grant on the vault backs it.
    struct Subscription {
        uint256 grantId;
        uint64 subscribedAtSec;
        bool active;
    }

    event Published(uint256 indexed strategyId, address indexed creator, address indexed runner, bytes32 specHash, IEventVault.Caps envelope, uint128 fee);
    event Updated(uint256 indexed strategyId, bytes32 specHash, uint128 fee, uint32 revision);
    event RunnerChanged(uint256 indexed strategyId, address indexed runner);
    event Deactivated(uint256 indexed strategyId);
    event Subscribed(uint256 indexed strategyId, address indexed subscriber, uint256 indexed grantId, uint128 feePaid, uint32 subscribers);
    event Unsubscribed(uint256 indexed strategyId, address indexed subscriber, uint32 subscribers);

    error ZeroRunner();
    error BadEnvelope();
    error NoSuchStrategy(uint256 strategyId);
    error NotCreator(uint256 strategyId, address caller);
    error StrategyInactive(uint256 strategyId);
    error NotGrantOwner(uint256 grantId, address caller);
    error WrongGrantKind(uint256 grantId);
    error WrongActor(uint256 grantId, address expected, address got);
    error GrantNotLive(uint256 grantId);
    error CapsOutsideEnvelope(uint256 grantId);
    error NotSubscribed(uint256 strategyId, address subscriber);
}
