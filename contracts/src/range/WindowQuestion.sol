// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {IOracleHub} from "../interfaces/IOracleHub.sol";

/// @notice Rebuilds the closing question a DreamDEX Window schedules on the OracleHub: the six exchange
///         candle sources for the minute ending at the Window's expiry, in the venue's own URL templates.
///         Decoded from a live `scheduleQuestion` call on Shannon (context/43) and pinned there by the
///         hub's `questionKeyOf`; a template drift shows up as a key mismatch in the fork test.
library WindowQuestion {
    uint64 internal constant DECIMALS = 2;
    uint256 internal constant MIN_AGREEMENT = 4;
    uint256 internal constant SUBCOMMITTEE_SIZE = 3;
    uint256 internal constant SUBCOMMITTEE_THRESHOLD = 2;

    function build(string memory asset, uint256 expiry) internal pure returns (IOracleHub.QuestionDefinition memory def) {
        string memory sec0 = Strings.toString(expiry - 60);
        string memory secLast = Strings.toString(expiry - 1);
        string memory secT = Strings.toString(expiry);
        string memory ms0 = Strings.toString((expiry - 60) * 1000);
        string memory msLast = Strings.toString(expiry * 1000 - 1);
        string memory msBefore = Strings.toString((expiry - 60) * 1000 - 1);
        string memory msT = Strings.toString(expiry * 1000);

        def.questionText = string.concat("What is the price of ", asset, " in USDC at unix time ", secT, " UTC?");
        def.sources = new IOracleHub.QuestionSource[](6);
        def.sources[0] = _json(
            string.concat("https://data-api.binance.vision/api/v3/klines?symbol=", asset, "USDC&interval=1m&startTime=", ms0, "&endTime=", msLast, "&limit=1"),
            "[0][4]"
        );
        def.sources[1] = _json(
            string.concat("https://www.okx.com/api/v5/market/history-candles?instId=", asset, "-USDC&bar=1m&before=", msBefore, "&after=", msT, "&limit=1"),
            "data[0][4]"
        );
        def.sources[2] = _json(
            string.concat("https://api.bybit.com/v5/market/kline?category=spot&symbol=", asset, "USDC&interval=1&start=", ms0, "&end=", msLast, "&limit=1"),
            "result.list[0][4]"
        );
        def.sources[3] = _json(
            string.concat("https://api.kucoin.com/api/v1/market/candles?type=1min&symbol=", asset, "-USDC&startAt=", sec0, "&endAt=", secT),
            "data[0][2]"
        );
        def.sources[4] = _json(
            string.concat("https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=", asset, "_USDC&interval=1m&from=", sec0, "&to=", secLast),
            "[0][2]"
        );
        def.sources[5] = _json(
            string.concat("https://api.mexc.com/api/v3/klines?symbol=", asset, "USDC&interval=1m&startTime=", ms0, "&endTime=", msLast, "&limit=1"),
            "[0][4]"
        );

        def.validAnswers.answerType = 0;
        def.validAnswers.discreteOutcomes = new string[](0);
        def.validAnswers.numericIntervals = new IOracleHub.NumericInterval[](1);
        def.validAnswers.numericIntervals[0] = IOracleHub.NumericInterval(0, type(int256).max);
        def.validAnswers.numericDecimals = DECIMALS;
        def.resolutionTime = expiry;
        def.minAgreement = MIN_AGREEMENT;
        def.subcommitteeSize = SUBCOMMITTEE_SIZE;
        def.subcommitteeThreshold = SUBCOMMITTEE_THRESHOLD;
    }

    function _json(string memory url, string memory path) private pure returns (IOracleHub.QuestionSource memory) {
        return IOracleHub.QuestionSource(1, abi.encode(url, path, uint256(DECIMALS)));
    }
}
