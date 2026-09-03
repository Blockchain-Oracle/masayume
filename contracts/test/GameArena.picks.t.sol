// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ArenaTestBase} from "./ArenaTestBase.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {ArenaCommitment} from "../src/games/ArenaCommitment.sol";
import {GameArena} from "../src/games/GameArena.sol";
import {IGameArena} from "../src/games/IGameArena.sol";

/// @notice What one pick is allowed to be. The arena never promises a fill and never books a quote —
///         every figure here is a delta it measured, and every refusal happens before money moves.
contract GameArenaPicksTest is ArenaTestBase {
    function test_placePick_booksWhatMovedAndSendsTheRestBack() public {
        stage(TIER_ONE);
        uint256 before = coll.balanceOf(creator);
        (uint256 quantity, uint256 cost) = pick(creator, 0, 0);

        IGameArena.PickRecord memory rec = arena.pickOf(matchId, 0, 0);
        assertEq(rec.quantity, quantity, "recorded the measured quantity");
        assertEq(rec.costBase, cost, "recorded the measured cost");
        assertTrue(rec.placed);
        assertEq(before - coll.balanceOf(creator), cost, "the player paid exactly the fill");
        assertLt(cost, ONE, "the unspent part of the cap went home");
        assertEq(rec.outcomeIdx, 0);
        assertSolvent();
    }

    /// @dev The quote the readiness screen shows and the order the pick places are the same walk.
    function test_sizeForStake_quotesTheSizeThePickThenTakes() public {
        stage(TIER_ONE);
        IGameArena.Quote memory q = arena.sizeForStake(cards[0], 0, ONE);
        (uint256 quantity, uint256 cost) = pick(creator, 0, 0);
        assertEq(quantity, q.quantityRaw, "quantity");
        assertEq(cost, q.costRaw, "cost");
    }

    /// @dev A book too thin for the whole cap fills what it can and records that, rather than reverting:
    ///      a partial fill is a real position, and pretending otherwise would lose the player the card.
    function test_placePick_recordsAPartialFillAsTheTruth() public {
        stage(TIER_ONE);
        setBook(pools[0], 600_000, 550_000, 200_000);
        (uint256 quantity, uint256 cost) = pick(creator, 0, 0);
        assertEq(quantity, 200_000, "only what the book held");
        assertEq(cost, 120_000, "0.2 contracts at 0.60");
        assertEq(coll.balanceOf(address(arena)), 2 * ONE, "nothing but the two pots stayed behind");
    }

    function test_placePick_refusesABookThatCannotMeetTheVenuesMinimum() public {
        stage(TIER_ONE);
        setBook(pools[0], 600_000, 550_000, 50_000);
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.BelowMinQuantity.selector, 50_000, 100_000));
        arena.placePick(matchId, 0, 0, ONE, 0);
    }

    function test_placePick_refusesAMinimumTheBookCannotMeet() public {
        stage(TIER_ONE);
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.BelowMinQuantity.selector, 1_660_000, 5_000_000));
        arena.placePick(matchId, 0, 0, ONE, 5_000_000);
    }

    function test_placePick_capsOneCardAtTheTiersOwnCap() public {
        stage(TIER_ONE);
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.StakeAboveCap.selector, 2 * ONE, uint128(ONE)));
        arena.placePick(matchId, 0, 0, 2 * ONE, 0);
    }

    function test_placePick_refusesASecondPickOnTheSameCard() public {
        stage(TIER_ONE);
        pick(creator, 0, 0);
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.AlreadyPicked.selector, matchId, uint8(0), creator));
        arena.placePick(matchId, 0, 1, ONE, 0);
    }

    function test_placePick_refusesAnyoneWhoIsNotSeatedInTheMatch() public {
        stage(TIER_ONE);
        coll.mint(stranger, 10 * ONE);
        vm.startPrank(stranger);
        coll.approve(address(arena), type(uint256).max);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.NotAPlayer.selector, stranger));
        arena.placePick(matchId, 0, 0, ONE, 0);
        vm.stopPrank();
    }

    function test_placePick_refusesACardOutsideTheDeck() public {
        stage(TIER_ONE);
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.BadCard.selector, uint8(9)));
        arena.placePick(matchId, 9, 0, ONE, 0);
    }

    function test_placePick_refusesOnceTheDeadlineHasPassed() public {
        stage(TIER_ONE);
        uint64 deadline = arena.matchOf(matchId).pickDeadlineSec;
        vm.warp(deadline + 1);
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.DeadlinePassed.selector, deadline));
        arena.placePick(matchId, 0, 0, ONE, 0);
    }

    function test_placePick_refusesAWindowThatStoppedTrading() public {
        stage(TIER_ONE);
        pools[0].setStatus(2);
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.MarketNotTrading.selector, cards[0], uint8(2)));
        arena.placePick(matchId, 0, 0, ONE, 0);
    }

    /// @dev Pausing must never trap a position or a pot: it stops new risk and nothing else.
    function test_pause_stopsNewPicksAndLetsEverySettlementThrough() public {
        stage(TIER_ONE);
        pickEveryCard(0);
        arena.setPaused(true);

        vm.prank(creator);
        vm.expectRevert(IGameArena.IsPaused.selector);
        arena.createMatch(bytes32(uint256(2)), challenger, TIER_ONE, deckHash(), DECK, POLICY);

        resolveAll(0);
        settleAll();
        arena.finalize(matchId);
        vm.prank(stranger);
        arena.claimCredit(creator);
        assertGt(coll.balanceOf(creator), 0, "the paused arena still paid out");
    }

    function test_revealDeck_refusesADeckThatIsNotTheOneCommitted() public {
        createAs(TIER_ONE);
        join();
        bytes32[] memory swapped = new bytes32[](3);
        swapped[0] = cards[1];
        swapped[1] = cards[0];
        swapped[2] = cards[2];
        bytes32 got = ArenaCommitment.hash(block.chainid, address(arena), matchId, POLICY, serverSeed, clientSeeds, swapped);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.DeckMismatch.selector, deckHash(), got));
        arena.revealDeck(matchId, serverSeed, clientSeeds, swapped);
    }

    function test_revealDeck_refusesADeckOfTheWrongSize() public {
        createAs(TIER_ONE);
        join();
        bytes32[] memory two = new bytes32[](2);
        two[0] = cards[0];
        two[1] = cards[1];
        vm.expectRevert(abi.encodeWithSelector(IGameArena.BadDeckSize.selector, uint8(2)));
        arena.revealDeck(matchId, serverSeed, clientSeeds, two);
    }

    /// @dev A deck whose Windows are about to lock is a deck nobody can play, so it is refused before the
    ///      pick deadline starts running against two players who have no move.
    function test_revealDeck_refusesAWindowWithNoLifeLeft() public {
        addCard(uint64(block.timestamp + 30));
        createAs(TIER_ONE);
        join();
        vm.expectRevert(abi.encodeWithSelector(IGameArena.TooLate.selector, cards[3], uint64(block.timestamp + 30)));
        reveal();
    }

    /// @dev Two cards on one Window settle on one print, so a player who reads it right is paid twice
    ///      for a single call — the deck stops measuring anything.
    function test_revealDeck_refusesTheSameWindowTwice() public {
        bytes32 repeated = cards[1];
        cards[2] = repeated;
        createAs(TIER_ONE);
        join();
        vm.expectRevert(abi.encodeWithSelector(IGameArena.DuplicateCard.selector, repeated));
        reveal();
    }

    /// @dev Parameters that let the pick window outlast the cards would forfeit players for a deadline
    ///      the arena itself made impossible to meet.
    function test_setParams_refusesAPickWindowLongerThanTheCardsMustLive() public {
        IGameArena.Params memory bad = launchParams();
        bad.minCardLifeSec = bad.pickWindowSec;
        vm.expectRevert(IGameArena.BadParams.selector);
        arena.setParams(bad);
    }

    function test_revealDeck_refusesAWindowFromAnotherVenue() public {
        GameArena other =
            new GameArena(IERC20(address(coll)), IBinaryModule(address(venue)), IOutcomeToken6909(address(venue)), bytes32("other"), launchParams());
        other.setTier(TIER_ONE, IGameArena.Tier({potBase: uint128(ONE), perCardCapBase: uint128(ONE), enabled: true}));
        vm.startPrank(creator);
        coll.approve(address(other), type(uint256).max);
        bytes32 hashForOther = ArenaCommitment.hash(block.chainid, address(other), matchId, POLICY, serverSeed, clientSeeds, cards);
        other.createMatch(matchId, challenger, TIER_ONE, hashForOther, DECK, POLICY);
        vm.stopPrank();
        vm.startPrank(challenger);
        coll.approve(address(other), type(uint256).max);
        other.joinMatch(matchId);
        vm.stopPrank();

        // The commitment verifies — the deck really is the one that was committed to. What refuses it is
        // the venue: an arena only ever trades the one venue it was pinned to at deployment.
        vm.expectRevert(abi.encodeWithSelector(IGameArena.WrongVenue.selector, bytes32("venue")));
        other.revealDeck(matchId, serverSeed, clientSeeds, cards);
    }

    function test_createMatch_refusesADisabledTier() public {
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.UnknownTier.selector, uint8(7)));
        arena.createMatch(matchId, challenger, 7, deckHash(), DECK, POLICY);
    }

    function test_createMatch_refusesADuplicateMatchIdAndSelfPlay() public {
        createAs(TIER_ONE);
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.MatchExists.selector, matchId));
        arena.createMatch(matchId, challenger, TIER_ONE, deckHash(), DECK, POLICY);

        vm.prank(creator);
        vm.expectRevert(IGameArena.SelfJoin.selector);
        arena.createMatch(bytes32(uint256(9)), creator, TIER_ONE, deckHash(), DECK, POLICY);
    }

    function test_createMatch_refusesADeckOutsideThePolicysSize() public {
        vm.prank(creator);
        vm.expectRevert(abi.encodeWithSelector(IGameArena.BadDeckSize.selector, uint8(2)));
        arena.createMatch(matchId, challenger, TIER_ONE, deckHash(), 2, POLICY);
    }

    /// @dev AD-10: a pool address is resolved from the market id inside the call and never persisted.
    function test_noPoolAddressEverLandsInStorage() public {
        stage(TIER_ONE);
        vm.record();
        pick(creator, 0, 0);
        (, bytes32[] memory writes) = vm.accesses(address(arena));
        bytes32 pool = bytes32(uint256(uint160(address(pools[0]))));
        assertGt(writes.length, 0, "the pick wrote something");
        for (uint256 i = 0; i < writes.length; i++) {
            assertTrue(vm.load(address(arena), writes[i]) != pool, "pool address persisted in arena storage");
        }
    }
}
