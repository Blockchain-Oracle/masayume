// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {IPrivateDesk} from "../src/private/IPrivateDesk.sol";
import {PrivateDesk} from "../src/private/PrivateDesk.sol";
import {MockCollateral} from "./mocks/MockVenue.sol";
import {MockLeveragePool, MockLeverageVenue} from "./mocks/MockLeverageVenue.sol";

abstract contract PrivateTestBase is Test {
    uint256 internal constant ONE = 1e6;
    uint256 internal constant STAKE = 10 * ONE;
    uint64 internal constant NOW = 1_788_400_000;
    uint64 internal constant EXPIRY = NOW + 300;

    MockCollateral internal coll;
    MockLeverageVenue internal venue;
    PrivateDesk internal deskContract;

    address internal desk = makeAddr("desk");
    address internal owner = makeAddr("owner");
    address internal other = makeAddr("other");
    address internal stranger = makeAddr("stranger");

    bytes32 internal marketA;
    MockLeveragePool internal poolA;

    /// @dev The three keys one bet uses, derived the way the desk service derives them: from one secret.
    struct Keys {
        bytes32 slotId;
        bytes32 chargeKey;
        bytes32 creditKey;
    }

    function setUp() public virtual {
        vm.warp(NOW);
        coll = new MockCollateral();
        venue = new MockLeverageVenue(coll);
        deskContract = new PrivateDesk(IERC20(address(coll)), IBinaryModule(address(venue)), IOutcomeToken6909(address(venue)), desk, defaultParams());
        (marketA, poolA) = venue.addWindow(EXPIRY);
        // YES asks at 0.60 (300) then 0.62; YES bids at 0.58 (300) then 0.55 — UP costs 0.60, DOWN 0.42 at the top.
        setBook(poolA, 600_000, 620_000, 580_000, 550_000);

        coll.mint(owner, 1_000 * ONE);
        coll.mint(other, 1_000 * ONE);
        coll.mint(address(venue), 1_000_000 * ONE);
        coll.mint(address(poolA), 1_000_000 * ONE);
        vm.prank(owner);
        coll.approve(address(deskContract), type(uint256).max);
        vm.prank(other);
        coll.approve(address(deskContract), type(uint256).max);
    }

    function defaultParams() internal pure returns (IPrivateDesk.Params memory) {
        return IPrivateDesk.Params({minStake: ONE, maxStake: 25 * ONE, minTimeLeftSec: 60});
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

    function keysFor(bytes32 secret) internal pure returns (Keys memory k) {
        k.slotId = keccak256(abi.encodePacked(secret, "slot"));
        k.chargeKey = keccak256(abi.encodePacked(secret, "charge"));
        k.creditKey = keccak256(abi.encodePacked(secret, "credit"));
    }

    function fund(address who, uint256 amount, uint256 allowance) internal {
        vm.prank(who);
        deskContract.depositAndAllow(amount, allowance);
    }

    /// @dev The desk's three transactions, in order, guarded at the size the quote saw.
    function openFor(address who, Keys memory k, uint256 stake, bytes32 marketId, uint8 outcomeIdx) internal returns (uint256 quantity, uint256 cost) {
        IPrivateDesk.Preview memory q = deskContract.sizeForStake(marketId, outcomeIdx, stake);
        vm.startPrank(desk);
        deskContract.chargeToPool(who, stake, k.chargeKey);
        deskContract.fundSlot(k.slotId, stake);
        (quantity, cost) = deskContract.mintInSlot(k.slotId, marketId, outcomeIdx, q.quantityRaw);
        vm.stopPrank();
    }

    /// @dev The wallet equals everything the desk owes: balances, the pool's float and every slot's cash.
    function assertBooksBalance() internal view {
        assertEq(coll.balanceOf(address(deskContract)), deskContract.totalOwed(), "wallet == owed + pool + inSlots");
    }
}
