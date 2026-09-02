// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {EventVault} from "../src/vault/EventVault.sol";
import {IEventVault} from "../src/vault/IEventVault.sol";
import {MockCollateral, MockVenue} from "./mocks/MockVenue.sol";

abstract contract VaultTestBase is Test {
    uint256 internal constant ONE = 1e6;
    uint256 internal constant DEPOSIT = 1_000 * ONE;
    uint64 internal constant EXPIRE_NS = 1;

    MockCollateral internal coll;
    MockVenue internal venue;
    ERC2771Forwarder internal forwarder;
    EventVault internal vault;

    address internal owner = makeAddr("owner");
    address internal actor = makeAddr("actor");
    address internal stranger = makeAddr("stranger");
    bytes32 internal market;

    function setUp() public virtual {
        vm.warp(1_788_400_000);
        coll = new MockCollateral();
        venue = new MockVenue(coll);
        forwarder = new ERC2771Forwarder("Masayume");
        vault = new EventVault(address(forwarder), IERC20(address(coll)), IBinaryModule(address(venue)), IOutcomeToken6909(address(venue)));
        market = venue.MARKET();

        coll.mint(owner, 10_000 * ONE);
        coll.mint(address(venue), 1_000_000 * ONE);
        vm.prank(owner);
        coll.approve(address(vault), type(uint256).max);
    }

    function caps(uint256 perTrade, uint256 daily, uint32 open, uint64 maxPrice) internal pure returns (IEventVault.Caps memory) {
        return IEventVault.Caps({
            maxStakePerTrade: uint128(perTrade), maxDailySpend: uint128(daily), maxOpenPositions: open, maxPriceRaw: maxPrice
        });
    }

    function depositAs(address who, uint256 amount) internal {
        vm.prank(who);
        vault.deposit(amount);
    }

    function grantStrategy(uint256 budget, IEventVault.Caps memory c) internal returns (uint256 id) {
        vm.prank(owner);
        id = vault.grant(IEventVault.GrantKind.STRATEGY, actor, c, uint64(block.timestamp + 1 days), budget);
    }

    function available(address who) internal view returns (uint256) {
        return vault.accountOf(who).available;
    }

    /// @dev Asserts that nothing the call wrote to the vault's storage equals the pool's address (AD-10).
    function assertNoPoolInStorage(bytes32[] memory writes) internal view {
        bytes32 pool = bytes32(uint256(uint160(address(venue))));
        for (uint256 i = 0; i < writes.length; i++) {
            assertTrue(vm.load(address(vault), writes[i]) != pool, "pool address persisted in vault storage");
        }
    }
}
