// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IBinaryPool} from "../../src/interfaces/IDreamDex.sol";
import {MockCollateral} from "./MockVenue.sol";

/// @dev One Window: plays the market (lifecycle, resolution vector) and the pool (the resting book)
///      the reserve reads. The book is in YES terms, exactly as the venue's `getBookLevels`.
contract MockWindow {
    uint8 public status = 1;
    bool public isResolved;
    bool public isVoided;
    uint64 public expiry;
    uint64 public settlementWindow = 60;
    uint256[] private _numerators;
    IBinaryPool.Level[] private _bids;
    IBinaryPool.Level[] private _asks;

    constructor(uint64 expiry_) {
        expiry = expiry_;
    }

    // knobs
    /// @dev Parallel arrays because a memory array of structs cannot be copied into storage.
    function setBook(uint256[] calldata askPrices, uint256[] calldata askQuantities, uint256[] calldata bidPrices, uint256[] calldata bidQuantities) external {
        delete _asks;
        delete _bids;
        for (uint256 i = 0; i < askPrices.length; i++) {
            _asks.push(IBinaryPool.Level(askPrices[i], askQuantities[i]));
        }
        for (uint256 i = 0; i < bidPrices.length; i++) {
            _bids.push(IBinaryPool.Level(bidPrices[i], bidQuantities[i]));
        }
    }

    function setStatus(uint8 s) external {
        status = s;
    }

    function setExpiry(uint64 e) external {
        expiry = e;
    }

    /// @dev A resolved binary carries a one-hot vector; `[1,1]` models a vector that names no winner.
    function resolve(uint256 yesNumerator, uint256 noNumerator) external {
        status = 4;
        isResolved = true;
        delete _numerators;
        _numerators.push(yesNumerator);
        _numerators.push(noNumerator);
    }

    function voidIt() external {
        status = 5;
        isVoided = true;
    }

    // market
    function payoutNumerators() external view returns (uint256[] memory) {
        return _numerators;
    }

    // pool
    function getBookLevels(bool isBid, uint64 numLevels) external view returns (IBinaryPool.Level[] memory out) {
        IBinaryPool.Level[] storage side = isBid ? _bids : _asks;
        uint256 n = side.length < numLevels ? side.length : numLevels;
        out = new IBinaryPool.Level[](n);
        for (uint256 i = 0; i < n; i++) {
            out[i] = side[i];
        }
    }
}

/// @dev The module: many Windows, each its own contract, so `status()` and the book are per market —
///      what a parlay needs and the one-market `MockVenue` cannot give.
contract MockWindows {
    MockCollateral public immutable coll;
    mapping(bytes32 => MockWindow) public windowOf;
    uint256 private _next = 1;

    constructor(MockCollateral coll_) {
        coll = coll_;
    }

    function addWindow(uint64 expiry) external returns (bytes32 id, MockWindow window) {
        id = bytes32(0x20000 + _next);
        _next += 1;
        window = new MockWindow(expiry);
        windowOf[id] = window;
    }

    function markets(bytes32 id)
        external
        view
        returns (uint256, uint8, uint8, address, uint32, bytes32, address, address, address, address, uint256, uint256, uint64, uint64)
    {
        MockWindow w = windowOf[id];
        if (address(w) == address(0)) {
            return (0, 0, 0, address(0), 0, bytes32(0), address(0), address(0), address(0), address(0), 0, 0, 0, 0);
        }
        uint256 base = uint256(id) << 8;
        return (1, 2, 0, address(coll), 7, bytes32("venue"), address(0), address(0), address(w), address(w), base, base + 1, 0, w.expiry());
    }

    function settlement() external view returns (address) {
        return address(this);
    }
}
