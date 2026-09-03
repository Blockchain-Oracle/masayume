// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IBinaryModule, IOutcomeToken6909} from "../interfaces/IDreamDex.sol";
import {ArenaCommitment} from "./ArenaCommitment.sol";
import {ArenaGateway} from "./ArenaGateway.sol";

/// @title GameArena — a two-player duel over real DreamDEX Windows: each card is one confirmed IOC pick,
///        and only the side-pot is the arena's to award.
/// @notice Ported from Flicky's `duel` module (`reference/flicky/apps/contracts/sources/duel.move:123-220`)
///         with one deliberate difference. Flicky settles from keeper-fed prices because its venue has no
///         public settlement read; Masayume redeems each pick through DreamDEX's own module and books the
///         payout the venue paid, so no oracle key sits between a player and their money.
/// @dev The economic spine: a pick's cost and quantity are deltas measured around the IOC, a card's payout
///      is the delta measured around the redemption, and the winner is the greater sum of `payout - cost`.
///      Nothing in this contract prices anything. The pot is the only money it decides.
/// @dev Card settlement is deliberately independent of the pot. A match whose pot was forfeited or refunded
///      still holds two players' real positions, so `settleCard` keeps working in every status past the
///      reveal — losing a pot must never cost a player the market position they paid for.
/// @dev Storage and events carry market ids only (AD-10). Credits pay the player, never the caller (AD-5).
contract GameArena is ArenaGateway, ReentrancyGuard {
    using SafeERC20 for IERC20;

    mapping(bytes32 matchId => Match) private _matches;
    mapping(bytes32 matchId => bytes32[]) private _cards;
    /// @dev Keyed by `cardIndex * 2 + seat`, so one card's two picks sit beside each other.
    mapping(bytes32 matchId => mapping(uint16 slot => PickRecord)) private _picks;
    mapping(bytes32 matchId => int256[2] bySeat) private _pnl;

    mapping(address player => uint256) public creditOf;
    /// @dev Pots held for undecided matches, and credits owed but unclaimed. The arena's collateral
    ///      balance is at least their sum after every call; the rest is dust the venue refunded.
    uint256 public escrowed;
    uint256 public credited;

    constructor(IERC20 collateral_, IBinaryModule module_, IOutcomeToken6909 outcomeToken_, bytes32 venueId_, Params memory params_)
        ArenaGateway(collateral_, module_, outcomeToken_, venueId_, params_)
    {}

    // ------------------------------------------------------------------ entry

    /// @notice Opens a match against one named opponent and escrows the creator's side-pot.
    /// @dev The challenger is named at creation rather than left open. The deck commitment is taken over
    ///      BOTH players' client seeds, which only exist once the matchmaker has paired them — so an open
    ///      match a stranger could join would publish a commitment binding a seed that stranger never
    ///      chose. Pairing happens off-chain; this is the chain recording it.
    function createMatch(bytes32 matchId, address challenger, uint8 tier, bytes32 deckHash, uint8 deckSize, uint32 policyVersion)
        external
        nonReentrant
    {
        if (paused) revert IsPaused();
        if (challenger == address(0)) revert ZeroAddress();
        if (challenger == msg.sender) revert SelfJoin();
        if (deckHash == bytes32(0)) revert DeckMismatch(deckHash, bytes32(0));
        Match storage m = _matches[matchId];
        if (m.creator != address(0)) revert MatchExists(matchId);
        Params memory p = params;
        if (deckSize < p.minDeckSize || deckSize > p.maxDeckSize) revert BadDeckSize(deckSize);
        Tier memory t = tierOf[tier];
        if (!t.enabled) revert UnknownTier(tier);

        m.creator = msg.sender;
        m.challenger = challenger;
        m.tier = tier;
        m.status = Status.WAITING;
        m.deckSize = deckSize;
        m.policyVersion = policyVersion;
        m.deckHash = deckHash;
        m.createdAtSec = uint64(block.timestamp);
        m.potBase = t.potBase;
        m.perCardCapBase = t.perCardCapBase;

        if (t.potBase != 0) {
            collateral.safeTransferFrom(msg.sender, address(this), t.potBase);
            escrowed += t.potBase;
        }
        emit MatchCreated(matchId, msg.sender, tier, t.potBase, deckHash, deckSize, m.createdAtSec + p.joinWindowSec);
    }

    /// @notice The named challenger matches the pot. Nothing else can be joined.
    function joinMatch(bytes32 matchId) external nonReentrant {
        if (paused) revert IsPaused();
        Match storage m = _get(matchId);
        if (m.status != Status.WAITING) revert WrongStatus(matchId, m.status);
        if (msg.sender != m.challenger) revert NotAPlayer(msg.sender);
        uint64 deadline = m.createdAtSec + params.joinWindowSec;
        if (block.timestamp > deadline) revert DeadlinePassed(deadline);

        m.status = Status.ACTIVE_UNREVEALED;
        m.joinedAtSec = uint64(block.timestamp);
        if (m.potBase != 0) {
            collateral.safeTransferFrom(msg.sender, address(this), m.potBase);
            escrowed += m.potBase;
        }
        emit MatchJoined(matchId, msg.sender, m.potBase, m.joinedAtSec + params.revealWindowSec);
    }

    /// @notice Opens the deck. Permissionless: whoever holds the preimage may publish it, because the
    ///         commitment — not a key — is what proves the deck was fixed before either player saw it.
    /// @dev The preimage is `masayume/core/games`'s `deckCommitmentPreimage`, word for word:
    ///      chainId, arena, matchId, policyVersion, serverSeed, |clientSeeds|, clientSeeds, |cards|, cards —
    ///      shared with the TypeScript half through `ArenaCommitment`, whose golden vector is in
    ///      `ArenaVectors.t.sol` and `packages/core/src/games/commitment.test.ts`.
    function revealDeck(bytes32 matchId, bytes32 serverSeed, bytes32[] memory clientSeeds, bytes32[] memory cards) external nonReentrant {
        Match storage m = _get(matchId);
        if (m.status != Status.ACTIVE_UNREVEALED) revert WrongStatus(matchId, m.status);
        uint64 deadline = m.joinedAtSec + params.revealWindowSec;
        if (block.timestamp > deadline) revert DeadlinePassed(deadline);
        if (cards.length != m.deckSize) revert BadDeckSize(uint8(cards.length));

        bytes32 got = ArenaCommitment.hash(block.chainid, address(this), matchId, m.policyVersion, serverSeed, clientSeeds, cards);
        if (got != m.deckHash) revert DeckMismatch(m.deckHash, got);

        // Every card must be a live Window of the pinned venue with room left to play, checked before a
        // deadline starts running against players who cannot pick.
        uint32 life = params.minCardLifeSec;
        for (uint256 i = 0; i < cards.length; i++) {
            MarketRef memory ref = _resolve(cards[i]);
            if (ref.expiry < block.timestamp + life) revert TooLate(cards[i], ref.expiry);
            // The same Window twice is not a deck: both cards would settle on one print, so a player who
            // read it right once is paid twice for one call and the match stops measuring skill.
            for (uint256 k = 0; k < i; k++) {
                if (cards[k] == cards[i]) revert DuplicateCard(cards[i]);
            }
            _cards[matchId].push(cards[i]);
        }

        m.status = Status.PICKING;
        m.revealedAtSec = uint64(block.timestamp);
        m.pickDeadlineSec = uint64(block.timestamp) + params.pickWindowSec;
        emit DeckRevealed(matchId, m.policyVersion, cards, m.pickDeadlineSec);
    }

    // ------------------------------------------------------------------ the picks

    /// @notice One card, one side, one IOC. `stake` is the most this card may spend; the arena walks the
    ///         live book for what it buys, places the order and sends the unspent part straight back.
    /// @dev Zero fill reverts, so a card is never recorded as played without a position behind it. A
    ///      partial fill above `minQuantityRaw` succeeds and records what actually filled.
    function placePick(bytes32 matchId, uint8 cardIndex, uint8 outcomeIdx, uint256 stake, uint256 minQuantityRaw)
        external
        nonReentrant
        returns (uint256 quantity, uint256 cost)
    {
        if (paused) revert IsPaused();
        Match storage m = _get(matchId);
        if (m.status != Status.PICKING) revert WrongStatus(matchId, m.status);
        if (block.timestamp > m.pickDeadlineSec) revert DeadlinePassed(m.pickDeadlineSec);
        uint8 seat = _seatOf(m, msg.sender);
        if (cardIndex >= m.deckSize) revert BadCard(cardIndex);
        if (stake == 0) revert ZeroAmount();
        if (stake > m.perCardCapBase) revert StakeAboveCap(stake, m.perCardCapBase);
        PickRecord storage rec = _picks[matchId][_slot(cardIndex, seat)];
        if (rec.placed) revert AlreadyPicked(matchId, cardIndex, msg.sender);

        bytes32 marketId = _cards[matchId][cardIndex];
        MarketRef memory ref = _resolve(marketId);
        Quote memory q = _sizeEntry(ref, marketId, outcomeIdx, stake);
        if (q.quantityRaw < minQuantityRaw) revert BelowMinQuantity(q.quantityRaw, minQuantityRaw);

        collateral.safeTransferFrom(msg.sender, address(this), stake);
        (cost, quantity) = _buyIoc(ref, outcomeIdx, q.limitYesRaw, q.quantityRaw);
        _collect(ref.pool);
        if (quantity == 0 || quantity < minQuantityRaw) revert BelowMinQuantity(quantity, minQuantityRaw);
        // A fill can only cost the walk's limit or less; a venue fee on top would land here and is
        // refused, because paying it would spend another match's pot.
        if (cost > stake) revert CostAboveStake(cost, stake);

        rec.placed = true;
        rec.outcomeIdx = outcomeIdx;
        rec.quantity = _u128(quantity);
        rec.costBase = _u128(cost);
        uint8 bit = uint8(1 << cardIndex);
        if (seat == 0) m.pickedMask0 |= bit;
        else m.pickedMask1 |= bit;

        uint256 refund = stake - cost;
        if (refund != 0) collateral.safeTransfer(msg.sender, refund);
        emit PickFilled(matchId, msg.sender, marketId, cardIndex, outcomeIdx, quantity, cost, refund);

        // The last pick locks the match itself, so a complete deck never waits on a crank.
        uint8 full = _fullMask(m.deckSize);
        if (m.pickedMask0 == full && m.pickedMask1 == full) {
            m.status = Status.SETTLING;
            emit PicksLocked(matchId, Status.SETTLING, address(0));
        }
    }

    /// @notice Closes the pick window. Permissionless once the deadline has passed.
    /// @dev One absent player forfeits the pot alone; both absent is nobody's win, so both pots go home.
    ///      Neither branch touches the cards already on the book — those settle either way.
    function lockPicks(bytes32 matchId) external nonReentrant {
        Match storage m = _get(matchId);
        if (m.status != Status.PICKING) revert WrongStatus(matchId, m.status);
        if (block.timestamp <= m.pickDeadlineSec) revert DeadlineNotPassed(m.pickDeadlineSec);
        uint8 full = _fullMask(m.deckSize);
        bool creatorDone = m.pickedMask0 == full;
        bool challengerDone = m.pickedMask1 == full;

        if (creatorDone && challengerDone) {
            m.status = Status.SETTLING;
            emit PicksLocked(matchId, Status.SETTLING, address(0));
        } else if (creatorDone || challengerDone) {
            m.status = Status.FORFEITED;
            emit PicksLocked(matchId, Status.FORFEITED, creatorDone ? m.challenger : m.creator);
        } else {
            _refundBoth(matchId, m, RefundReason.BOTH_INCOMPLETE);
        }
    }

    // ------------------------------------------------------------------ settlement

    /// @notice Redeems both seats' picks on one card through the module and credits what the venue paid.
    ///         Permissionless, and idempotent by card: a second call reverts rather than double-crediting.
    function settleCard(bytes32 matchId, uint8 cardIndex) external nonReentrant {
        Match storage m = _get(matchId);
        if (m.status == Status.WAITING || m.status == Status.ACTIVE_UNREVEALED) revert WrongStatus(matchId, m.status);
        if (cardIndex >= m.deckSize) revert BadCard(cardIndex);
        uint8 bit = uint8(1 << cardIndex);
        if (m.settledMask & bit != 0) revert AlreadySettled(matchId, cardIndex);

        bytes32 marketId = _cards[matchId][cardIndex];
        MarketRef memory ref = _resolve(marketId);
        if (!_isSettled(ref)) revert MarketNotSettled(marketId);

        m.settledMask |= bit;
        for (uint8 seat = 0; seat < 2; seat++) {
            PickRecord storage rec = _picks[matchId][_slot(cardIndex, seat)];
            if (!rec.placed || rec.settled) continue;
            uint256 payout = _redeem(ref, marketId, rec.outcomeIdx, rec.quantity);
            rec.settled = true;
            rec.payoutBase = _u128(payout);
            int256 pnl = int256(payout) - int256(uint256(rec.costBase));
            _pnl[matchId][seat] += pnl;
            address player = seat == 0 ? m.creator : m.challenger;
            if (payout != 0) {
                creditOf[player] += payout;
                credited += payout;
            }
            emit CardSettled(matchId, player, marketId, cardIndex, payout, pnl);
        }
        _collect(ref.pool);
    }

    /// @notice Awards the pot once every played card is settled. Permissionless.
    /// @dev Only the side-pot is allocated here; the market payouts were credited card by card. A tie
    ///      splits, and an odd unit of dust goes to the creator so the split is deterministic.
    function finalize(bytes32 matchId) external nonReentrant {
        Match storage m = _get(matchId);
        if (m.status != Status.SETTLING && m.status != Status.FORFEITED) revert WrongStatus(matchId, m.status);
        uint8 played = m.pickedMask0 | m.pickedMask1;
        if (played & ~m.settledMask != 0) revert CardsOutstanding(matchId);

        int256 creatorPnl = _pnl[matchId][0];
        int256 challengerPnl = _pnl[matchId][1];
        address winner;
        if (m.status == Status.FORFEITED) {
            winner = m.pickedMask0 == _fullMask(m.deckSize) ? m.creator : m.challenger;
        } else if (creatorPnl != challengerPnl) {
            winner = creatorPnl > challengerPnl ? m.creator : m.challenger;
        }

        m.status = Status.FINALIZED;
        uint256 pot = uint256(m.potBase) * 2;
        if (pot != 0) {
            escrowed -= pot;
            credited += pot;
            if (winner != address(0)) {
                creditOf[winner] += pot;
            } else {
                uint256 half = pot / 2;
                creditOf[m.challenger] += half;
                creditOf[m.creator] += pot - half;
            }
        }
        emit MatchFinalized(matchId, winner, creatorPnl, challengerPnl, pot);
    }

    // ------------------------------------------------------------------ the ways out

    /// @notice The creator withdraws a match nobody has joined.
    function cancelMatch(bytes32 matchId) external nonReentrant {
        Match storage m = _get(matchId);
        if (m.status != Status.WAITING) revert WrongStatus(matchId, m.status);
        if (msg.sender != m.creator) revert NotAPlayer(msg.sender);
        _refundCreator(matchId, m, RefundReason.CREATOR_CANCELLED);
    }

    /// @notice Anyone may return an unjoined pot once the join window has closed.
    function refundUnjoined(bytes32 matchId) external nonReentrant {
        Match storage m = _get(matchId);
        if (m.status != Status.WAITING) revert WrongStatus(matchId, m.status);
        uint64 deadline = m.createdAtSec + params.joinWindowSec;
        if (block.timestamp <= deadline) revert DeadlineNotPassed(deadline);
        _refundCreator(matchId, m, RefundReason.JOIN_TIMEOUT);
    }

    /// @notice Anyone may return both pots when the deck was never opened. Losing the reveal material is
    ///         an operator failure, so it refunds rather than punishing a player.
    function refundUnrevealed(bytes32 matchId) external nonReentrant {
        Match storage m = _get(matchId);
        if (m.status != Status.ACTIVE_UNREVEALED) revert WrongStatus(matchId, m.status);
        uint64 deadline = m.joinedAtSec + params.revealWindowSec;
        if (block.timestamp <= deadline) revert DeadlineNotPassed(deadline);
        _refundBoth(matchId, m, RefundReason.REVEAL_UNAVAILABLE);
    }

    /// @notice Takes a player's credits — pot and payouts alike. Pays the player, never the caller, so a
    ///         relayer or a friend can crank it without becoming the beneficiary.
    function claimCredit(address player) external nonReentrant returns (uint256 amount) {
        amount = creditOf[player];
        if (amount == 0) revert NoCredit(player);
        creditOf[player] = 0;
        credited -= amount;
        collateral.safeTransfer(player, amount);
        emit CreditClaimed(player, amount, msg.sender);
    }

    // ------------------------------------------------------------------ views

    function matchOf(bytes32 matchId) external view returns (Match memory) {
        return _matches[matchId];
    }

    function deckOf(bytes32 matchId) external view returns (bytes32[] memory) {
        return _cards[matchId];
    }

    function pickOf(bytes32 matchId, uint8 cardIndex, uint8 seat) external view returns (PickRecord memory) {
        return _picks[matchId][_slot(cardIndex, seat)];
    }

    /// @dev `payout - cost` summed over settled cards, per seat. Negative until a card pays.
    function pnlOf(bytes32 matchId) external view returns (int256 creatorPnl, int256 challengerPnl) {
        return (_pnl[matchId][0], _pnl[matchId][1]);
    }

    // ------------------------------------------------------------------ internals

    function _get(bytes32 matchId) private view returns (Match storage m) {
        m = _matches[matchId];
        if (m.creator == address(0)) revert NoSuchMatch(matchId);
    }

    function _seatOf(Match storage m, address who) private view returns (uint8) {
        if (who == m.creator) return 0;
        if (who == m.challenger) return 1;
        revert NotAPlayer(who);
    }

    function _slot(uint8 cardIndex, uint8 seat) private pure returns (uint16) {
        return uint16(cardIndex) * 2 + seat;
    }

    function _fullMask(uint8 deckSize) private pure returns (uint8) {
        return uint8((uint16(1) << deckSize) - 1);
    }

    function _refundCreator(bytes32 matchId, Match storage m, RefundReason reason) private {
        uint256 per = m.potBase;
        m.status = Status.REFUNDED;
        if (per != 0) {
            escrowed -= per;
            credited += per;
            creditOf[m.creator] += per;
        }
        emit MatchRefunded(matchId, reason, per);
    }

    function _refundBoth(bytes32 matchId, Match storage m, RefundReason reason) private {
        uint256 per = m.potBase;
        m.status = Status.REFUNDED;
        if (per != 0) {
            escrowed -= per * 2;
            credited += per * 2;
            creditOf[m.creator] += per;
            creditOf[m.challenger] += per;
        }
        emit MatchRefunded(matchId, reason, per);
    }
}
