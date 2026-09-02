// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console2} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {IMarketMakerVault} from "../src/maker/IMarketMakerVault.sol";
import {MarketMakerVault} from "../src/maker/MarketMakerVault.sol";
import {DeployMarketMakerVault} from "../script/DeployMarketMakerVault.s.sol";

interface ITestUsdc {
    function faucet(uint256 amount) external;
}

interface IPoolParams {
    function getBinaryPoolParams() external view returns (address collateralToken, address market, address outcomeToken);
    function getOrderBookParameters() external view returns (uint256 tickSize, uint256 minQuantity, uint256 lotSize);
}

/// @notice The vault against Shannon's real contracts on a fork: a post-only pair rests inside a live Window's
///         book (priced off its top, on its tick grid — a flat 0.48 crossed the 4h ETH book's 0.405 ask and the
///         venue refused it `PostOnlyWouldCross`, 2026-09-02), two takers hit both sides, the pair merges back
///         for one, a second quote is pulled to the cent. Runs only with `SHANNON_FORK_URL` set; skipped
///         otherwise. `FORK_MARKET_ID` pins a Trading Window (decimal).
contract MarketMakerVaultForkTest is Test {
    address internal constant COLLATERAL = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    address internal constant MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    uint256 internal constant ONE = 1e6;
    uint256 internal constant QTY = 10 * ONE;
    uint8 internal constant BUY_YES = 0;
    uint8 internal constant BUY_NO = 2;
    uint8 internal constant IOC = 2;

    bool internal forked;
    MarketMakerVault internal vault;
    address internal house = makeAddr("house");
    address internal maker = makeAddr("maker");
    address internal taker = makeAddr("taker");
    bytes32 internal id;
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
        address market;
        (,,,,,,,, market, pool,,,, expiry) = IBinaryModule(MODULE).markets(id);
        require(IBinaryMarket(market).status() == 1, "pinned Window is not Trading at the fork block");
        (,, address outcomeToken) = IPoolParams(pool).getBinaryPoolParams();
        console2.log("outcome token", outcomeToken);

        vault = new MarketMakerVault(IERC20(COLLATERAL), IBinaryModule(MODULE), IOutcomeToken6909(outcomeToken), new DeployMarketMakerVault().launchParams());
        vault.setMaker(maker);
        vm.deal(house, 1 ether);
        vm.deal(maker, 1 ether);
        vm.deal(taker, 1 ether);
        vm.startPrank(house);
        ITestUsdc(COLLATERAL).faucet(10_000 * ONE);
        IERC20(COLLATERAL).approve(address(vault), type(uint256).max);
        vault.supply(5_000 * ONE);
        vm.stopPrank();
        vm.startPrank(taker);
        ITestUsdc(COLLATERAL).faucet(1_000 * ONE);
        IERC20(COLLATERAL).approve(pool, type(uint256).max);
        vm.stopPrank();
    }

    /// @dev A pair one tick inside the live top of book, at least the vault's minimum spread apart: the YES
    ///      bid just above the best bid, the YES ask just under the best ask. With no book at all the pair
    ///      sits around even odds.
    function _pairInsideTheBook() internal view returns (uint256 bidYes, uint256 askYes) {
        (uint256 tick,,) = IPoolParams(pool).getOrderBookParameters();
        IBinaryPool.Level[] memory asks = IBinaryPool(pool).getBookLevels(false, 1);
        IBinaryPool.Level[] memory bids = IBinaryPool(pool).getBookLevels(true, 1);
        uint256 bestAsk = asks.length == 0 ? 520_000 : asks[0].price;
        uint256 bestBid = bids.length == 0 ? 480_000 : bids[0].price;
        uint256 minSpread = 20_000;
        require(bestAsk > bestBid + minSpread + 2 * tick, "the live book is tighter than the vault's minimum spread");
        bidYes = bestBid + tick;
        askYes = bestAsk - tick;
        if (askYes - bidYes < minSpread) askYes = bidYes + minSpread;
    }

    function test_fork_aPairRestsFillsMergesAndPulls() public {
        if (!forked) return;
        console2.log("Window", uint256(id));
        console2.log("seconds to expiry", expiry - block.timestamp);
        uint64 expireNs = uint64(expiry) * 1e9;
        (uint256 bidYes, uint256 askYes) = _pairInsideTheBook();
        console2.log("YES bid / YES ask (x1e6)", bidYes, askYes);

        vm.prank(maker);
        uint256 escrow = vault.quote(id, bidYes, askYes, QTY, expireNs);
        console2.log("escrow for 10 a side", escrow);
        assertEq(vault.deployedOf(id), escrow);
        vm.prank(address(vault));
        uint128[] memory ids = IBinaryPool(pool).getOwnOpenOrders();
        assertEq(ids.length, 2, "both bids rest on the real book");

        // A taker buys NO at the vault's YES bid (the venue's price is the YES price for every kind): the vault's
        // bid is the best on the book, so it fills first and the vault is handed YES.
        vm.prank(taker);
        IBinaryPool(pool).placeBinaryOrder(BUY_NO, bidYes, QTY, expireNs, IOC, 0, address(0), 0, 0);
        // A taker buys YES at the vault's ask: the best ask on the book, so the vault is handed NO.
        vm.prank(taker);
        IBinaryPool(pool).placeBinaryOrder(BUY_YES, askYes, QTY, expireNs, IOC, 0, address(0), 0, 0);
        (uint256 yes, uint256 no) = vault.inventoryOf(id);
        console2.log("vault holds YES / NO", yes, no);
        assertEq(yes, QTY);
        assertEq(no, QTY);

        (uint256 pairs, uint256 back) = vault.merge(id);
        console2.log("merged pairs / collateral back", pairs, back);
        assertEq(pairs, QTY);
        assertEq(back, QTY, "a complete set is worth one on the real module");
        assertEq(IERC20(COLLATERAL).balanceOf(address(vault)), vault.liquid(), "credit collected");
        assertGt(vault.totalValue(), 5_000 * ONE, "the spread is realized");
        console2.log("share price x1e6", vault.sharePriceRaw());

        vm.prank(maker);
        uint256 escrow2 = vault.quote(id, bidYes, askYes, QTY, expireNs);
        vm.prank(maker);
        (uint256 orders, uint256 returned) = vault.pull(id);
        assertEq(orders, 2);
        assertEq(returned, escrow2, "an unfilled pair comes back to the cent");
        assertEq(IERC20(COLLATERAL).balanceOf(address(vault)), vault.liquid());

        IMarketMakerVault.WindowBook memory b = vault.bookOf(id);
        console2.log("book: out / back / merged", b.escrowOut, b.escrowBack, b.merged);
        assertEq(vault.deployedOf(id), 0, "everything the venue held came back or was merged");
    }
}
