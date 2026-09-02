// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {IPrivateDesk} from "../src/private/IPrivateDesk.sol";
import {PrivateDesk} from "../src/private/PrivateDesk.sol";
import {DeployPrivateDesk} from "../script/DeployPrivateDesk.s.sol";

interface ITestUsdc {
    function faucet(uint256 amount) external;
}

interface IPoolParams {
    function getBinaryPoolParams() external view returns (address collateralToken, address market, address outcomeToken);
}

/// @notice The desk against Shannon's real contracts on a fork: an owner's deposit and allowance, the desk's
///         three-transaction open sized off the live book, the Window voided through the venue's permissionless
///         `voidExpired`, the permissionless settle, the sweep and the credit home, the owner's own withdrawal.
///         Runs only with `SHANNON_FORK_URL` set; skipped otherwise. `FORK_MARKET_ID` pins a Trading Window
///         (decimal). With the venue's makers offline the test seeds the book itself as a maker (context/43, 44).
contract PrivateDeskForkTest is Test {
    address internal constant COLLATERAL = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    address internal constant MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    uint256 internal constant ONE = 1e6;
    uint256 internal constant STAKE = 10 * ONE;
    uint8 internal constant BUY_YES = 0;
    uint8 internal constant BUY_NO = 2;
    uint8 internal constant NORMAL_ORDER = 0;

    bool internal forked;
    PrivateDesk internal deskContract;
    address internal desk = makeAddr("desk");
    address internal owner = makeAddr("owner");
    address internal maker = makeAddr("maker");
    address internal stranger = makeAddr("stranger");
    bytes32 internal id;
    address internal market;
    address internal pool;
    uint64 internal expiry;

    function setUp() public {
        string memory url = vm.envOr("SHANNON_FORK_URL", string(""));
        if (bytes(url).length == 0) return;
        vm.createSelectFork(url);
        forked = true;
        uint256 pinned = vm.envOr("FORK_MARKET_ID", uint256(0));
        require(pinned != 0, "set FORK_MARKET_ID to a Trading Window (decimal)");
        id = bytes32(pinned);
        (,,,,,,,, market, pool,,,, expiry) = IBinaryModule(MODULE).markets(id);
        require(IBinaryMarket(market).status() == 1, "pinned Window is not Trading at the fork block");
        (,, address outcomeToken) = IPoolParams(pool).getBinaryPoolParams();

        deskContract = new PrivateDesk(IERC20(COLLATERAL), IBinaryModule(MODULE), IOutcomeToken6909(outcomeToken), desk, new DeployPrivateDesk().launchParams());
        vm.deal(owner, 1 ether);
        vm.deal(desk, 1 ether);
        vm.deal(maker, 1 ether);
        vm.deal(stranger, 1 ether);
        vm.startPrank(owner);
        ITestUsdc(COLLATERAL).faucet(1_000 * ONE);
        IERC20(COLLATERAL).approve(address(deskContract), type(uint256).max);
        vm.stopPrank();
        vm.startPrank(maker);
        ITestUsdc(COLLATERAL).faucet(5_000 * ONE);
        IERC20(COLLATERAL).approve(pool, type(uint256).max);
        vm.stopPrank();
    }

    /// @dev A maker's pair on the live book: a YES bid and a YES ask (a NO buy in the venue's terms), 60 a side.
    function _seed(uint256 bidYes, uint256 askYes) internal {
        uint64 expireNs = uint64(expiry) * 1e9;
        vm.startPrank(maker);
        IBinaryPool(pool).placeBinaryOrder(BUY_YES, bidYes, 60 * ONE, expireNs, NORMAL_ORDER, 0, address(0), 0, 0);
        IBinaryPool(pool).placeBinaryOrder(BUY_NO, askYes, 60 * ONE, expireNs, NORMAL_ORDER, 0, address(0), 0, 0);
        vm.stopPrank();
    }

    function test_fork_privateBetOffTheLiveBookThenVoidedAndHome() public {
        if (!forked) return;
        console2.log("market id", uint256(id));
        console2.log("seconds to expiry", expiry - block.timestamp);
        IBinaryPool.Level[] memory asks = IBinaryPool(pool).getBookLevels(false, 1);
        IBinaryPool.Level[] memory bids = IBinaryPool(pool).getBookLevels(true, 1);
        console2.log("live best bid / ask (0 = none)", bids.length == 0 ? 0 : bids[0].price, asks.length == 0 ? 0 : asks[0].price);
        uint256 bidYes = 480_000;
        uint256 askYes = 520_000;
        if (asks.length != 0 && asks[0].price <= askYes) askYes = asks[0].price;
        if (bids.length != 0 && bids[0].price >= bidYes) bidYes = bids[0].price;
        _seed(bidYes, askYes);

        // The owner's side: deposit and allow in one transaction.
        vm.prank(owner);
        deskContract.depositAndAllow(50 * ONE, 25 * ONE);
        (uint256 balance, uint256 allowance) = deskContract.budgetOf(owner);
        console2.log("budget: balance / allowance", balance, allowance);

        IPrivateDesk.Preview memory q = deskContract.sizeForStake(id, 0, STAKE);
        console2.log("10 on UP quoted: contracts / cost / limitYes", q.quantityRaw, q.costRaw, q.limitYesRaw);
        console2.log("price per contract", q.priceRaw);
        assertLe(q.costRaw, STAKE);

        bytes32 secret = keccak256("a signature only the owner and the desk ever see");
        bytes32 slotId = keccak256(abi.encodePacked(secret, "slot"));
        bytes32 chargeKey = keccak256(abi.encodePacked(secret, "charge"));
        bytes32 creditKey = keccak256(abi.encodePacked(secret, "credit"));

        // Three transactions from the desk, never fewer; the slot-side ones carry no owner.
        vm.prank(desk);
        deskContract.chargeToPool(owner, STAKE, chargeKey);
        vm.recordLogs();
        vm.record();
        vm.startPrank(desk);
        deskContract.fundSlot(slotId, STAKE);
        (uint256 got, uint256 cost) = deskContract.mintInSlot(slotId, id, 0, q.quantityRaw * 95 / 100);
        vm.stopPrank();
        console2.log("minted: contracts / cost", got, cost);
        _assertNoLogNamesOwner();
        (, bytes32[] memory writes) = vm.accesses(address(deskContract));
        for (uint256 i = 0; i < writes.length; i++) {
            bytes32 value = vm.load(address(deskContract), writes[i]);
            assertTrue(value != bytes32(uint256(uint160(pool))) && value != bytes32(uint256(uint160(market))), "venue address persisted (AD-10)");
            assertTrue(value != bytes32(uint256(uint160(owner))), "owner persisted on the slot side");
        }
        IPrivateDesk.Slot memory s = deskContract.slotOf(slotId);
        assertEq(s.quantityRaw, got);
        assertEq(s.balance, STAKE - cost, "the dust stays in the slot");
        assertEq(IOutcomeToken6909(deskContract.outcomeToken()).balanceOf(address(deskContract), _yesId()), got, "the desk holds the contracts");
        assertEq(IERC20(COLLATERAL).balanceOf(address(deskContract)), deskContract.totalOwed(), "wallet == owed + pool + inSlots");

        // Voided through the venue, settled by a stranger, swept and credited home, withdrawn by the owner alone.
        vm.warp(uint256(expiry) + uint256(IBinaryMarket(market).settlementWindow()) + 1);
        IBinaryMarket(market).voidExpired();
        assertTrue(IBinaryMarket(market).isVoided());
        vm.prank(stranger);
        uint256 payout = deskContract.settleSlot(slotId);
        console2.log("void payout", payout);
        vm.startPrank(desk);
        uint256 swept = deskContract.sweepSlotToPool(slotId);
        deskContract.creditFromPool(owner, swept, creditKey);
        vm.stopPrank();
        (balance,) = deskContract.budgetOf(owner);
        console2.log("credited home: swept / balance", swept, balance);
        assertEq(balance, 40 * ONE + swept);
        uint256 before = IERC20(COLLATERAL).balanceOf(owner);
        vm.prank(owner);
        deskContract.withdraw(balance);
        assertEq(IERC20(COLLATERAL).balanceOf(owner), before + balance);
        assertEq(deskContract.totalOwed(), 0);
        assertEq(IERC20(COLLATERAL).balanceOf(address(deskContract)), 0, "nothing left behind");
    }

    function _assertNoLogNamesOwner() internal {
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bytes32 asTopic = bytes32(uint256(uint160(owner)));
        for (uint256 i = 0; i < logs.length; i++) {
            for (uint256 t = 0; t < logs[i].topics.length; t++) {
                assertTrue(logs[i].topics[t] != asTopic, "owner in a topic");
            }
        }
    }

    function _yesId() internal view returns (uint256 yesId) {
        (,,,,,,,,,, yesId,,,) = IBinaryModule(MODULE).markets(id);
    }
}
