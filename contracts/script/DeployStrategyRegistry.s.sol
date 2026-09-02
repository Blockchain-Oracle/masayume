// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IEventVaultReads, StrategyRegistry} from "../src/strategy/StrategyRegistry.sol";

/// @notice Deploys the registry against an already-deployed EventVault and merges its address into
///         `deployments/<chainId>.json` beside the vault's keys (AD-10 lockstep: deploy → export → commit).
/// @dev Requires the vault's record to exist: read `eventVault` and `collateral` from it unless
///      `EVENT_VAULT` / `COLLATERAL` override them.
contract DeployStrategyRegistry is Script {
    function run() external returns (StrategyRegistry registry) {
        string memory path = string.concat("deployments/", vm.toString(block.chainid), ".json");
        string memory existing = vm.readFile(path);
        address eventVault = vm.envOr("EVENT_VAULT", vm.parseJsonAddress(existing, ".eventVault"));
        address collateral = vm.envOr("COLLATERAL", vm.parseJsonAddress(existing, ".collateral"));

        vm.startBroadcast();
        registry = new StrategyRegistry(IEventVaultReads(eventVault), IERC20(collateral));
        vm.stopBroadcast();

        vm.writeJson(vm.toString(address(registry)), path, ".strategyRegistry");
        vm.writeJson(vm.toString(block.number), path, ".strategyRegistryFromBlock");
    }
}
