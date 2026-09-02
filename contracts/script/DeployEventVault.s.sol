// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {EventVault} from "../src/vault/EventVault.sol";

/// @notice Deploys the forwarder and the vault against DreamDEX's pinned addresses and writes
///         `deployments/<chainId>.json`, the one file `packages/markets` regenerates its
///         addresses module from (AD-10 lockstep: deploy → commit module → deploy web/ops).
/// @dev DreamDEX's core is CREATE3, so these addresses are the same on Shannon and mainnet;
///      the collateral differs (tUSDC on Shannon) and is read from the environment.
contract DeployEventVault is Script {
    address internal constant BINARY_MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    address internal constant OUTCOME_TOKEN_6909 = 0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9;
    address internal constant SHANNON_TEST_USDC = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;

    function run() external returns (ERC2771Forwarder forwarder, EventVault vault) {
        address collateral = vm.envOr("COLLATERAL", SHANNON_TEST_USDC);
        vm.startBroadcast();
        forwarder = new ERC2771Forwarder("Masayume");
        vault = new EventVault(address(forwarder), IERC20(collateral), IBinaryModule(BINARY_MODULE), IOutcomeToken6909(OUTCOME_TOKEN_6909));
        vm.stopBroadcast();

        string memory key = "deployment";
        vm.serializeUint(key, "chainId", block.chainid);
        vm.serializeUint(key, "fromBlock", block.number);
        vm.serializeAddress(key, "collateral", collateral);
        vm.serializeAddress(key, "forwarder", address(forwarder));
        string memory json = vm.serializeAddress(key, "eventVault", address(vault));
        vm.writeJson(json, string.concat("deployments/", vm.toString(block.chainid), ".json"));
    }
}
