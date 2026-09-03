// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {ArenaCommitment} from "../src/games/ArenaCommitment.sol";
import {GameArena} from "../src/games/GameArena.sol";
import {IGameArena} from "../src/games/IGameArena.sol";
import {MockLeveragePool, MockLeverageVenue} from "./mocks/MockLeverageVenue.sol";
import {MockCollateral} from "./mocks/MockVenue.sol";

/// @dev A staged duel: two funded players, a venue of live Windows, and the arena that trades on them.
///      The leverage mock is reused deliberately — it is the only one that walks a real resting book per
///      Window and mints ERC-6909 through a shared singleton, which is exactly what a deck of cards needs.
abstract contract ArenaTestBase is Test {
    uint256 internal constant ONE = 1e6;
    uint8 internal constant DECK = 3;
    uint8 internal constant TIER_FREE = 0;
    uint8 internal constant TIER_ONE = 1;
    uint32 internal constant POLICY = 1;

    MockCollateral internal coll;
    MockLeverageVenue internal venue;
    GameArena internal arena;

    address internal creator = makeAddr("creator");
    address internal challenger = makeAddr("challenger");
    address internal stranger = makeAddr("stranger");

    bytes32 internal matchId = bytes32(uint256(0xD0E1));
    bytes32 internal serverSeed = bytes32(uint256(0x5EED));
    bytes32[] internal clientSeeds;
    bytes32[] internal cards;
    MockLeveragePool[] internal pools;

    function setUp() public virtual {
        vm.warp(1_788_400_000);
        coll = new MockCollateral();
        venue = new MockLeverageVenue(coll);
        arena = new GameArena(IERC20(address(coll)), IBinaryModule(address(venue)), IOutcomeToken6909(address(venue)), bytes32("venue"), launchParams());

        arena.setTier(TIER_FREE, IGameArena.Tier({potBase: 0, perCardCapBase: uint128(ONE), enabled: true}));
        arena.setTier(TIER_ONE, IGameArena.Tier({potBase: uint128(ONE), perCardCapBase: uint128(ONE), enabled: true}));

        clientSeeds.push(bytes32(uint256(0xC1)));
        clientSeeds.push(bytes32(uint256(0xC2)));
        for (uint256 i = 0; i < DECK; i++) {
            addCard(uint64(block.timestamp + 15 minutes));
        }

        coll.mint(creator, 1_000 * ONE);
        coll.mint(challenger, 1_000 * ONE);
        coll.mint(address(venue), 1_000_000 * ONE);
        vm.prank(creator);
        coll.approve(address(arena), type(uint256).max);
        vm.prank(challenger);
        coll.approve(address(arena), type(uint256).max);
    }

    function launchParams() internal pure returns (IGameArena.Params memory) {
        return IGameArena.Params({
            joinWindowSec: 120,
            revealWindowSec: 60,
            pickWindowSec: 180,
            minDeckSize: 3,
            maxDeckSize: 5,
            minCardLifeSec: 240
        });
    }

    /// @dev A Window with a two-sided book: YES asks at 0.60, YES bids at 0.55 — so a NO buy costs 0.45.
    function addCard(uint64 expiry) internal returns (bytes32 id, MockLeveragePool pool) {
        (id, pool) = venue.addWindow(expiry);
        setBook(pool, 600_000, 550_000, 5_000 * ONE);
        cards.push(id);
        pools.push(pool);
    }

    function setBook(MockLeveragePool pool, uint256 askPrice, uint256 bidPrice, uint256 size) internal {
        uint256[] memory askPrices = new uint256[](1);
        uint256[] memory askQuantities = new uint256[](1);
        uint256[] memory bidPrices = new uint256[](1);
        uint256[] memory bidQuantities = new uint256[](1);
        askPrices[0] = askPrice;
        askQuantities[0] = size;
        bidPrices[0] = bidPrice;
        bidQuantities[0] = size;
        pool.setBook(askPrices, askQuantities, bidPrices, bidQuantities);
    }

    function deckHash() internal view returns (bytes32) {
        return ArenaCommitment.hash(block.chainid, address(arena), matchId, POLICY, serverSeed, clientSeeds, cards);
    }

    function createAs(uint8 tier) internal {
        vm.prank(creator);
        arena.createMatch(matchId, challenger, tier, deckHash(), uint8(cards.length), POLICY);
    }

    function join() internal {
        vm.prank(challenger);
        arena.joinMatch(matchId);
    }

    function reveal() internal {
        arena.revealDeck(matchId, serverSeed, clientSeeds, cards);
    }

    /// @dev Create, join and open the deck — the state every pick test starts from.
    function stage(uint8 tier) internal {
        createAs(tier);
        join();
        reveal();
    }

    function pick(address who, uint8 cardIndex, uint8 outcomeIdx) internal returns (uint256 quantity, uint256 cost) {
        vm.prank(who);
        return arena.placePick(matchId, cardIndex, outcomeIdx, ONE, 0);
    }

    /// @dev Both seats play every card: `creatorSide` for one, the other side for the opponent.
    function pickEveryCard(uint8 creatorSide) internal {
        for (uint8 i = 0; i < uint8(cards.length); i++) {
            pick(creator, i, creatorSide);
            pick(challenger, i, creatorSide == 0 ? 1 : 0);
        }
    }

    function resolveAll(uint8 winningOutcome) internal {
        for (uint256 i = 0; i < pools.length; i++) {
            pools[i].resolve(winningOutcome);
        }
    }

    function settleAll() internal {
        for (uint8 i = 0; i < uint8(cards.length); i++) {
            arena.settleCard(matchId, i);
        }
    }

    function statusOf() internal view returns (IGameArena.Status) {
        return arena.matchOf(matchId).status;
    }

    /// @dev The arena must always hold at least the pots it has not decided plus the credits it owes.
    function assertSolvent() internal view {
        assertGe(coll.balanceOf(address(arena)), arena.escrowed() + arena.credited(), "arena cannot cover pots and credits");
    }
}
