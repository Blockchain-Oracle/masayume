// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule} from "../src/interfaces/IDreamDex.sol";
import {IOracleHub} from "../src/interfaces/IOracleHub.sol";
import {IRangeReserve} from "../src/range/IRangeReserve.sol";
import {RangeReserve} from "../src/range/RangeReserve.sol";
import {WindowQuestion} from "../src/range/WindowQuestion.sol";
import {MockCollateral} from "./mocks/MockVenue.sol";
import {MockOracleHub} from "./mocks/MockOracleHub.sol";
import {MockWindow, MockWindows} from "./mocks/MockWindows.sol";

abstract contract RangeTestBase is Test {
    uint256 internal constant ONE = 1e6;
    uint256 internal constant SUPPLY = 1_000 * ONE;
    uint64 internal constant NOW = 1_788_400_000;
    /// @dev 76,735.23 — the print Window 70535 settled at live (context/43).
    int256 internal constant P0 = 7_673_523;
    uint64 internal constant START = NOW - 60;
    uint64 internal constant EXPIRY = NOW + 240;
    uint256 internal constant Q_CLOSE = 500;
    uint256 internal constant Q_OPEN = 499;
    string internal constant BTC = "BTC";

    MockCollateral internal coll;
    MockWindows internal venue;
    MockOracleHub internal hub;
    RangeReserve internal reserve;

    address internal house = makeAddr("house");
    address internal opener = makeAddr("opener");
    address internal stranger = makeAddr("stranger");

    bytes32 internal marketA;
    MockWindow internal windowA;

    function setUp() public virtual {
        vm.warp(NOW);
        coll = new MockCollateral();
        venue = new MockWindows(coll);
        hub = new MockOracleHub();
        venue.setOracleAdapter(address(hub));
        reserve = new RangeReserve(IERC20(address(coll)), IBinaryModule(address(venue)), IOracleHub(address(hub)), bytes32("venue"), defaultParams());
        reserve.setVolatility(BTC, 6_200);
        reserve.setVolatility("ETH", 7_800);

        // A 5-minute BTC Window one minute in: its closing question is registered on the hub, the question
        // that closed at its open has answered P0, and the book puts the market at even odds.
        (marketA, windowA) = venue.addWindowAt(START, EXPIRY, Q_CLOSE);
        hub.register(WindowQuestion.build(BTC, EXPIRY), Q_CLOSE);
        hub.register(WindowQuestion.build(BTC, START), Q_OPEN);
        hub.setAnswer(Q_OPEN, P0, false);
        setBook(windowA, 520_000, 540_000, 480_000, 460_000);

        coll.mint(house, 100_000 * ONE);
        coll.mint(opener, 10_000 * ONE);
        vm.prank(house);
        coll.approve(address(reserve), type(uint256).max);
        vm.prank(opener);
        coll.approve(address(reserve), type(uint256).max);
        vm.prank(house);
        reserve.supply(SUPPLY);
    }

    function defaultParams() internal pure returns (IRangeReserve.Params memory) {
        return IRangeReserve.Params({
            marginBps: 1_200,
            maxExposureBps: 5_000,
            maxSpreadRaw: 200_000,
            centerDepthRaw: 20 * ONE,
            minCenterQE6: 30_000,
            maxCenterQE6: 970_000,
            minProbRaw: 20_000,
            maxProbRaw: 970_000,
            minTimeLeftSec: 60,
            maxHorizonSec: 2 days,
            staleAfterSec: 6 hours,
            maxPayoutCap: 500 * ONE,
            maxExpiryLocked: 400 * ONE
        });
    }

    /// @dev Two levels a side, 300 contracts each.
    function setBook(MockWindow w, uint256 ask0, uint256 ask1, uint256 bid0, uint256 bid1) internal {
        uint256[] memory askP = new uint256[](2);
        uint256[] memory askQ = new uint256[](2);
        uint256[] memory bidP = new uint256[](2);
        uint256[] memory bidQ = new uint256[](2);
        askP[0] = ask0;
        askP[1] = ask1;
        bidP[0] = bid0;
        bidP[1] = bid1;
        askQ[0] = 300 * ONE;
        askQ[1] = 300 * ONE;
        bidQ[0] = 300 * ONE;
        bidQ[1] = 300 * ONE;
        w.setBook(askP, askQ, bidP, bidQ);
    }

    /// @dev A band of ± `usd` dollars around the opening print, in cents.
    function band(int256 usd) internal pure returns (int256 low, int256 high) {
        return (P0 - usd * 100, P0 + usd * 100);
    }

    function openAs(address who, IRangeReserve.Side side, int256 low, int256 high, uint256 maxPayout) internal returns (uint256 id, uint256 stake) {
        vm.prank(who);
        (id, stake) = reserve.openRange(marketA, BTC, side, low, high, maxPayout, type(uint256).max);
    }

    /// @dev `balanceOf(reserve) == liquid + Σ escrow` over LIVE and WON rounds — the one accounting identity.
    function assertBooksBalance() internal view {
        uint256 escrow;
        uint256 n = reserve.roundCount();
        for (uint256 id = 1; id <= n; id++) {
            IRangeReserve.Round memory r = reserve.roundOf(id);
            if (r.status == IRangeReserve.RoundStatus.LIVE || r.status == IRangeReserve.RoundStatus.WON) escrow += r.stake + r.houseLocked;
        }
        assertEq(coll.balanceOf(address(reserve)), reserve.liquid() + escrow, "reserve balance == liquid + live escrow");
    }
}
