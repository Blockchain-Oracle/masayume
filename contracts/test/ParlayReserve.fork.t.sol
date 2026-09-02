// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console2} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryMarket, IBinaryModule} from "../src/interfaces/IDreamDex.sol";
import {IParlayReserve} from "../src/parlay/IParlayReserve.sol";
import {ParlayReserve} from "../src/parlay/ParlayReserve.sol";
import {DeployParlayReserve} from "../script/DeployParlayReserve.s.sol";

interface ITestUsdc {
    function faucet(uint256 amount) external;
}

/// @notice The reserve against Shannon's real contracts on a fork: legs priced off the venue's own
///         books inside the open, the escrow, then a void through the venue's permissionless
///         `voidExpired` and the refund. Runs only with `SHANNON_FORK_URL` set; skipped otherwise.
contract ParlayReserveForkTest is Test {
    address internal constant COLLATERAL = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    address internal constant MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    uint256 internal constant SCAN_FROM = 0x11019 + 128;
    uint256 internal constant SCAN_COUNT = 256;
    uint256 internal constant ONE = 1e6;
    uint256 internal constant PAYOUT = 20 * ONE;

    bool internal forked;
    ParlayReserve internal reserve;
    address internal house = makeAddr("house");
    address internal opener = makeAddr("opener");

    function setUp() public {
        string memory url = vm.envOr("SHANNON_FORK_URL", string(""));
        if (bytes(url).length == 0) return;
        vm.createSelectFork(url);
        forked = true;
        reserve = new ParlayReserve(IERC20(COLLATERAL), IBinaryModule(MODULE), new DeployParlayReserve().launchParams());
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

    /// @dev Two distinct Windows that are Trading at the fork block with three minutes left. `FORK_MARKET_IDS`
    ///      ("a,b", decimal) pins both and skips the scan; the fork's clock is frozen, so what is Trading stays Trading.
    function _liveMarkets() internal view returns (bytes32[2] memory ids, address[2] memory markets) {
        string memory pinned = vm.envOr("FORK_MARKET_IDS", string(""));
        uint256 found;
        if (bytes(pinned).length != 0) {
            string[] memory parts = vm.split(pinned, ",");
            require(parts.length == 2, "FORK_MARKET_IDS wants two comma-separated decimal ids");
            for (uint256 k = 0; k < 2; k++) {
                ids[k] = bytes32(vm.parseUint(parts[k]));
                (,,,,,,,, markets[k],,,,,) = IBinaryModule(MODULE).markets(ids[k]);
                require(markets[k] != address(0), "pinned id is not a market");
                require(IBinaryMarket(markets[k]).status() == 1, "pinned market is not Trading at the fork block");
            }
            return (ids, markets);
        }
        for (uint256 i = 0; i < SCAN_COUNT && found < 2; i++) {
            bytes32 id = bytes32(SCAN_FROM - i);
            (,,,,,,,, address market,,,,, uint64 expiry) = IBinaryModule(MODULE).markets(id);
            if (market == address(0)) continue;
            if (IBinaryMarket(market).status() != 1) continue;
            if (expiry < block.timestamp + 3 minutes) continue;
            ids[found] = id;
            markets[found] = market;
            found++;
        }
        require(found == 2, "fewer than two Trading Windows with three minutes left in the scanned range");
    }

    function test_fork_legsPriceOffTheVenueBookAndAVoidRefunds() public {
        if (!forked) return;
        (bytes32[2] memory ids, address[2] memory markets) = _liveMarkets();
        console2.log("leg 0 market id", uint256(ids[0]));
        console2.log("leg 1 market id", uint256(ids[1]));

        IParlayReserve.LegInput[] memory legs = new IParlayReserve.LegInput[](2);
        legs[0] = IParlayReserve.LegInput(ids[0], 0);
        legs[1] = IParlayReserve.LegInput(ids[1], 1);

        // What each side costs over the depth the ticket needs, straight off the pools' books.
        (uint256 upPrice, uint256 upFilled) = reserve.previewLegPrice(ids[0], 0, PAYOUT);
        (uint256 downPrice, uint256 downFilled) = reserve.previewLegPrice(ids[1], 1, PAYOUT);
        console2.log("leg 0 UP price x1e6 / filled", upPrice, upFilled);
        console2.log("leg 1 DOWN price x1e6 / filled", downPrice, downFilled);
        if (upFilled < PAYOUT || downFilled < PAYOUT) {
            console2.log("a book is thinner than the payout; the open would refuse ThinBook - nothing further to verify on these Windows");
            vm.expectRevert();
            reserve.previewOpen(legs, PAYOUT);
            return;
        }

        (uint256 stake, uint256 combined,,) = reserve.previewOpen(legs, PAYOUT);
        console2.log("combined prob x1e6", combined);
        console2.log("stake for a 20 payout", stake);
        assertLt(stake, PAYOUT, "the house fronts something");

        uint256 openerBefore = IERC20(COLLATERAL).balanceOf(opener);
        vm.record();
        vm.prank(opener);
        (uint256 parlayId, uint256 charged) = reserve.openParlay(legs, PAYOUT, stake);
        (, bytes32[] memory writes) = vm.accesses(address(reserve));
        for (uint256 i = 0; i < writes.length; i++) {
            bytes32 value = vm.load(address(reserve), writes[i]);
            for (uint256 k = 0; k < 2; k++) {
                assertTrue(value != bytes32(uint256(uint160(markets[k]))), "market address persisted in reserve storage");
            }
        }
        assertEq(charged, stake, "the open charges exactly the preview");
        assertEq(IERC20(COLLATERAL).balanceOf(opener), openerBefore - stake);
        assertEq(IERC20(COLLATERAL).balanceOf(address(reserve)), 5_000 * ONE + stake, "the whole payout sits in the reserve: liquid + escrow");
        assertEq(reserve.locked(), PAYOUT - stake);
        assertEq(reserve.liquid(), 5_000 * ONE - (PAYOUT - stake));

        // Past both settlement windows with no oracle answer, anyone voids; the first void leg voids the ticket.
        uint64 last = IBinaryMarket(markets[0]).expiry() > IBinaryMarket(markets[1]).expiry() ? IBinaryMarket(markets[0]).expiry() : IBinaryMarket(markets[1]).expiry();
        uint64 window = IBinaryMarket(markets[0]).settlementWindow() > IBinaryMarket(markets[1]).settlementWindow()
            ? IBinaryMarket(markets[0]).settlementWindow()
            : IBinaryMarket(markets[1]).settlementWindow();
        vm.warp(uint256(last) + uint256(window) + 1);
        IBinaryMarket(markets[0]).voidExpired();
        assertTrue(IBinaryMarket(markets[0]).isVoided());

        reserve.resolveLeg(parlayId, 0);
        IParlayReserve.Parlay memory p = reserve.parlayOf(parlayId);
        assertEq(uint8(p.status), uint8(IParlayReserve.ParlayStatus.VOID));
        assertEq(IERC20(COLLATERAL).balanceOf(opener), openerBefore, "the stake came back");
        assertEq(reserve.liquid(), 5_000 * ONE, "the house's part is liquid again");
        assertEq(reserve.locked(), 0);
        console2.log("void refund", p.stake);

        // The house can take everything home.
        uint256 shares = reserve.sharesOf(house);
        vm.prank(house);
        uint256 out = reserve.withdraw(shares);
        assertEq(out, 5_000 * ONE);
    }
}
