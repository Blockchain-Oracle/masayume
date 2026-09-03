// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {GameArena} from "../src/games/GameArena.sol";
import {IGameArena} from "../src/games/IGameArena.sol";

/// @notice Deploys the duel arena against DreamDEX's pinned module, outcome token and venue, prices the
///         owner's four entry tiers, and merges its address into `deployments/<chainId>.json`
///         (AD-10 lockstep: deploy → export → commit).
/// @dev Launch parameters follow the answered deck policy (`06-game-architecture.md` §Owner decisions 3
///      and 4): 3–5 distinct Windows, 15m first. The windows are sized off the reference's own duel pace
///      and the boot latency measured on 2026-09-03 — three minutes to swipe five cards is generous at a
///      ten-second confirmation, and a card must outlive that window by a minute so the last swipe of a
///      legal deck cannot revert. Tiers are Flicky's: Free plus 1 / 5 / 10 tUSDC side-pots, and a 1 tUSDC
///      cap on any one card's market order, so a five-card deck can never spend more than five.
contract DeployGameArena is Script {
    address internal constant BINARY_MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    /// @dev The venue's ERC-6909 outcome-token singleton (the vault's, the maker's and the leverage deploys pin the same one).
    address internal constant OUTCOME_TOKEN_6909 = 0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9;
    /// @dev Operator 2's venue — the 5m/15m/1h… lanes the deckmaster draws from.
    bytes32 internal constant VENUE_ID = 0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c;
    address internal constant SHANNON_TEST_USDC = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    uint256 internal constant ONE = 1e6;

    function launchParams() public pure returns (IGameArena.Params memory) {
        return IGameArena.Params({
            joinWindowSec: 180,
            revealWindowSec: 120,
            pickWindowSec: 180,
            minDeckSize: 3,
            maxDeckSize: 5,
            minCardLifeSec: 240
        });
    }

    /// @dev Index → tier, in the order `STAKE_TIERS` declares them in `packages/core/src/games/types.ts`.
    function launchTiers() public pure returns (IGameArena.Tier[4] memory tiers) {
        tiers[0] = IGameArena.Tier({potBase: 0, perCardCapBase: uint128(ONE), enabled: true});
        tiers[1] = IGameArena.Tier({potBase: uint128(ONE), perCardCapBase: uint128(ONE), enabled: true});
        tiers[2] = IGameArena.Tier({potBase: uint128(5 * ONE), perCardCapBase: uint128(ONE), enabled: true});
        tiers[3] = IGameArena.Tier({potBase: uint128(10 * ONE), perCardCapBase: uint128(ONE), enabled: true});
    }

    /// @dev Exposed for the fork test (a constant cannot be read through an instance).
    function VENUE_ID_() external pure returns (bytes32) {
        return VENUE_ID;
    }

    function run() external returns (GameArena arena) {
        string memory tag = vm.envOr("DEPLOY_TAG", string(""));
        string memory suffix = bytes(tag).length == 0 ? "" : string.concat("-", tag);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), suffix, ".json");
        address collateral = vm.envOr("COLLATERAL", SHANNON_TEST_USDC);
        if (vm.exists(path)) collateral = vm.envOr("COLLATERAL", vm.parseJsonAddress(vm.readFile(path), ".collateral"));
        address outcomeToken = vm.envOr("OUTCOME_TOKEN", OUTCOME_TOKEN_6909);
        IGameArena.Tier[4] memory tiers = launchTiers();

        vm.startBroadcast();
        arena = new GameArena(IERC20(collateral), IBinaryModule(BINARY_MODULE), IOutcomeToken6909(outcomeToken), VENUE_ID, launchParams());
        for (uint8 i = 0; i < 4; i++) {
            arena.setTier(i, tiers[i]);
        }
        vm.stopBroadcast();

        if (vm.exists(path)) {
            vm.writeJson(vm.toString(address(arena)), path, ".gameArena");
            vm.writeJson(vm.toString(block.number), path, ".gameArenaFromBlock");
        } else {
            string memory key = "deployment";
            vm.serializeUint(key, "chainId", block.chainid);
            vm.serializeAddress(key, "collateral", collateral);
            vm.serializeUint(key, "gameArenaFromBlock", block.number);
            string memory json = vm.serializeAddress(key, "gameArena", address(arena));
            vm.writeJson(json, path);
        }
    }
}
