// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule} from "../src/interfaces/IDreamDex.sol";
import {IParlayReserve} from "../src/parlay/IParlayReserve.sol";
import {ParlayReserve} from "../src/parlay/ParlayReserve.sol";

/// @notice Deploys the parlay reserve against DreamDEX's pinned module and merges its address into
///         `deployments/<chainId>.json` beside the vault's keys (AD-10 lockstep: deploy → export → commit).
/// @dev The launch parameters are the reference's demo cut (`parlayClient.ts`: 12% margin, λ = 0.40,
///      3 legs) with DreamDEX-sized caps; `setParams` tunes them later without a redeploy. The
///      collateral is read from the vault's record unless `COLLATERAL` overrides it.
contract DeployParlayReserve is Script {
    address internal constant BINARY_MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    address internal constant SHANNON_TEST_USDC = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    uint256 internal constant ONE = 1e6;

    function launchParams() public pure returns (IParlayReserve.Params memory) {
        return IParlayReserve.Params({
            marginBps: 1_200,
            maxExposureBps: 6_000,
            correlationBps: 4_000,
            maxLegs: 3,
            maxPayoutCap: 500 * ONE,
            maxExpiryLocked: 1_000 * ONE,
            minCombinedProbRaw: 20_000,
            priceDepthRaw: 20 * ONE
        });
    }

    function run() external returns (ParlayReserve reserve) {
        // A tagged run (DEPLOY_TAG=anvil) writes beside the real record; export.mjs reads only `<chainId>.json`.
        string memory tag = vm.envOr("DEPLOY_TAG", string(""));
        string memory suffix = bytes(tag).length == 0 ? "" : string.concat("-", tag);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), suffix, ".json");
        address collateral = vm.envOr("COLLATERAL", SHANNON_TEST_USDC);
        if (vm.exists(path)) collateral = vm.envOr("COLLATERAL", vm.parseJsonAddress(vm.readFile(path), ".collateral"));

        vm.startBroadcast();
        reserve = new ParlayReserve(IERC20(collateral), IBinaryModule(BINARY_MODULE), launchParams());
        vm.stopBroadcast();

        if (vm.exists(path)) {
            vm.writeJson(vm.toString(address(reserve)), path, ".parlayReserve");
            vm.writeJson(vm.toString(block.number), path, ".parlayReserveFromBlock");
        } else {
            string memory key = "deployment";
            vm.serializeUint(key, "chainId", block.chainid);
            vm.serializeAddress(key, "collateral", collateral);
            vm.serializeUint(key, "parlayReserveFromBlock", block.number);
            string memory json = vm.serializeAddress(key, "parlayReserve", address(reserve));
            vm.writeJson(json, path);
        }
    }
}
