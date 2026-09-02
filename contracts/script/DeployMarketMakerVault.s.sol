// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {IMarketMakerVault} from "../src/maker/IMarketMakerVault.sol";
import {MarketMakerVault} from "../src/maker/MarketMakerVault.sol";

/// @notice Deploys the maker vault against DreamDEX's pinned module and outcome token, names the maker
///         key (`MAKER_ADDRESS`, optional), and merges its address into `deployments/<chainId>.json`
///         (AD-10 lockstep: deploy → export → commit).
/// @dev Launch parameters: the bot kit's maker (spread ±0.02, 5 contracts) widened to the vault's
///      doctrine — a pair must leave 0.02 of a set uncovered, no bid outside 0.05–0.95, 20 contracts a
///      side, 200 tUSDC deployed per Window, 60% of value at most, eight Windows, no quotes inside the
///      last 45 s. `setParams` / `setMaker` tune them later without a redeploy.
contract DeployMarketMakerVault is Script {
    address internal constant BINARY_MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    /// @dev The venue's ERC-6909 outcome-token singleton (the vault's deploy pins the same one).
    address internal constant OUTCOME_TOKEN_6909 = 0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9;
    address internal constant SHANNON_TEST_USDC = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    uint256 internal constant ONE = 1e6;

    function launchParams() public pure returns (IMarketMakerVault.Params memory) {
        return IMarketMakerVault.Params({
            maxExposureBps: 6_000,
            minSpreadRaw: 20_000,
            minPriceRaw: 50_000,
            maxPriceRaw: 950_000,
            maxQuantityRaw: 20 * ONE,
            maxWindowDeployed: 200 * ONE,
            maxOpenWindows: 8,
            minTimeLeftSec: 45
        });
    }

    function run() external returns (MarketMakerVault vault) {
        string memory tag = vm.envOr("DEPLOY_TAG", string(""));
        string memory suffix = bytes(tag).length == 0 ? "" : string.concat("-", tag);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), suffix, ".json");
        address collateral = vm.envOr("COLLATERAL", SHANNON_TEST_USDC);
        if (vm.exists(path)) collateral = vm.envOr("COLLATERAL", vm.parseJsonAddress(vm.readFile(path), ".collateral"));
        address outcomeToken = vm.envOr("OUTCOME_TOKEN", OUTCOME_TOKEN_6909);
        address makerKey = vm.envOr("MAKER_ADDRESS", address(0));

        vm.startBroadcast();
        vault = new MarketMakerVault(IERC20(collateral), IBinaryModule(BINARY_MODULE), IOutcomeToken6909(outcomeToken), launchParams());
        if (makerKey != address(0)) vault.setMaker(makerKey);
        vm.stopBroadcast();

        if (vm.exists(path)) {
            vm.writeJson(vm.toString(address(vault)), path, ".marketMakerVault");
            vm.writeJson(vm.toString(block.number), path, ".marketMakerVaultFromBlock");
        } else {
            string memory key = "deployment";
            vm.serializeUint(key, "chainId", block.chainid);
            vm.serializeAddress(key, "collateral", collateral);
            vm.serializeUint(key, "marketMakerVaultFromBlock", block.number);
            string memory json = vm.serializeAddress(key, "marketMakerVault", address(vault));
            vm.writeJson(json, path);
        }
    }
}
