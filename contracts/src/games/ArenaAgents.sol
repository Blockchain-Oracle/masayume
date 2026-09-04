// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../interfaces/IDreamDex.sol";
import {ArenaMatches} from "./ArenaMatches.sol";

/// @title A match-scoped agent per seat: the key that swipes so the wallet signs once.
/// @notice Flicky reaches this with sponsored transactions — a player signs nothing per card. Here the
///         entry transaction names a browser key as the seat's agent, funds it with gas in the same call,
///         and from then on every pick is `placePickFor`, signed by the key and paid for by the player:
///         the stake is drawn from the player's wallet under the allowance the entry already took, and the
///         unspent part returns to the player. The key can place picks for one seat of one match, within
///         the deck's own ceiling, until a deadline — and nothing else. It cannot withdraw, cannot redirect
///         a pot (`creator` and `challenger` are never rewritten), and a match that is over refuses it
///         before this contract is even consulted.
abstract contract ArenaAgents is ArenaMatches {
    /// @dev A grant outlives no match that is still being played: the pick window is minutes. A day is a
    ///      ceiling on the stored deadline, not a promise of anything a finished match would still allow.
    uint32 internal constant MAX_AGENT_TTL_SEC = 1 days;

    mapping(bytes32 matchId => mapping(address player => Agent)) internal _agents;

    constructor(IERC20 collateral_, IBinaryModule module_, IOutcomeToken6909 outcomeToken_, bytes32 venueId_, Params memory params_)
        ArenaMatches(collateral_, module_, outcomeToken_, venueId_, params_)
    {}

    /// @notice Names the key that may place this seat's picks — or, with `agent == 0`, revokes it. The
    ///         budget is not a parameter: it is the deck's own ceiling, every card at the tier's cap.
    function authorizeAgent(bytes32 matchId, address agent, uint32 ttlSec) external {
        Match storage m = _get(matchId);
        _seatOf(m, msg.sender);
        _authorizeAgent(matchId, m, msg.sender, agent, ttlSec);
    }

    function agentOf(bytes32 matchId, address player) external view returns (Agent memory) {
        return _agents[matchId][player];
    }

    function _authorizeAgent(bytes32 matchId, Match storage m, address player, address agent, uint32 ttlSec) internal {
        if (agent == address(0)) {
            delete _agents[matchId][player];
            emit AgentAuthorized(matchId, player, address(0), 0, 0);
            return;
        }
        if (ttlSec == 0 || ttlSec > MAX_AGENT_TTL_SEC) revert BadTtl(ttlSec);
        uint64 expiresAtSec = uint64(block.timestamp) + ttlSec;
        uint128 budget = _u128(uint256(m.perCardCapBase) * m.deckSize);
        _agents[matchId][player] = Agent({agent: agent, expiresAtSec: expiresAtSec, budgetBase: budget, spentBase: 0});
        emit AgentAuthorized(matchId, player, agent, expiresAtSec, budget);
    }

    /// @dev The caller must be `player`'s live agent on this match, with budget left for `stake`. The
    ///      spend is booked gross — the stake handed over, not the cost after refund — so the ceiling is
    ///      the deck's, never a guess about fills.
    function _requireAgent(bytes32 matchId, address player, uint256 stake) internal {
        Agent storage a = _agents[matchId][player];
        if (a.agent == address(0) || msg.sender != a.agent) revert NotAgent(matchId, player, msg.sender);
        if (block.timestamp > a.expiresAtSec) revert AgentExpired(matchId, a.expiresAtSec);
        uint256 spent = uint256(a.spentBase) + stake;
        if (spent > a.budgetBase) revert AgentOverBudget(matchId, spent, a.budgetBase);
        a.spentBase = _u128(spent);
    }

    /// @dev Gas for the key, carried in the entry transaction so the player signs once: whatever native
    ///      value rides on `createMatchWithAgent` or `joinMatchWithAgent` is forwarded to the agent. The
    ///      arena keeps none of it, and the key is the player's own, so an unspent remainder stays theirs.
    function _fundAgent(address agent) internal {
        if (msg.value == 0) return;
        (bool ok,) = payable(agent).call{value: msg.value}("");
        if (!ok) revert AgentUnfunded(agent);
        emit AgentFunded(agent, msg.value);
    }
}
