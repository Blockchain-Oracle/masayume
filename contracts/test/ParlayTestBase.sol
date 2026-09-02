// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule} from "../src/interfaces/IDreamDex.sol";
import {IParlayReserve} from "../src/parlay/IParlayReserve.sol";
import {ParlayReserve} from "../src/parlay/ParlayReserve.sol";
import {MockCollateral} from "./mocks/MockVenue.sol";
import {MockWindow, MockWindows} from "./mocks/MockWindows.sol";

abstract contract ParlayTestBase is Test {
    uint256 internal constant ONE = 1e6;
    uint256 internal constant SUPPLY = 1_000 * ONE;
    uint64 internal constant NOW = 1_788_400_000;

    MockCollateral internal coll;
    MockWindows internal venue;
    ParlayReserve internal reserve;

    address internal house = makeAddr("house");
    address internal opener = makeAddr("opener");
    address internal stranger = makeAddr("stranger");

    bytes32 internal marketA;
    bytes32 internal marketB;
    bytes32 internal marketC;
    MockWindow internal windowA;
    MockWindow internal windowB;
    MockWindow internal windowC;

    function setUp() public virtual {
        vm.warp(NOW);
        coll = new MockCollateral();
        venue = new MockWindows(coll);
        reserve = new ParlayReserve(IERC20(address(coll)), IBinaryModule(address(venue)), defaultParams());

        // Two Windows five minutes apart, a third sharing B's settlement instant.
        (marketA, windowA) = venue.addWindow(NOW + 300);
        (marketB, windowB) = venue.addWindow(NOW + 600);
        (marketC, windowC) = venue.addWindow(NOW + 600);
        // YES asks at 0.60 (300 contracts) then 0.62; YES bids at 0.58 (300) then 0.55 — so UP costs 0.60 and DOWN 0.42 at the top.
        setBook(windowA, 600_000, 620_000, 580_000, 550_000);
        setBook(windowB, 600_000, 620_000, 580_000, 550_000);
        setBook(windowC, 600_000, 620_000, 580_000, 550_000);

        coll.mint(house, 100_000 * ONE);
        coll.mint(opener, 10_000 * ONE);
        vm.prank(house);
        coll.approve(address(reserve), type(uint256).max);
        vm.prank(opener);
        coll.approve(address(reserve), type(uint256).max);
        vm.prank(house);
        reserve.supply(SUPPLY);
    }

    function defaultParams() internal pure returns (IParlayReserve.Params memory) {
        return IParlayReserve.Params({
            marginBps: 1_200,
            maxExposureBps: 5_000,
            correlationBps: 4_000,
            maxLegs: 3,
            maxPayoutCap: 500 * ONE,
            maxExpiryLocked: 400 * ONE,
            minCombinedProbRaw: 20_000, // 2%
            priceDepthRaw: 20 * ONE
        });
    }

    /// @dev Two levels a side, 300 contracts each: a payout past 300 walks into the second level.
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

    function legs2(bytes32 a, uint8 sideA, bytes32 b, uint8 sideB) internal pure returns (IParlayReserve.LegInput[] memory legs) {
        legs = new IParlayReserve.LegInput[](2);
        legs[0] = IParlayReserve.LegInput(a, sideA);
        legs[1] = IParlayReserve.LegInput(b, sideB);
    }

    function legs3(bytes32 a, bytes32 b, bytes32 c) internal pure returns (IParlayReserve.LegInput[] memory legs) {
        legs = new IParlayReserve.LegInput[](3);
        legs[0] = IParlayReserve.LegInput(a, 0);
        legs[1] = IParlayReserve.LegInput(b, 0);
        legs[2] = IParlayReserve.LegInput(c, 0);
    }

    function openAs(address who, IParlayReserve.LegInput[] memory legs, uint256 maxPayout) internal returns (uint256 id, uint256 stake) {
        vm.prank(who);
        (id, stake) = reserve.openParlay(legs, maxPayout, type(uint256).max);
    }

    /// @dev `balanceOf(reserve) == liquid + Σ escrow` over LIVE and WON tickets — the one accounting identity.
    function assertBooksBalance() internal view {
        uint256 escrow;
        uint256 n = reserve.parlayCount();
        for (uint256 id = 1; id <= n; id++) {
            IParlayReserve.Parlay memory p = reserve.parlayOf(id);
            if (p.status == IParlayReserve.ParlayStatus.LIVE || p.status == IParlayReserve.ParlayStatus.WON) escrow += p.stake + p.houseLocked;
        }
        assertEq(coll.balanceOf(address(reserve)), reserve.liquid() + escrow, "reserve balance == liquid + live escrow");
    }

    /// @dev Asserts that nothing the call wrote to the reserve's storage equals a Window's address (AD-10).
    function assertNoVenueAddressInStorage(bytes32[] memory writes) internal view {
        bytes32[3] memory needles = [
            bytes32(uint256(uint160(address(windowA)))),
            bytes32(uint256(uint160(address(windowB)))),
            bytes32(uint256(uint160(address(windowC))))
        ];
        for (uint256 i = 0; i < writes.length; i++) {
            bytes32 value = vm.load(address(reserve), writes[i]);
            for (uint256 k = 0; k < 3; k++) {
                assertTrue(value != needles[k], "venue address persisted in reserve storage");
            }
        }
    }
}
