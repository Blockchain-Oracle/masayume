// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {ILeverageReserve} from "../src/leverage/ILeverageReserve.sol";
import {LeverageReserve} from "../src/leverage/LeverageReserve.sol";

/// @notice Deploys the leverage reserve against DreamDEX's pinned module and outcome token and merges its
///         address into `deployments/<chainId>.json` (AD-10 lockstep: deploy → export → commit).
/// @dev Launch parameters: the reference's 3× ceiling, its 8% premium on the fronted amount
///      (`underwrite.move`) and its 120% maintenance line (`margin.move`); entry only between 0.05 and 0.95
///      (the reference's own admission band, `ticket624.core.ts`); 200 tUSDC fronted per position, 500 per
///      Window, 60% of value at most, 64 open positions, no opens inside the last 90 s. `setParams` tunes
///      them later without a redeploy; the premium is the one to revisit from observed knock-out shortfalls.
contract DeployLeverageReserve is Script {
    address internal constant BINARY_MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    /// @dev The venue's ERC-6909 outcome-token singleton (the vault's and the maker's deploys pin the same one).
    address internal constant OUTCOME_TOKEN_6909 = 0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9;
    address internal constant SHANNON_TEST_USDC = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    uint256 internal constant ONE = 1e6;

    function launchParams() public pure returns (ILeverageReserve.Params memory) {
        return ILeverageReserve.Params({
            maxLeverageBps: 30_000,
            premiumBps: 800,
            maintenanceBps: 12_000,
            maxExposureBps: 6_000,
            minEntryPriceRaw: 50_000,
            maxEntryPriceRaw: 950_000,
            maxFrontedPerPosition: 200 * ONE,
            maxWindowFronted: 500 * ONE,
            maxOpenPositions: 64,
            minTimeLeftSec: 90
        });
    }

    function run() external returns (LeverageReserve reserve) {
        string memory tag = vm.envOr("DEPLOY_TAG", string(""));
        string memory suffix = bytes(tag).length == 0 ? "" : string.concat("-", tag);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), suffix, ".json");
        address collateral = vm.envOr("COLLATERAL", SHANNON_TEST_USDC);
        if (vm.exists(path)) collateral = vm.envOr("COLLATERAL", vm.parseJsonAddress(vm.readFile(path), ".collateral"));
        address outcomeToken = vm.envOr("OUTCOME_TOKEN", OUTCOME_TOKEN_6909);

        vm.startBroadcast();
        reserve = new LeverageReserve(IERC20(collateral), IBinaryModule(BINARY_MODULE), IOutcomeToken6909(outcomeToken), launchParams());
        vm.stopBroadcast();

        if (vm.exists(path)) {
            vm.writeJson(vm.toString(address(reserve)), path, ".leverageReserve");
            vm.writeJson(vm.toString(block.number), path, ".leverageReserveFromBlock");
        } else {
            string memory key = "deployment";
            vm.serializeUint(key, "chainId", block.chainid);
            vm.serializeAddress(key, "collateral", collateral);
            vm.serializeUint(key, "leverageReserveFromBlock", block.number);
            string memory json = vm.serializeAddress(key, "leverageReserve", address(reserve));
            vm.writeJson(json, path);
        }
    }
}
