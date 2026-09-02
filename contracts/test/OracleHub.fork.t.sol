// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console2} from "forge-std/Test.sol";
import {IBinaryMarket, IBinaryModule} from "../src/interfaces/IDreamDex.sol";
import {IOracleHub} from "../src/interfaces/IOracleHub.sol";
import {WindowQuestion} from "../src/range/WindowQuestion.sol";

/// @dev Reads the hub the way a reserve contract would: from contract code, not from an EOA's eth_call.
contract HubReader {
    IOracleHub internal immutable hub;

    constructor(IOracleHub hub_) {
        hub = hub_;
    }

    function closingPrint(uint256 questionId) external view returns (int256 value, bool voided) {
        return hub.pullNumericAnswer(questionId);
    }

    function tryClosingPrint(uint256 questionId) external view returns (bool ok, bytes memory data) {
        (ok, data) = address(hub).staticcall(abi.encodeCall(IOracleHub.pullNumericAnswer, (questionId)));
    }

    function schedule(IOracleHub.QuestionDefinition calldata def) external payable returns (uint256) {
        return hub.scheduleQuestion{value: msg.value}(def);
    }
}

/// @notice The OracleHub as a range basis, against Shannon on a fork (context/43): a settled Window's
///         closing print is readable from a contract, a Trading Window's is pending with one fixed
///         selector, and the Window's own definition dedups to its question at zero cost. Runs only
///         with `SHANNON_FORK_URL` set; skipped otherwise.
contract OracleHubForkTest is Test {
    address internal constant HUB = 0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b;
    address internal constant MODULE = 0x3ecC694Cef705358864a646142ac17A90E29e388;
    bytes4 internal constant PENDING = 0x25cd016c;
    uint8 internal constant TRADING = 1;
    uint8 internal constant RESOLVED = 4;
    uint256 internal constant SCAN_COUNT = 384;

    bool internal forked;
    HubReader internal reader;

    function setUp() public {
        string memory url = vm.envOr("SHANNON_FORK_URL", string(""));
        if (bytes(url).length == 0) return;
        vm.createSelectFork(url);
        forked = true;
        reader = new HubReader(IOracleHub(HUB));
        vm.deal(address(reader), 1 ether);
    }

    function test_fork_aContractReadsASettledQuestion() public view {
        if (!forked) return;
        uint256 questionId = vm.envOr("SETTLED_QUESTION_ID", uint256(49200));
        (int256 value, bool voided) = reader.closingPrint(questionId);
        console2.log("question", questionId);
        console2.log("closing print in cents", value);
        console2.log("voided", voided);
        assertGt(value, 0, "a settled price question answers a positive print");
        assertFalse(voided);
    }

    function test_fork_aResolvedWindowsPrintIsStillOnTheHub() public view {
        if (!forked) return;
        (bytes32 id, address market) = _window("FORK_RESOLVED_MARKET_ID", RESOLVED, 0);
        (uint256 questionId,,,,,,,,,,,,,) = IBinaryModule(MODULE).markets(id);
        (int256 value, bool voided) = reader.closingPrint(questionId);
        console2.log("resolved Window", uint256(id));
        console2.log("its question", questionId);
        console2.log("closing print in cents", value);
        assertEq(voided, IBinaryMarket(market).isVoided(), "the hub's void flag is the Window's");
        assertGt(value, 0);
    }

    function test_fork_aTradingWindowIsPendingAndItsDefinitionDedups() public {
        if (!forked) return;
        (bytes32 id,) = _window("FORK_MARKET_ID", TRADING, 60);
        (uint256 questionId,,,,,,,,,,,,, uint64 expiry) = IBinaryModule(MODULE).markets(id);
        console2.log("Trading Window", uint256(id));
        console2.log("its question", questionId);

        (bool ok, bytes memory data) = reader.tryClosingPrint(questionId);
        assertFalse(ok, "a pending question does not answer");
        assertEq(data, abi.encodePacked(PENDING), "the pending revert is one fixed selector");

        IOracleHub hub = IOracleHub(HUB);
        string memory asset = _assetOf(hub, questionId, expiry);
        console2.log("asset by key match", asset);
        IOracleHub.QuestionDefinition memory def = WindowQuestion.build(asset, expiry);
        assertEq(hub.getSchedulingCost(def), 0, "the Window's own definition costs nothing to schedule again");

        uint256 reused = reader.schedule{value: 0}(def);
        assertEq(reused, questionId, "scheduling the same definition returns the Window's question");
        assertEq(address(reader).balance, 1 ether, "nothing was charged");
    }

    /// @dev Which asset the Window is on is not readable from the module; the hub's key answers it.
    function _assetOf(IOracleHub hub, uint256 questionId, uint64 expiry) internal view returns (string memory) {
        string[2] memory assets = ["BTC", "ETH"];
        for (uint256 i = 0; i < 2; i++) {
            bytes32 key = hub.questionKeyOf(WindowQuestion.build(assets[i], expiry));
            if (hub.questionIdByKey(key) == questionId) return assets[i];
        }
        revert("neither the BTC nor the ETH definition maps to this Window's question - the venue's template moved");
    }

    /// @dev `envName` pins a decimal market id; otherwise the newest ids are scanned downward for the wanted status.
    function _window(string memory envName, uint8 wantStatus, uint256 minLeft) internal view returns (bytes32 id, address market) {
        uint256 pinned = vm.envOr(envName, uint256(0));
        if (pinned != 0) {
            id = bytes32(pinned);
            (,,,,,,,, market,,,,,) = IBinaryModule(MODULE).markets(id);
            require(market != address(0), "pinned id is not a market");
            require(IBinaryMarket(market).status() == wantStatus, "pinned market is not in the wanted status at the fork block");
            return (id, market);
        }
        uint256 from = vm.envOr("FORK_SCAN_FROM", uint256(0x11359 + 256));
        for (uint256 i = 0; i < SCAN_COUNT; i++) {
            id = bytes32(from - i);
            uint64 expiry;
            (,,,,,,,, market,,,,, expiry) = IBinaryModule(MODULE).markets(id);
            if (market == address(0)) continue;
            if (IBinaryMarket(market).status() != wantStatus) continue;
            if (expiry < block.timestamp + minLeft) continue;
            return (id, market);
        }
        revert("no Window in the wanted status in the scanned range - set FORK_SCAN_FROM near the newest id");
    }
}
