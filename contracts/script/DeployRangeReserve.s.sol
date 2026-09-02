// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule} from "../src/interfaces/IDreamDex.sol";
import {IOracleHub} from "../src/interfaces/IOracleHub.sol";
import {IRangeReserve} from "../src/range/IRangeReserve.sol";
import {RangeReserve} from "../src/range/RangeReserve.sol";

/// @notice Deploys the range reserve against DreamDEX's pinned module, the OracleHub and the venue whose
///         Windows it accepts, sets the house's volatility per asset, and merges its address into
///         `deployments/<chainId>.json` (AD-10 lockstep: deploy → export → commit).
/// @dev Launch parameters: the parlay's margin and caps; the centre read over the parlay's depth; the
///      reference's 2%–97% admission band; volatility measured from the venue's own closing prints on
///      2026-09-02 (context/43: BTC 0.615 bps/√s over 388 five-minute Windows, ETH 0.75–0.80 over 370).
///      `setParams` / `setVolatility` tune them later without a redeploy.
contract DeployRangeReserve is Script {
    address internal constant BINARY_MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    address internal constant ORACLE_HUB = 0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b;
    /// @dev Operator 2's venue — the 5m/15m/1h… lanes whose questions live on the hub in cents.
    bytes32 internal constant VENUE_ID = 0x679795a0195a1b76cdebb7c51d74e058aee92919b8c3389af86ef24535e8a28c;
    address internal constant SHANNON_TEST_USDC = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    uint256 internal constant ONE = 1e6;

    function launchParams() public pure returns (IRangeReserve.Params memory) {
        return IRangeReserve.Params({
            marginBps: 1_200,
            maxExposureBps: 6_000,
            maxSpreadRaw: 200_000,
            centerDepthRaw: 20 * ONE,
            minCenterQE6: 30_000,
            maxCenterQE6: 970_000,
            minProbRaw: 20_000,
            maxProbRaw: 970_000,
            minTimeLeftSec: 60,
            maxHorizonSec: 2 days,
            staleAfterSec: 6 hours,
            maxPayoutCap: 500 * ONE,
            maxExpiryLocked: 1_000 * ONE
        });
    }

    /// @dev Exposed for the fork test (a constant cannot be read through an instance).
    function VENUE_ID_() external pure returns (bytes32) {
        return VENUE_ID;
    }

    function launchVolatility() public pure returns (string[2] memory assets, uint64[2] memory sigmaE8) {
        assets = ["BTC", "ETH"];
        sigmaE8 = [uint64(6_200), uint64(7_800)];
    }

    function run() external returns (RangeReserve reserve) {
        string memory tag = vm.envOr("DEPLOY_TAG", string(""));
        string memory suffix = bytes(tag).length == 0 ? "" : string.concat("-", tag);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), suffix, ".json");
        address collateral = vm.envOr("COLLATERAL", SHANNON_TEST_USDC);
        if (vm.exists(path)) collateral = vm.envOr("COLLATERAL", vm.parseJsonAddress(vm.readFile(path), ".collateral"));
        (string[2] memory assets, uint64[2] memory sigmaE8) = launchVolatility();

        vm.startBroadcast();
        reserve = new RangeReserve(IERC20(collateral), IBinaryModule(BINARY_MODULE), IOracleHub(ORACLE_HUB), VENUE_ID, launchParams());
        for (uint256 i = 0; i < assets.length; i++) {
            reserve.setVolatility(assets[i], sigmaE8[i]);
        }
        vm.stopBroadcast();

        if (vm.exists(path)) {
            vm.writeJson(vm.toString(address(reserve)), path, ".rangeReserve");
            vm.writeJson(vm.toString(block.number), path, ".rangeReserveFromBlock");
        } else {
            string memory key = "deployment";
            vm.serializeUint(key, "chainId", block.chainid);
            vm.serializeAddress(key, "collateral", collateral);
            vm.serializeUint(key, "rangeReserveFromBlock", block.number);
            string memory json = vm.serializeAddress(key, "rangeReserve", address(reserve));
            vm.writeJson(json, path);
        }
    }
}
