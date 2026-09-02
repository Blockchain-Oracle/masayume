// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title The slice of Somnia's OracleHub that a price-basis consumer needs.
/// @notice Signatures were taken from `@somnia-chain/markets-sdk` 0.28.1's `oracleHubAbi` and checked
///         against Shannon (context/43): `questionKeyOf` over a definition rebuilt from a live Window's
///         scheduling call returns the hub's own key, so the struct layout below is the wire layout.
/// @dev A Window's closing question is Numeric with one all-covering interval and two decimals, so
///      `pullNumericAnswer` returns the closing print in cents. It reverts (selector `0x25cd016c`)
///      until the oracle has delivered, and returns `(value, false)` from then on — the answer stays
///      readable after the Window itself has settled.
interface IOracleHub {
    /// @dev `sourceType`: Website(0) JSON(1) Contract(2). A JSON source's `params` is
    ///      `abi.encode(string url, string jsonPath, uint256 decimals)`.
    struct QuestionSource {
        uint8 sourceType;
        bytes params;
    }

    /// @dev Inclusive bounds, scaled by `ValidAnswers.numericDecimals`.
    struct NumericInterval {
        int256 low;
        int256 high;
    }

    /// @dev `answerType`: Numeric(0) Discrete(1).
    struct ValidAnswers {
        uint8 answerType;
        string[] discreteOutcomes;
        NumericInterval[] numericIntervals;
        uint64 numericDecimals;
    }

    /// @dev The text is excluded from the dedup key of an all-JSON definition; the sources decide the answer.
    struct QuestionDefinition {
        string questionText;
        QuestionSource[] sources;
        ValidAnswers validAnswers;
        uint256 resolutionTime;
        uint256 minAgreement;
        uint256 subcommitteeSize;
        uint256 subcommitteeThreshold;
    }

    /// @notice The delivered numeric answer; reverts while the question is still pending.
    function pullNumericAnswer(uint256 oracleQuestionId) external view returns (int256 numericValue, bool voided);

    /// @notice The delivered slot answer; reverts while the question is still pending.
    function pullAnswer(uint256 oracleQuestionId) external view returns (uint8 outcomeIdx, bool voided);

    /// @notice The marginal native cost of scheduling `def`: zero when an identical definition is already live.
    function getSchedulingCost(QuestionDefinition calldata def) external view returns (uint256 cost);

    /// @notice Schedules `def`, or returns the live question an identical definition already maps to.
    function scheduleQuestion(QuestionDefinition calldata def) external payable returns (uint256 oracleQuestionId);

    /// @notice The content-addressed key of `def` (zero for definitions that bypass dedup).
    function questionKeyOf(QuestionDefinition calldata def) external pure returns (bytes32 key);

    /// @notice The live question id a key resolves to; zero when never scheduled.
    function questionIdByKey(bytes32 questionKey) external view returns (uint256 oracleQuestionId);

    function bindCount(uint256 oracleQuestionId) external view returns (uint32 count);

    function MAX_BINDS_PER_QUESTION() external view returns (uint32);
}
