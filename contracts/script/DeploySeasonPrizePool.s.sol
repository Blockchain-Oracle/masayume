// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SeasonPrizePool} from "../src/games/SeasonPrizePool.sol";

/// @notice Deploys a season's prize pool over the venue's collateral and merges its address into
///         `deployments/<chainId>.json` (AD-10 lockstep: deploy → export → commit). The season's id and end
///         come from the environment so the same script serves every season; the deployer is the admin
///         who will `distribute` at season end, and anyone may `deposit` from the moment it exists.
/// @dev `SEASON_ID` (e.g. "season-1") and `SEASON_ENDS_AT_SEC` (unix seconds) are required.
contract DeploySeasonPrizePool is Script {
    address internal constant SHANNON_TEST_USDC = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;

    function run() external returns (SeasonPrizePool pool) {
        string memory tag = vm.envOr("DEPLOY_TAG", string(""));
        string memory suffix = bytes(tag).length == 0 ? "" : string.concat("-", tag);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), suffix, ".json");
        address collateral = vm.envOr("COLLATERAL", SHANNON_TEST_USDC);
        if (vm.exists(path)) collateral = vm.envOr("COLLATERAL", vm.parseJsonAddress(vm.readFile(path), ".collateral"));
        string memory seasonId = vm.envString("SEASON_ID");
        uint64 endsAtSec = uint64(vm.envUint("SEASON_ENDS_AT_SEC"));

        vm.startBroadcast();
        pool = new SeasonPrizePool(IERC20(collateral), seasonId, endsAtSec);
        vm.stopBroadcast();

        if (vm.exists(path)) {
            vm.writeJson(vm.toString(address(pool)), path, ".seasonPrizePool");
            vm.writeJson(vm.toString(block.number), path, ".seasonPrizePoolFromBlock");
        } else {
            string memory key = "deployment";
            vm.serializeUint(key, "chainId", block.chainid);
            vm.serializeAddress(key, "collateral", collateral);
            vm.serializeUint(key, "seasonPrizePoolFromBlock", block.number);
            string memory json = vm.serializeAddress(key, "seasonPrizePool", address(pool));
            vm.writeJson(json, path);
        }
    }
}
