// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {IMarketMakerVault} from "../src/maker/IMarketMakerVault.sol";
import {MarketMakerVault} from "../src/maker/MarketMakerVault.sol";
import {MockCollateral} from "./mocks/MockVenue.sol";
import {MockMakerPool, MockMakerVenue} from "./mocks/MockMakerVenue.sol";

abstract contract MakerTestBase is Test {
    uint256 internal constant ONE = 1e6;
    uint256 internal constant SUPPLY = 1_000 * ONE;
    uint64 internal constant NOW = 1_788_400_000;
    uint64 internal constant EXPIRY = NOW + 300;
    uint256 internal constant QTY = 20 * ONE;
    /// @dev A YES bid at 0.48 and a YES ask at 0.52: a NO buy at 0.48 in the venue's terms, 0.04 of a set uncovered.
    uint256 internal constant BID_YES = 480_000;
    uint256 internal constant ASK_YES = 520_000;

    MockCollateral internal coll;
    MockMakerVenue internal venue;
    MarketMakerVault internal vault;

    address internal house = makeAddr("house");
    address internal maker = makeAddr("maker");
    address internal stranger = makeAddr("stranger");

    bytes32 internal marketA;
    MockMakerPool internal poolA;

    function setUp() public virtual {
        vm.warp(NOW);
        coll = new MockCollateral();
        venue = new MockMakerVenue(coll);
        vault = new MarketMakerVault(IERC20(address(coll)), IBinaryModule(address(venue)), IOutcomeToken6909(address(venue)), defaultParams());
        vault.setMaker(maker);
        (marketA, poolA) = venue.addWindow(EXPIRY);

        coll.mint(house, 100_000 * ONE);
        coll.mint(address(venue), 1_000_000 * ONE);
        vm.prank(house);
        coll.approve(address(vault), type(uint256).max);
        vm.prank(house);
        vault.supply(SUPPLY);
    }

    function defaultParams() internal pure returns (IMarketMakerVault.Params memory) {
        return IMarketMakerVault.Params({
            maxExposureBps: 5_000,
            minSpreadRaw: 20_000,
            minPriceRaw: 50_000,
            maxPriceRaw: 950_000,
            maxQuantityRaw: 50 * ONE,
            maxWindowDeployed: 200 * ONE,
            maxOpenWindows: 4,
            minTimeLeftSec: 30
        });
    }

    function expireNs() internal pure returns (uint64) {
        return uint64(EXPIRY) * 1e9;
    }

    function quoteA() internal returns (uint256 escrow) {
        vm.prank(maker);
        escrow = vault.quote(marketA, BID_YES, ASK_YES, QTY, expireNs());
    }

    /// @dev The vault's order ids on a pool, YES first — what the venue reports for the vault as caller.
    function ordersOn(MockMakerPool pool) internal returns (uint128[] memory ids) {
        vm.prank(address(vault));
        ids = pool.getOwnOpenOrders();
    }

    /// @dev `balanceOf(vault) == liquid` — every venue return is collected into the wallet in the same call.
    function assertBooksBalance() internal view {
        assertEq(coll.balanceOf(address(vault)), vault.liquid(), "vault wallet == liquid");
    }
}
