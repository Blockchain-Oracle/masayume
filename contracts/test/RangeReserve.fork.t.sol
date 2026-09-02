// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console2} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool} from "../src/interfaces/IDreamDex.sol";
import {IOracleHub} from "../src/interfaces/IOracleHub.sol";
import {IRangeReserve} from "../src/range/IRangeReserve.sol";
import {RangeReserve} from "../src/range/RangeReserve.sol";
import {DeployRangeReserve} from "../script/DeployRangeReserve.s.sol";

interface ITestUsdc {
    function faucet(uint256 amount) external;
}

/// @notice The reserve against Shannon's real contracts on a fork: the asset proven and the opening print
///         read through the hub, the centre off the Window's own book, a band opened and escrowed, then —
///         because the oracle does not answer on a fork — the stale void refunding after the grace. Runs
///         only with `SHANNON_FORK_URL` set; skipped otherwise. `FORK_MARKET_ID` pins a Trading Window
///         (decimal) and `FORK_ASSET` its asset (default BTC). A Window whose book is thinner than the
///         centre depth gets a maker's two resting bids (YES 0.48, NO 0.48) from the house first, through
///         the venue's own `placeBinaryOrder` — the venue's makers were offline on 2026-09-02 (context/43).
contract RangeReserveForkTest is Test {
    address internal constant COLLATERAL = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    address internal constant MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    address internal constant HUB = 0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b;
    uint256 internal constant ONE = 1e6;
    uint256 internal constant PAYOUT = 20 * ONE;
    uint8 internal constant BUY_YES = 0;
    uint8 internal constant BUY_NO = 2;
    uint8 internal constant NORMAL_ORDER = 0;

    bool internal forked;
    RangeReserve internal reserve;
    address internal house = makeAddr("house");
    address internal opener = makeAddr("opener");

    function setUp() public {
        string memory url = vm.envOr("SHANNON_FORK_URL", string(""));
        if (bytes(url).length == 0) return;
        vm.createSelectFork(url);
        forked = true;
        DeployRangeReserve deploy = new DeployRangeReserve();
        reserve = new RangeReserve(IERC20(COLLATERAL), IBinaryModule(MODULE), IOracleHub(HUB), deploy.VENUE_ID_(), deploy.launchParams());
        (string[2] memory assets, uint64[2] memory sigma) = deploy.launchVolatility();
        reserve.setVolatility(assets[0], sigma[0]);
        reserve.setVolatility(assets[1], sigma[1]);
        vm.deal(house, 1 ether);
        vm.deal(opener, 1 ether);
        vm.startPrank(house);
        ITestUsdc(COLLATERAL).faucet(10_000 * ONE);
        IERC20(COLLATERAL).approve(address(reserve), type(uint256).max);
        reserve.supply(5_000 * ONE);
        vm.stopPrank();
        vm.startPrank(opener);
        ITestUsdc(COLLATERAL).faucet(1_000 * ONE);
        IERC20(COLLATERAL).approve(address(reserve), type(uint256).max);
        vm.stopPrank();
    }

    function test_fork_aBandOpensOnTheHubsBasisAndAStaleVoidRefunds() public {
        if (!forked) return;
        uint256 pinned = vm.envOr("FORK_MARKET_ID", uint256(0));
        require(pinned != 0, "set FORK_MARKET_ID to a Trading Window of the hub venue (decimal)");
        string memory asset = vm.envOr("FORK_ASSET", string("BTC"));
        bytes32 id = bytes32(pinned);
        (uint256 questionId,,,,,,,, address market, address pool,,,, uint64 expiry) = IBinaryModule(MODULE).markets(id);
        require(IBinaryMarket(market).status() == 1, "pinned Window is not Trading at the fork block");
        console2.log("Window", pinned);
        console2.log("question", questionId);
        console2.log("seconds to expiry", expiry - block.timestamp);
        _seedThinBook(pool, expiry);

        (int256 openingPrint, uint256 centerQE6, uint64 sigmaE8) = reserve.previewBasis(id, asset);
        console2.log("opening print (cents)", openingPrint);
        console2.log("book centre P(up) x1e6", centerQE6);
        console2.log("sigma x1e8", sigmaE8);
        assertGt(openingPrint, 0);

        // A band of +/- 0.05% around the opening print, inside.
        int256 half = openingPrint / 2_000;
        (uint256 stake, uint256 probRaw,, IRangeReserve.Basis memory basis) = reserve.previewOpen(id, asset, IRangeReserve.Side.INSIDE, openingPrint - half, openingPrint + half, PAYOUT);
        console2.log("P(inside) x1e6", probRaw);
        console2.log("stake for a 20 payout", stake);
        assertEq(basis.centerQE6, centerQE6);
        assertLt(stake, PAYOUT);

        uint256 before = IERC20(COLLATERAL).balanceOf(opener);
        vm.record();
        vm.prank(opener);
        (uint256 roundId, uint256 charged) = reserve.openRange(id, asset, IRangeReserve.Side.INSIDE, openingPrint - half, openingPrint + half, PAYOUT, stake);
        (, bytes32[] memory writes) = vm.accesses(address(reserve));
        for (uint256 i = 0; i < writes.length; i++) {
            assertTrue(vm.load(address(reserve), writes[i]) != bytes32(uint256(uint160(market))), "market address persisted in reserve storage");
        }
        assertEq(charged, stake, "the open charges exactly the preview");
        assertEq(IERC20(COLLATERAL).balanceOf(opener), before - stake);
        assertEq(reserve.locked(), PAYOUT - stake);
        assertEq(reserve.roundOf(roundId).oracleQuestionId, questionId, "settles on the module's own question");
        assertEq(reserve.assetKeyOf(id), keccak256(bytes(asset)), "the asset proof is cached");

        vm.expectRevert(abi.encodeWithSelector(IRangeReserve.NotSettled.selector, roundId));
        reserve.settle(roundId);

        // No oracle answers on a fork: after the grace, anyone voids and the stake goes home.
        vm.warp(expiry + 6 hours);
        reserve.voidStale(roundId);
        assertEq(uint8(reserve.roundOf(roundId).status), uint8(IRangeReserve.RoundStatus.VOID));
        assertEq(IERC20(COLLATERAL).balanceOf(opener), before, "refunded to the cent");
        assertEq(reserve.locked(), 0);
        assertEq(reserve.liquid(), 5_000 * ONE);
    }

    /// @dev Rests a YES bid at 0.48 and a YES ask at 0.52 (a BUY_NO at YES price 0.52) for 50 contracts each when
    ///      either side is thinner than the reserve's centre depth, exactly as a maker would through the venue.
    function _seedThinBook(address pool, uint64 expiry) internal {
        uint256 depth = 20 * ONE;
        (, uint256 askFilled) = _depth(pool, false, depth);
        (, uint256 bidFilled) = _depth(pool, true, depth);
        if (askFilled >= depth && bidFilled >= depth) return;
        console2.log("book thinner than the centre depth - seeding as a maker");
        uint64 expireNs = uint64(uint256(expiry - 1) * 1e9);
        vm.startPrank(house);
        IERC20(COLLATERAL).approve(pool, type(uint256).max);
        IBinaryPool(pool).placeBinaryOrder(BUY_YES, 480_000, 50 * ONE, expireNs, NORMAL_ORDER, 0, address(0), 0, 0);
        IBinaryPool(pool).placeBinaryOrder(BUY_NO, 520_000, 50 * ONE, expireNs, NORMAL_ORDER, 0, address(0), 0, 0);
        vm.stopPrank();
    }

    function _depth(address pool, bool isBid, uint256 wanted) internal view returns (uint256 levels, uint256 filled) {
        IBinaryPool.Level[] memory book = IBinaryPool(pool).getBookLevels(isBid, 32);
        for (uint256 i = 0; i < book.length && filled < wanted; i++) {
            filled += book[i].quantity;
        }
        return (book.length, filled);
    }
}
