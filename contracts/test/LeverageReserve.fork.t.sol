// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console2} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {ILeverageReserve} from "../src/leverage/ILeverageReserve.sol";
import {LeverageReserve} from "../src/leverage/LeverageReserve.sol";
import {DeployLeverageReserve} from "../script/DeployLeverageReserve.s.sol";

interface ITestUsdc {
    function faucet(uint256 amount) external;
}

interface IPoolParams {
    function getBinaryPoolParams() external view returns (address collateralToken, address market, address outcomeToken);
}

/// @notice The reserve against Shannon's real contracts on a fork: a stake sized off the live book, the
///         open as the venue's taker with the reserve fronting the rest, the mark off the resting bids, a
///         knock-out once a maker pulls the bids down, then a second open voided through the venue's
///         permissionless `voidExpired` and settled. Runs only with `SHANNON_FORK_URL` set; skipped
///         otherwise. `FORK_MARKET_ID` pins a Trading Window (decimal). With the venue's makers offline the
///         test seeds both sides of the book itself as a maker (context/43, context/44).
contract LeverageReserveForkTest is Test {
    address internal constant COLLATERAL = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    address internal constant MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    uint256 internal constant ONE = 1e6;
    uint256 internal constant STAKE = 10 * ONE;
    uint32 internal constant TWO_X = 20_000;
    uint8 internal constant BUY_YES = 0;
    uint8 internal constant BUY_NO = 2;
    uint8 internal constant NORMAL_ORDER = 0;

    bool internal forked;
    LeverageReserve internal reserve;
    address internal house = makeAddr("house");
    address internal opener = makeAddr("opener");
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
        console2.log("outcome token", outcomeToken);

        reserve = new LeverageReserve(IERC20(COLLATERAL), IBinaryModule(MODULE), IOutcomeToken6909(outcomeToken), new DeployLeverageReserve().launchParams());
        vm.deal(house, 1 ether);
        vm.deal(opener, 1 ether);
        vm.deal(maker, 1 ether);
        vm.deal(stranger, 1 ether);
        vm.startPrank(house);
        ITestUsdc(COLLATERAL).faucet(10_000 * ONE);
        IERC20(COLLATERAL).approve(address(reserve), type(uint256).max);
        reserve.supply(5_000 * ONE);
        vm.stopPrank();
        vm.startPrank(opener);
        ITestUsdc(COLLATERAL).faucet(1_000 * ONE);
        IERC20(COLLATERAL).approve(address(reserve), type(uint256).max);
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

    function test_fork_openOffTheLiveBookThenKnockOutThenVoid() public {
        if (!forked) return;
        console2.log("market id", uint256(id));
        console2.log("seconds to expiry", expiry - block.timestamp);
        IBinaryPool.Level[] memory asks = IBinaryPool(pool).getBookLevels(false, 1);
        IBinaryPool.Level[] memory bids = IBinaryPool(pool).getBookLevels(true, 1);
        console2.log("live best bid / ask (0 = none)", bids.length == 0 ? 0 : bids[0].price, asks.length == 0 ? 0 : asks[0].price);
        // Sit inside whatever rests so the reserve's taker order meets our own size: 0.48 / 0.52 with an empty book.
        uint256 bidYes = 480_000;
        uint256 askYes = 520_000;
        if (asks.length != 0 && asks[0].price <= askYes) askYes = asks[0].price;
        if (bids.length != 0 && bids[0].price >= bidYes) bidYes = bids[0].price;
        _seed(bidYes, askYes);

        ILeverageReserve.Preview memory q = reserve.sizeForStake(id, 0, STAKE, TWO_X);
        console2.log("2x on 10: contracts / cost / limitYes", q.quantityRaw, q.costRaw, q.limitYesRaw);
        console2.log("stake / fronted / premium", q.stake, q.fronted, q.premium);
        console2.log("win if right", q.winIfRight);
        assertLe(q.stake, STAKE);
        assertGt(q.winIfRight, q.stake, "the boost beats the plain bet when right");

        uint256 openerBefore = IERC20(COLLATERAL).balanceOf(opener);
        uint256 liquidBefore = reserve.liquid();
        vm.record();
        vm.prank(opener);
        (uint256 positionId, uint256 charged) = reserve.open(id, 0, q.quantityRaw, TWO_X, STAKE);
        (, bytes32[] memory writes) = vm.accesses(address(reserve));
        for (uint256 i = 0; i < writes.length; i++) {
            bytes32 value = vm.load(address(reserve), writes[i]);
            assertTrue(value != bytes32(uint256(uint160(pool))) && value != bytes32(uint256(uint160(market))), "venue address persisted (AD-10)");
        }
        ILeverageReserve.Position memory p = reserve.positionOf(positionId);
        console2.log("opened: contracts / stake charged / entry price", p.quantityRaw, charged, p.entryPriceRaw);
        assertEq(IERC20(COLLATERAL).balanceOf(opener), openerBefore - charged, "the owner paid the stake and nothing else");
        assertEq(IERC20(COLLATERAL).balanceOf(address(reserve)), reserve.liquid(), "wallet == liquid: credit collected");
        assertEq(reserve.liquid(), liquidBefore + p.premium - p.fronted);
        assertEq(reserve.outstanding(), p.fronted);
        assertEq(IOutcomeToken6909(reserve.outcomeToken()).balanceOf(address(reserve), _yesId()), p.quantityRaw, "the reserve holds the contracts");

        (uint256 mark,, uint256 line, bool knockable) = reserve.markOf(positionId);
        console2.log("mark at the resting bid / line", mark, line);
        assertFalse(knockable, "healthy at the seeded bid");
        vm.prank(stranger);
        vm.expectPartialRevert(ILeverageReserve.StillHealthy.selector);
        reserve.knockOut(positionId);

        // A fork cannot move the live makers' bids, so — as the reference's own proof script does
        // (`prove-margin-liquidation.mjs`: "raise maintenance to its health line; this stands in for
        // that decay") — the line is raised over the mark. The sale itself hits the real resting bids.
        ILeverageReserve.Params memory raised = new DeployLeverageReserve().launchParams();
        uint256 needed = mark * 10_000 / p.fronted + 200;
        require(needed <= type(uint16).max, "mark too far over the front to stage a knock-out here");
        raised.maintenanceBps = uint16(needed);
        reserve.setParams(raised);
        (mark,, line, knockable) = reserve.markOf(positionId);
        console2.log("line raised over the mark: mark / line", mark, line);
        assertTrue(knockable);
        uint256 ownerMid = IERC20(COLLATERAL).balanceOf(opener);
        vm.prank(stranger);
        (uint256 proceeds, uint256 reclaimed, uint256 returned) = reserve.knockOut(positionId);
        console2.log("knock-out: proceeds / reclaimed / returned", proceeds, reclaimed, returned);
        p = reserve.positionOf(positionId);
        assertEq(uint8(p.status), uint8(ILeverageReserve.PositionStatus.KNOCKED_OUT));
        assertEq(IERC20(COLLATERAL).balanceOf(opener), ownerMid + returned, "the owner, not the cranker, gets the rest");
        assertEq(IERC20(COLLATERAL).balanceOf(address(reserve)), reserve.liquid());
        assertEq(reserve.outstanding(), 0);
        console2.log("reserve after the knock-out: liquid vs supplied", reserve.liquid(), 5_000 * ONE);

        // A second open, then the Window voided through the venue and settled: half a contract each.
        _seed(bidYes, askYes);
        ILeverageReserve.Preview memory q2 = reserve.sizeForStake(id, 1, STAKE, TWO_X);
        vm.prank(opener);
        (uint256 second,) = reserve.open(id, 1, q2.quantityRaw, TWO_X, STAKE);
        vm.warp(uint256(expiry) + uint256(IBinaryMarket(market).settlementWindow()) + 1);
        IBinaryMarket(market).voidExpired();
        assertTrue(IBinaryMarket(market).isVoided());
        uint256 ownerLate = IERC20(COLLATERAL).balanceOf(opener);
        (uint256 payout, uint256 reclaimed2, uint256 returned2) = reserve.settle(second);
        console2.log("void settle: payout / reclaimed / returned", payout, reclaimed2, returned2);
        assertEq(IERC20(COLLATERAL).balanceOf(opener), ownerLate + returned2);
        assertEq(uint8(reserve.positionOf(second).status), uint8(ILeverageReserve.PositionStatus.SETTLED));
        assertEq(reserve.unsettledExpired(), 0);
        assertEq(IERC20(COLLATERAL).balanceOf(address(reserve)), reserve.liquid());

        uint256 shares = reserve.sharesOf(house);
        vm.prank(house);
        uint256 out = reserve.withdraw(shares);
        console2.log("house withdraws", out);
    }

    function _yesId() internal view returns (uint256 yesId) {
        (,,,,,,,,,, yesId,,,) = IBinaryModule(MODULE).markets(id);
    }
}
