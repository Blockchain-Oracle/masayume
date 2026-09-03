// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console2} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {ArenaCommitment} from "../src/games/ArenaCommitment.sol";
import {GameArena} from "../src/games/GameArena.sol";
import {IGameArena} from "../src/games/IGameArena.sol";
import {DeployGameArena} from "../script/DeployGameArena.s.sol";

interface ITestUsdc {
    function faucet(uint256 amount) external;
}

interface IPoolParams {
    function getBinaryPoolParams() external view returns (address collateralToken, address market, address outcomeToken);
}

/// @notice A whole ranked duel against Shannon's real contracts on a fork: a deck of live Windows, six
///         confirmed IOC picks placed by the arena as the venue's taker, redemption through DreamDEX's own
///         module, the pot awarded on measured PnL, and the gas each lane actually costs.
/// @dev Runs only with `SHANNON_FORK_URL` set; skipped otherwise. `FORK_MARKET_IDS` pins three Trading
///      Windows of one venue (decimal, comma-separated). With the venue's makers offline the test seeds
///      both sides of every book itself, exactly as the leverage and maker fork tests do (context/44,
///      context/45). Settlement is reached through the venue's own permissionless `voidExpired`, because a
///      fork cannot wait for a real oracle answer — a void pays half a unit to both sides, which is a real
///      settlement path the arena must handle and the one a fork can reach deterministically.
contract GameArenaForkTest is Test {
    address internal constant COLLATERAL = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    address internal constant MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    uint256 internal constant ONE = 1e6;
    uint8 internal constant TIER_ONE = 1;
    uint32 internal constant POLICY = 1;
    uint8 internal constant BUY_YES = 0;
    uint8 internal constant BUY_NO = 2;
    uint8 internal constant NORMAL_ORDER = 0;

    /// @dev The first ceilings this slice has to beat (`06-game-architecture.md` §Actors, keys, gas).
    uint256 internal constant CEILING_ENTRY = 8_000_000;
    uint256 internal constant CEILING_PICK = 8_000_000;
    uint256 internal constant CEILING_SETTLE = 4_000_000;

    bool internal forked;
    GameArena internal arena;
    address internal creator = makeAddr("creator");
    address internal challenger = makeAddr("challenger");
    address internal maker = makeAddr("maker");
    address internal stranger = makeAddr("stranger");

    bytes32 internal matchId = bytes32(uint256(0xD0E1));
    bytes32 internal serverSeed = bytes32(uint256(0x5EED));
    bytes32[] internal clientSeeds;
    bytes32[] internal cards;
    address[] internal markets;
    address[] internal poolsOf;
    uint64[] internal expiries;

    function setUp() public {
        string memory url = vm.envOr("SHANNON_FORK_URL", string(""));
        if (bytes(url).length == 0) return;
        vm.createSelectFork(url);
        forked = true;

        uint256[] memory pinned = vm.envOr("FORK_MARKET_IDS", ",", new uint256[](0));
        require(pinned.length >= 3, "set FORK_MARKET_IDS to at least three Trading Windows (decimal, comma-separated)");
        IGameArena.Params memory p = new DeployGameArena().launchParams();
        bytes32 venue;
        address outcomeToken;
        for (uint256 i = 0; i < 3; i++) {
            bytes32 id = bytes32(pinned[i]);
            (,,, address coll,, bytes32 venueId,,, address market, address pool,,,, uint64 expiry) = IBinaryModule(MODULE).markets(id);
            require(market != address(0), "unknown Window");
            require(coll == COLLATERAL, "Window is not on the test collateral");
            require(IBinaryMarket(market).status() == 1, "pinned Window is not Trading at the fork block");
            require(expiry > block.timestamp + p.minCardLifeSec + 60, "pinned Window is too close to expiry; pick fresher ones");
            if (i == 0) {
                venue = venueId;
                (,, outcomeToken) = IPoolParams(pool).getBinaryPoolParams();
            } else {
                require(venueId == venue, "the deck must come from one venue");
            }
            expiries.push(expiry);
            cards.push(id);
            markets.push(market);
            poolsOf.push(pool);
        }
        console2.log("venue / outcome token", uint256(venue), outcomeToken);

        arena = new GameArena(IERC20(COLLATERAL), IBinaryModule(MODULE), IOutcomeToken6909(outcomeToken), venue, p);
        arena.setTier(TIER_ONE, new DeployGameArena().launchTiers()[TIER_ONE]);
        clientSeeds.push(bytes32(uint256(0xC1)));
        clientSeeds.push(bytes32(uint256(0xC2)));

        _fund(creator);
        _fund(challenger);
        vm.deal(maker, 1 ether);
        vm.deal(stranger, 1 ether);
        vm.startPrank(maker);
        ITestUsdc(COLLATERAL).faucet(10_000 * ONE);
        for (uint256 i = 0; i < poolsOf.length; i++) {
            IERC20(COLLATERAL).approve(poolsOf[i], type(uint256).max);
        }
        vm.stopPrank();
    }

    function _fund(address who) internal {
        vm.deal(who, 1 ether);
        vm.startPrank(who);
        ITestUsdc(COLLATERAL).faucet(1_000 * ONE);
        IERC20(COLLATERAL).approve(address(arena), type(uint256).max);
        vm.stopPrank();
    }

    /// @dev A maker's pair on one live book: a YES bid and a YES ask (a NO buy in the venue's terms),
    ///      sitting inside whatever already rests so the arena's taker meets our own size.
    function _seed(uint256 i) internal {
        IBinaryPool.Level[] memory asks = IBinaryPool(poolsOf[i]).getBookLevels(false, 1);
        IBinaryPool.Level[] memory bids = IBinaryPool(poolsOf[i]).getBookLevels(true, 1);
        uint256 bidYes = 480_000;
        uint256 askYes = 520_000;
        if (asks.length != 0 && asks[0].price <= askYes) askYes = asks[0].price;
        if (bids.length != 0 && bids[0].price >= bidYes) bidYes = bids[0].price;
        uint64 expireNs = expiries[i] * 1e9;
        vm.startPrank(maker);
        IBinaryPool(poolsOf[i]).placeBinaryOrder(BUY_YES, bidYes, 60 * ONE, expireNs, NORMAL_ORDER, 0, address(0), 0, 0);
        IBinaryPool(poolsOf[i]).placeBinaryOrder(BUY_NO, askYes, 60 * ONE, expireNs, NORMAL_ORDER, 0, address(0), 0, 0);
        vm.stopPrank();
    }

    function test_fork_aWholeRankedDuelOnLiveWindows() public {
        if (!forked) return;
        for (uint256 i = 0; i < 3; i++) {
            _seed(i);
        }
        uint256 creatorStart = IERC20(COLLATERAL).balanceOf(creator);
        uint256 challengerStart = IERC20(COLLATERAL).balanceOf(challenger);

        // ---- entry
        bytes32 hash_ = ArenaCommitment.hash(block.chainid, address(arena), matchId, POLICY, serverSeed, clientSeeds, cards);
        uint256 g = gasleft();
        vm.prank(creator);
        arena.createMatch(matchId, challenger, TIER_ONE, hash_, 3, POLICY);
        uint256 gasCreate = g - gasleft();
        g = gasleft();
        vm.prank(challenger);
        arena.joinMatch(matchId);
        uint256 gasJoin = g - gasleft();
        g = gasleft();
        vm.prank(stranger);
        arena.revealDeck(matchId, serverSeed, clientSeeds, cards);
        uint256 gasReveal = g - gasleft();
        console2.log("gas create / join / reveal", gasCreate, gasJoin, gasReveal);
        assertLt(gasCreate, CEILING_ENTRY, "createMatch over its ceiling");
        assertLt(gasJoin, CEILING_ENTRY, "joinMatch over its ceiling");
        assertLt(gasReveal, CEILING_ENTRY, "revealDeck over its ceiling");

        // ---- the picks: six real IOC orders, three cards, two seats
        uint256 worstPick;
        vm.record();
        for (uint8 i = 0; i < 3; i++) {
            worstPick = _pick(creator, 0, i, 0, worstPick);
            worstPick = _pick(challenger, 1, i, 1, worstPick);
        }
        (, bytes32[] memory writes) = vm.accesses(address(arena));
        for (uint256 i = 0; i < writes.length; i++) {
            bytes32 value = vm.load(address(arena), writes[i]);
            for (uint256 k = 0; k < 3; k++) {
                assertTrue(value != bytes32(uint256(uint160(poolsOf[k]))), "pool address persisted (AD-10)");
                assertTrue(value != bytes32(uint256(uint160(markets[k]))), "market address persisted (AD-10)");
            }
        }
        console2.log("worst pick gas", worstPick);
        assertLt(worstPick, CEILING_PICK, "placePick over its ceiling");
        assertEq(uint8(arena.matchOf(matchId).status), uint8(IGameArena.Status.SETTLING), "the last pick locked the match");

        // ---- settlement through the venue's own void, then the pot
        // Past every card's own expiry and its own settlement window, so all three can be voided.
        uint256 latest;
        for (uint256 i = 0; i < 3; i++) {
            uint256 at = uint256(expiries[i]) + uint256(IBinaryMarket(markets[i]).settlementWindow()) + 1;
            if (at > latest) latest = at;
        }
        vm.warp(latest);
        uint256 worstSettle;
        for (uint8 i = 0; i < 3; i++) {
            IBinaryMarket(markets[i]).voidExpired();
            assertTrue(IBinaryMarket(markets[i]).isVoided(), "Window did not void");
            g = gasleft();
            vm.prank(stranger);
            arena.settleCard(matchId, i);
            uint256 used = g - gasleft();
            if (used > worstSettle) worstSettle = used;
        }
        g = gasleft();
        vm.prank(stranger);
        arena.finalize(matchId);
        uint256 gasFinalize = g - gasleft();
        console2.log("worst settleCard / finalize gas", worstSettle, gasFinalize);
        assertLt(worstSettle, CEILING_SETTLE, "settleCard over its ceiling");
        assertLt(gasFinalize, CEILING_SETTLE, "finalize over its ceiling");

        (int256 creatorPnl, int256 challengerPnl) = arena.pnlOf(matchId);
        console2.log("measured PnL: creator / challenger");
        console2.logInt(creatorPnl);
        console2.logInt(challengerPnl);
        assertEq(uint8(arena.matchOf(matchId).status), uint8(IGameArena.Status.FINALIZED));

        // ---- the money goes home, and the arena keeps nothing it was not given
        uint256 owedCreator = arena.creditOf(creator);
        uint256 owedChallenger = arena.creditOf(challenger);
        assertEq(owedCreator + owedChallenger, arena.credited(), "credits add up");
        assertEq(arena.escrowed(), 0, "no pot left undecided");
        if (owedCreator != 0) {
            vm.prank(stranger);
            arena.claimCredit(creator);
        }
        if (owedChallenger != 0) {
            vm.prank(stranger);
            arena.claimCredit(challenger);
        }
        assertEq(arena.credited(), 0);
        assertEq(IERC20(COLLATERAL).balanceOf(stranger), 0, "the cranker was never paid");

        // Two players put in six card stakes and two pots; what came back is what the venue paid, and the
        // arena is left holding nothing but venue dust.
        uint256 creatorEnd = IERC20(COLLATERAL).balanceOf(creator);
        uint256 challengerEnd = IERC20(COLLATERAL).balanceOf(challenger);
        console2.log("creator in / out", creatorStart, creatorEnd);
        console2.log("challenger in / out", challengerStart, challengerEnd);
        assertLe(arena.escrowed() + arena.credited(), IERC20(COLLATERAL).balanceOf(address(arena)), "arena solvent");
    }

    function _pick(address who, uint8 seat, uint8 cardIndex, uint8 outcomeIdx, uint256 worst) internal returns (uint256) {
        IGameArena.Quote memory q = arena.sizeForStake(cards[cardIndex], outcomeIdx, ONE);
        uint256 g = gasleft();
        vm.prank(who);
        (uint256 quantity, uint256 cost) = arena.placePick(matchId, cardIndex, outcomeIdx, ONE, q.quantityRaw * 90 / 100);
        uint256 used = g - gasleft();
        console2.log("pick: quantity / cost / gas", quantity, cost, used);
        assertLe(cost, ONE, "a card cannot spend past its cap");
        assertEq(arena.pickOf(matchId, cardIndex, seat).quantity, quantity, "recorded what filled");
        return used > worst ? used : worst;
    }
}
