// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBinaryModule, IOutcomeToken6909} from "../src/interfaces/IDreamDex.sol";
import {IPrivateDesk} from "../src/private/IPrivateDesk.sol";
import {PrivateDesk} from "../src/private/PrivateDesk.sol";

/// @notice Deploys the private desk against DreamDEX's pinned module and outcome token and merges its address
///         into `deployments/<chainId>.json` (AD-10 lockstep: deploy → export → commit).
/// @dev `PRIVATE_DESK_SIGNER` is the address of the key the desk service signs with (never the deployer). Launch
///      parameters: a 1–25 tUSDC stake band per slot (the reference ran its beta at 1–2 DUSDC; ours is the public
///      minimum up to a cap the desk's float can absorb) and no mints inside the last 60 s of a Window, where the
///      three-transaction open cannot land. `setParams` tunes them later without a redeploy.
contract DeployPrivateDesk is Script {
    address internal constant BINARY_MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    /// @dev The venue's ERC-6909 outcome-token singleton (the vault's and the reserves' deploys pin the same one).
    address internal constant OUTCOME_TOKEN_6909 = 0xB52c5934113Af5c0Bb20eb3C72290C8215f755b9;
    address internal constant SHANNON_TEST_USDC = 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E;
    uint256 internal constant ONE = 1e6;

    function launchParams() public pure returns (IPrivateDesk.Params memory) {
        return IPrivateDesk.Params({minStake: ONE, maxStake: 25 * ONE, minTimeLeftSec: 60});
    }

    function run() external returns (PrivateDesk deskContract) {
        string memory tag = vm.envOr("DEPLOY_TAG", string(""));
        string memory suffix = bytes(tag).length == 0 ? "" : string.concat("-", tag);
        string memory path = string.concat("deployments/", vm.toString(block.chainid), suffix, ".json");
        address collateral = vm.envOr("COLLATERAL", SHANNON_TEST_USDC);
        if (vm.exists(path)) collateral = vm.envOr("COLLATERAL", vm.parseJsonAddress(vm.readFile(path), ".collateral"));
        address outcomeToken = vm.envOr("OUTCOME_TOKEN", OUTCOME_TOKEN_6909);
        address signer = vm.envAddress("PRIVATE_DESK_SIGNER");

        vm.startBroadcast();
        deskContract = new PrivateDesk(IERC20(collateral), IBinaryModule(BINARY_MODULE), IOutcomeToken6909(outcomeToken), signer, launchParams());
        vm.stopBroadcast();

        if (vm.exists(path)) {
            vm.writeJson(vm.toString(address(deskContract)), path, ".privateDesk");
            vm.writeJson(vm.toString(block.number), path, ".privateDeskFromBlock");
        } else {
            string memory key = "deployment";
            vm.serializeUint(key, "chainId", block.chainid);
            vm.serializeAddress(key, "collateral", collateral);
            vm.serializeUint(key, "privateDeskFromBlock", block.number);
            string memory json = vm.serializeAddress(key, "privateDesk", address(deskContract));
            vm.writeJson(json, path);
        }
    }
}
