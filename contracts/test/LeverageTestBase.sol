// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {ILeverageReserve} from "../src/leverage/ILeverageReserve.sol";
import {LeverageReserve} from "../src/leverage/LeverageReserve.sol";
import {MockCollateral} from "./mocks/MockVenue.sol";
import {MockLeveragePool, MockLeverageVenue} from "./mocks/MockLeverageVenue.sol";

abstract contract LeverageTestBase is Test {
    uint256 internal constant ONE = 1e6;
    uint256 internal constant SUPPLY = 1_000 * ONE;
    uint256 internal constant STAKE = 10 * ONE;
    uint32 internal constant TWO_X = 20_000;
    uint32 internal constant THREE_X = 30_000;
    uint64 internal constant NOW = 1_788_400_000;
    uint64 internal constant EXPIRY = NOW + 300;

    MockCollateral internal coll;
    MockLeverageVenue internal venue;
    LeverageReserve internal reserve;

    address internal house = makeAddr("house");
    address internal opener = makeAddr("opener");
    address internal stranger = makeAddr("stranger");

    bytes32 internal marketA;
    MockLeveragePool internal poolA;

    function setUp() public virtual {
        vm.warp(NOW);
        coll = new MockCollateral();
        venue = new MockLeverageVenue(coll);
        reserve = new LeverageReserve(IERC20(address(coll)), IBinaryModule(address(venue)), IOutcomeToken6909(address(venue)), defaultParams());
        (marketA, poolA) = venue.addWindow(EXPIRY);
        // YES asks at 0.60 (300) then 0.62; YES bids at 0.58 (300) then 0.55 — UP costs 0.60, DOWN 0.42 at the top.
        setBook(poolA, 600_000, 620_000, 580_000, 550_000);

        coll.mint(house, 100_000 * ONE);
        coll.mint(opener, 10_000 * ONE);
        coll.mint(address(venue), 1_000_000 * ONE);
        coll.mint(address(poolA), 1_000_000 * ONE);
        vm.prank(house);
        coll.approve(address(reserve), type(uint256).max);
        vm.prank(opener);
        coll.approve(address(reserve), type(uint256).max);
        vm.prank(house);
        reserve.supply(SUPPLY);
    }

    function defaultParams() internal pure returns (ILeverageReserve.Params memory) {
        return ILeverageReserve.Params({
            maxLeverageBps: THREE_X,
            premiumBps: 800,
            maintenanceBps: 12_000,
            maxExposureBps: 5_000,
            minEntryPriceRaw: 20_000,
            maxEntryPriceRaw: 950_000,
            maxFrontedPerPosition: 200 * ONE,
            maxWindowFronted: 400 * ONE,
            maxOpenPositions: 8,
            minTimeLeftSec: 30
        });
    }

    /// @dev Two levels a side, 300 contracts each.
    function setBook(MockLeveragePool pool, uint256 ask0, uint256 ask1, uint256 bid0, uint256 bid1) internal {
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
        pool.setBook(askP, askQ, bidP, bidQ);
    }

    /// @dev One level of bids only, `qty` contracts at `price` — the exit side a knock-out meets.
    function setBids(MockLeveragePool pool, uint256 price, uint256 qty) internal {
        uint256[] memory askP = new uint256[](0);
        uint256[] memory askQ = new uint256[](0);
        uint256[] memory bidP = new uint256[](1);
        uint256[] memory bidQ = new uint256[](1);
        bidP[0] = price;
        bidQ[0] = qty;
        pool.setBook(askP, askQ, bidP, bidQ);
    }

    /// @dev The stake-first open: the size the stake affords off the live book, then the open at it.
    function openFor(address who, bytes32 marketId, uint8 outcomeIdx, uint256 stake, uint32 leverageBps) internal returns (uint256 id, uint256 charged) {
        ILeverageReserve.Preview memory q = reserve.sizeForStake(marketId, outcomeIdx, stake, leverageBps);
        vm.prank(who);
        (id, charged) = reserve.open(marketId, outcomeIdx, q.quantityRaw, leverageBps, stake);
    }

    /// @dev `balanceOf(reserve) == liquid` and `totalValue == liquid + Σ fronted` over LIVE positions — the two identities.
    function assertBooksBalance() internal view {
        assertEq(coll.balanceOf(address(reserve)), reserve.liquid(), "reserve wallet == liquid");
        uint256 fronted;
        uint256 n = reserve.positionCount();
        for (uint256 id = 1; id <= n; id++) {
            ILeverageReserve.Position memory p = reserve.positionOf(id);
            if (p.status == ILeverageReserve.PositionStatus.LIVE) fronted += p.fronted;
        }
        assertEq(reserve.outstanding(), fronted, "outstanding == sum of live fronts");
    }
}
