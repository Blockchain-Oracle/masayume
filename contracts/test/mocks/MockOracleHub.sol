// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IOracleHub} from "../../src/interfaces/IOracleHub.sol";

/// @dev The hub as the reserve sees it: content-addressed questions, answers that are pending under the
///      real hub's selector (`0x25cd016c`, context/43) until set, and the scheduling quote's dedup rule.
contract MockOracleHub {
    struct Answer {
        int256 value;
        bool voided;
        bool set;
    }

    mapping(uint256 questionId => Answer) private _answers;
    mapping(bytes32 key => uint256 questionId) public questionIdByKey;
    mapping(uint256 questionId => uint32) public bindCount;
    uint256 public nextId = 1000;
    uint256 public cost = 1.296 ether;

    // knobs
    function setAnswer(uint256 questionId, int256 value, bool voided) external {
        _answers[questionId] = Answer(value, voided, true);
    }

    function clearAnswer(uint256 questionId) external {
        delete _answers[questionId];
    }

    function register(IOracleHub.QuestionDefinition memory def, uint256 questionId) external {
        questionIdByKey[_key(def)] = questionId;
    }

    // hub
    function questionKeyOf(IOracleHub.QuestionDefinition calldata def) external pure returns (bytes32) {
        return _key(def);
    }

    function pullNumericAnswer(uint256 questionId) external view returns (int256, bool) {
        Answer memory a = _answers[questionId];
        if (!a.set) _pending();
        return (a.value, a.voided);
    }

    function pullAnswer(uint256 questionId) external view returns (uint8, bool) {
        Answer memory a = _answers[questionId];
        if (!a.set) _pending();
        return (0, a.voided);
    }

    function getSchedulingCost(IOracleHub.QuestionDefinition calldata def) external view returns (uint256) {
        return questionIdByKey[_key(def)] != 0 ? 0 : cost;
    }

    function scheduleQuestion(IOracleHub.QuestionDefinition calldata def) external payable returns (uint256 id) {
        bytes32 key = _key(def);
        id = questionIdByKey[key];
        if (id != 0) return id;
        require(msg.value >= cost, "underpaid");
        id = nextId++;
        questionIdByKey[key] = id;
    }

    function MAX_BINDS_PER_QUESTION() external pure returns (uint32) {
        return 64;
    }

    function _key(IOracleHub.QuestionDefinition memory def) internal pure returns (bytes32) {
        return keccak256(abi.encode(def.sources, def.validAnswers, def.resolutionTime, def.minAgreement, def.subcommitteeSize, def.subcommitteeThreshold));
    }

    function _pending() internal pure {
        assembly {
            mstore(0, shl(224, 0x25cd016c))
            revert(0, 4)
        }
    }
}
