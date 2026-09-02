// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IBinaryPool} from "../../src/interfaces/IDreamDex.sol";
import {MockCollateral} from "./MockVenue.sol";

/// @dev One Window's market and pool for the maker: post-only orders rest, a test knob fills them as a
///      taker would, cancels refund the remaining escrow (as credit when the knob says so), expired orders
///      are drained only through `cancelExpiredOrders`. Prices are YES prices for every kind, as the venue's
///      are (verified on Shannon 2026-09-02: a BUY_NO at 0.63 escrowed 0.37 a contract). Outcome tokens live
///      on the venue (the ERC-6909 singleton).
contract MockMakerPool {
    MockMakerVenue public immutable venue;
    MockCollateral public immutable coll;
    bytes32 public immutable marketId;
    uint8 public status = 1;
    bool public isResolved;
    bool public isVoided;
    uint8 public winner;
    uint64 public expiry;
    bool public refundAsCredit;
    uint128 private _nextId = 1;
    uint128[] private _open;
    mapping(uint128 => IBinaryPool.Order) private _orders;
    mapping(uint128 => uint8) public kindOf;
    mapping(address => uint256) public credit;

    constructor(MockMakerVenue venue_, MockCollateral coll_, bytes32 marketId_, uint64 expiry_) {
        venue = venue_;
        coll = coll_;
        marketId = marketId_;
        expiry = expiry_;
    }

    // knobs
    function setRefundAsCredit(bool on) external {
        refundAsCredit = on;
    }

    function setStatus(uint8 s) external {
        status = s;
    }

    function resolve(uint8 w) external {
        status = 4;
        isResolved = true;
        winner = w;
    }

    function voidIt() external {
        status = 5;
        isVoided = true;
    }

    /// @dev A taker hits `qty` of a resting order: the escrow for it is spent, the owner receives outcome tokens.
    function fill(uint128 orderId, uint256 qty) external {
        IBinaryPool.Order storage o = _orders[orderId];
        require(o.owner != address(0) && o.quantityRemaining >= qty, "no such order or too much");
        o.quantityRemaining -= qty;
        uint256 id = kindOf[orderId] == 0 ? venue.yesIdOf(marketId) : venue.noIdOf(marketId);
        venue.mintTo(o.owner, id, qty);
        if (o.quantityRemaining == 0) _drop(orderId);
    }

    // pool
    /// @dev The venue refunds the caller's expired orders on the pool lazily, inside its next placement; on when set.
    bool public lazyRefunds;

    function setLazyRefunds(bool on) external {
        lazyRefunds = on;
    }

    function placeBinaryOrder(uint8 kind, uint256 price, uint256 qty, uint64 expireNs, uint8 orderType, uint8, address, uint96, uint64)
        external
        returns (bool, uint128)
    {
        require(orderType == 3, "post-only in this mock");
        require(status == 1, "not trading");
        require(kind == 0 || kind == 2, "the maker only buys");
        require(expireNs > uint64(block.timestamp) * 1e9, "OrderAlreadyExpired");
        if (lazyRefunds) _refundExpiredOf(msg.sender);
        // The venue's price is the YES price for every kind: a NO buy at `price` escrows the rest of a set.
        uint256 escrow = qty * (kind == 0 ? price : 1e6 - price) / 1e6;
        uint256 fromCredit = credit[msg.sender] < escrow ? credit[msg.sender] : escrow;
        credit[msg.sender] -= fromCredit;
        coll.transferFrom(msg.sender, address(this), escrow - fromCredit);
        uint128 id = _nextId++;
        _orders[id] = IBinaryPool.Order(id, true, msg.sender, 0, price, qty, qty, expireNs);
        kindOf[id] = kind;
        _open.push(id);
        return (true, id);
    }

    function cancelOrder(uint128 orderId) external {
        IBinaryPool.Order storage o = _orders[orderId];
        require(o.owner == msg.sender, "not owner");
        require(o.expireTimestampNs > uint64(block.timestamp) * 1e9, "ExpiredOrderMustBeDrained");
        _refund(o);
        _drop(orderId);
    }

    function cancelExpiredOrders(uint128[] calldata ids) external {
        for (uint256 i = 0; i < ids.length; i++) {
            IBinaryPool.Order storage o = _orders[ids[i]];
            if (o.owner == address(0) || o.expireTimestampNs > uint64(block.timestamp) * 1e9) continue;
            _refund(o);
            _drop(ids[i]);
        }
    }

    function getOwnOpenOrders() external view returns (uint128[] memory out) {
        uint64 nowNs = uint64(block.timestamp) * 1e9;
        uint256 n;
        for (uint256 i = 0; i < _open.length; i++) {
            if (_orders[_open[i]].owner == msg.sender && (!lazyRefunds || _orders[_open[i]].expireTimestampNs > nowNs)) n++;
        }
        out = new uint128[](n);
        uint256 k;
        for (uint256 i = 0; i < _open.length; i++) {
            if (_orders[_open[i]].owner == msg.sender && (!lazyRefunds || _orders[_open[i]].expireTimestampNs > nowNs)) out[k++] = _open[i];
        }
    }

    function getOrder(uint128 orderId) external view returns (IBinaryPool.Order memory) {
        return _orders[orderId];
    }

    function getWithdrawableBalance(address owner, address) external view returns (uint256) {
        return credit[owner];
    }

    function withdraw(address, uint256 amount) external {
        credit[msg.sender] -= amount;
        coll.transfer(msg.sender, amount);
    }

    function _refundExpiredOf(address owner) internal {
        uint64 nowNs = uint64(block.timestamp) * 1e9;
        for (uint256 i = 0; i < _open.length;) {
            IBinaryPool.Order storage o = _orders[_open[i]];
            if (o.owner == owner && o.expireTimestampNs <= nowNs) {
                uint128 id = o.orderId;
                _refund(o);
                _drop(id);
            } else {
                i++;
            }
        }
    }

    function _refund(IBinaryPool.Order storage o) internal {
        uint256 back = o.quantityRemaining * (kindOf[o.orderId] == 0 ? o.price : 1e6 - o.price) / 1e6;
        if (back == 0) return;
        if (refundAsCredit) credit[o.owner] += back;
        else coll.transfer(o.owner, back);
    }

    function _drop(uint128 orderId) internal {
        delete _orders[orderId];
        for (uint256 i = 0; i < _open.length; i++) {
            if (_open[i] == orderId) {
                _open[i] = _open[_open.length - 1];
                _open.pop();
                return;
            }
        }
    }
}

/// @dev The module, the settlement and the ERC-6909 singleton for many maker Windows.
contract MockMakerVenue {
    MockCollateral public immutable coll;
    mapping(bytes32 => MockMakerPool) public poolOf;
    mapping(address => mapping(uint256 => uint256)) public balanceOf;
    mapping(address => mapping(address => bool)) public isOperator;
    uint256 private _next = 1;

    constructor(MockCollateral coll_) {
        coll = coll_;
    }

    function addWindow(uint64 expiry) external returns (bytes32 id, MockMakerPool pool) {
        id = bytes32(0x30000 + _next);
        _next += 1;
        pool = new MockMakerPool(this, coll, id, expiry);
        poolOf[id] = pool;
    }

    function yesIdOf(bytes32 id) public pure returns (uint256) {
        return uint256(id) << 8;
    }

    function noIdOf(bytes32 id) public pure returns (uint256) {
        return (uint256(id) << 8) + 1;
    }

    function mintTo(address to, uint256 id, uint256 amount) external {
        balanceOf[to][id] += amount;
    }

    // module
    function markets(bytes32 id)
        external
        view
        returns (uint256, uint8, uint8, address, uint32, bytes32, address, address, address, address, uint256, uint256, uint64, uint64)
    {
        MockMakerPool p = poolOf[id];
        if (address(p) == address(0)) {
            return (0, 0, 0, address(0), 0, bytes32(0), address(0), address(0), address(0), address(0), 0, 0, 0, 0);
        }
        return (1, 2, 0, address(coll), 7, bytes32("venue"), address(0), address(0), address(p), address(p), yesIdOf(id), noIdOf(id), 0, p.expiry());
    }

    function settlement() external view returns (address) {
        return address(this);
    }

    function redeem(uint32, bytes32, bytes32 id, uint8 idx, uint256 amount) external {
        MockMakerPool p = poolOf[id];
        require(p.isResolved() || p.isVoided(), "not settled");
        require(isOperator[msg.sender][address(this)], "settlement not operator");
        uint256 tokenId = idx == 0 ? yesIdOf(id) : noIdOf(id);
        balanceOf[msg.sender][tokenId] -= amount;
        uint256 per = p.isVoided() ? 500_000 : (idx == p.winner() ? 1_000_000 : 0);
        uint256 out = amount * per / 1e6;
        if (out != 0) coll.transfer(msg.sender, out);
    }

    function mergeCompleteSet(uint32, bytes32, bytes32 id, uint256 amount) external {
        require(isOperator[msg.sender][address(this)], "module not operator");
        balanceOf[msg.sender][yesIdOf(id)] -= amount;
        balanceOf[msg.sender][noIdOf(id)] -= amount;
        coll.transfer(msg.sender, amount);
    }

    // ERC-6909
    function setOperator(address spender, bool approved) external returns (bool) {
        isOperator[msg.sender][spender] = approved;
        return true;
    }
}
