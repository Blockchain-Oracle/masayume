// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console2} from "forge-std/Test.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryMarket, IBinaryModule, IBinaryPool, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {EventVault} from "../src/vault/EventVault.sol";
import {IEventVault} from "../src/vault/IEventVault.sol";

interface ITestUsdc {
    function faucet(uint256 amount) external;
}

interface IPoolParams {
    function getOrderBookParameters() external view returns (uint256 tickSize, uint256 minQuantity, uint256 lotSize);
    function marketExpiryNs() external view returns (uint64);
}

/// @notice Story 6.1's build-phase verification: the venue's treatment of contract-originated
///         orders, checked against Shannon's real contracts on a fork. Runs only with
///         `SHANNON_FORK_URL` set (a public RPC or a local Anvil fork); skipped otherwise.
contract EventVaultForkTest is Test {
    address internal constant COLLATERAL = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    address internal constant MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    address internal constant TOKEN6909 = 0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9;
    /// @dev Market ids are small sequential integers; the scan walks down from a recent one.
    uint256 internal constant SCAN_FROM = 0x11019 + 128;
    uint256 internal constant SCAN_COUNT = 160;
    uint256 internal constant ONE = 1e6;
    uint256 internal constant PRICE_CROSS_EVERYTHING = 990_000;

    bool internal forked;
    EventVault internal vault;
    address internal owner = makeAddr("owner");
    address internal actor = makeAddr("actor");

    function setUp() public {
        string memory url = vm.envOr("SHANNON_FORK_URL", string(""));
        if (bytes(url).length == 0) return;
        vm.createSelectFork(url);
        forked = true;
        ERC2771Forwarder forwarder = new ERC2771Forwarder("Masayume");
        vault = new EventVault(address(forwarder), IERC20(COLLATERAL), IBinaryModule(MODULE), IOutcomeToken6909(TOKEN6909));
        vm.deal(owner, 1 ether);
        vm.deal(actor, 1 ether);
        vm.startPrank(owner);
        ITestUsdc(COLLATERAL).faucet(10_000 * ONE);
        IERC20(COLLATERAL).approve(address(vault), type(uint256).max);
        vault.deposit(2_000 * ONE);
        vm.stopPrank();
    }

    /// @dev `FORK_MARKET_ID` (an integer) skips the scan; a fork's clock is frozen, so a Window that
    ///      is Trading at the fork block stays Trading for the whole test.
    function _liveMarket() internal view returns (bytes32 id, address market, address pool) {
        uint256 pinned = vm.envOr("FORK_MARKET_ID", uint256(0));
        for (uint256 i = 0; i < SCAN_COUNT; i++) {
            id = bytes32(pinned != 0 ? pinned : SCAN_FROM - i);
            (,,,,,,,, market, pool,,,,) = IBinaryModule(MODULE).markets(id);
            if (market == address(0)) continue;
            if (IBinaryMarket(market).status() != 1) continue;
            if (IBinaryMarket(market).expiry() < block.timestamp + 3 minutes) continue;
            return (id, market, pool);
        }
        revert("no Trading market with 3 minutes left in the scanned range");
    }

    function _lotQuantity(address pool, uint256 lots) internal view returns (uint256) {
        (, uint256 minQuantity, uint256 lotSize) = IPoolParams(pool).getOrderBookParameters();
        uint256 q = lotSize * lots;
        return q < minQuantity ? minQuantity : q;
    }

    function test_fork_contractOriginatedOrdersFillAndSettle() public {
        if (!forked) return;
        (bytes32 id, address market, address pool) = _liveMarket();
        uint64 expireNs = IPoolParams(pool).marketExpiryNs();
        uint256 qty = _lotQuantity(pool, 5);
        console2.log("market id", uint256(id));
        console2.log("pool", pool);
        console2.log("quantity", qty);

        // attended: the owner buys YES from the Trading Balance
        vm.record();
        vm.prank(owner);
        (uint256 spent, uint256 gained) = vault.place(id, 0, true, PRICE_CROSS_EVERYTHING, qty, expireNs);
        console2.log("attended YES: spent", spent);
        console2.log("attended YES: gained", gained);
        if (gained == 0) {
            console2.log("book had no YES offered at this size; nothing to verify further on this Window");
            return;
        }
        console2.log("effective YES price (x1e6)", spent * ONE / gained);
        console2.log("pool credit held for the vault after the fill", IBinaryPool(pool).getWithdrawableBalance(address(vault), COLLATERAL));
        assertEq(IOutcomeToken6909(TOKEN6909).balanceOf(address(vault), _yesId(id)), gained, "the vault holds what it booked");
        assertEq(vault.positionOf(owner, _yesId(id)), gained);

        // delegated: a STRATEGY actor buys NO inside its caps, from its budget
        vm.prank(owner);
        uint256 grantId = vault.grant(
            IEventVault.GrantKind.STRATEGY,
            actor,
            IEventVault.Caps({maxStakePerTrade: uint128(500 * ONE), maxDailySpend: uint128(1_000 * ONE), maxOpenPositions: 4, maxPriceRaw: 0}),
            uint64(block.timestamp + 1 days),
            800 * ONE
        );
        vm.prank(actor);
        (uint256 spentNo, uint256 gainedNo) = vault.placeFor(grantId, id, 1, true, ONE - PRICE_CROSS_EVERYTHING, qty, expireNs);
        console2.log("delegated NO: spent", spentNo);
        console2.log("delegated NO: gained", gainedNo);
        assertEq(vault.grantOf(grantId).budget, 800 * ONE - spentNo);
        assertEq(vault.positionOf(owner, _noId(id)), gainedNo, "the delegate's fill belongs to the owner");
        (, bytes32[] memory writes) = vm.accesses(address(vault));
        _assertNoPoolInStorage(writes, pool);

        // settlement: past the window with no oracle answer, anyone voids; then anyone cranks
        uint256 availableBefore = vault.accountOf(owner).available;
        vm.warp(uint256(IBinaryMarket(market).expiry()) + uint256(IBinaryMarket(market).settlementWindow()) + 1);
        IBinaryMarket(market).voidExpired();
        assertTrue(IBinaryMarket(market).isVoided());
        uint256 payout = vault.crankSettle(owner, id);
        console2.log("void payout credited", payout);
        assertEq(payout, (gained + gainedNo) / 2, "a void pays half a collateral per token on both sides");
        assertEq(vault.accountOf(owner).available, availableBefore + payout);
        assertEq(vault.positionOf(owner, _yesId(id)), 0);
        assertEq(vault.grantOf(grantId).openPositions, 0);

        // and the owner can take everything home
        uint256 total = vault.accountOf(owner).available;
        uint256 walletBefore = IERC20(COLLATERAL).balanceOf(owner);
        if (IERC20(COLLATERAL).balanceOf(address(vault)) < total) vault.sweep(pool);
        vm.prank(owner);
        vault.withdraw(total);
        assertEq(IERC20(COLLATERAL).balanceOf(owner), walletBefore + total);
    }

    function _yesId(bytes32 id) internal view returns (uint256 yesId) {
        (,,,,,,,,,, yesId,,,) = IBinaryModule(MODULE).markets(id);
    }

    function _noId(bytes32 id) internal view returns (uint256 noId) {
        (,,,,,,,,,,, noId,,) = IBinaryModule(MODULE).markets(id);
    }

    function _assertNoPoolInStorage(bytes32[] memory writes, address pool) internal view {
        bytes32 needle = bytes32(uint256(uint160(pool)));
        for (uint256 i = 0; i < writes.length; i++) {
            assertTrue(vm.load(address(vault), writes[i]) != needle, "pool address persisted in vault storage");
        }
    }
}
