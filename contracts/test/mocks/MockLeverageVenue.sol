// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IBinaryPool} from "../../src/interfaces/IDreamDex.sol";
import {ImmediateOrCancelNoFill, MockCollateral} from "./MockVenue.sol";

/// @dev One Window's market and pool for the leverage reserve: a resting book in YES terms that IOC
///      takers walk level by level — buying YES takes the asks, buying NO the bids (paying the rest of a
///      set), selling is the other side — consuming what they take. Escrow is the limit for the whole
///      size, the unspent part refunded (as credit when the knob says so). Outcome tokens live on the venue.
contract MockLeveragePool {
    uint256 internal constant ONE = 1e6;
    MockLeverageVenue public immutable venue;
    MockCollateral public immutable coll;
    bytes32 public immutable marketId;
    uint8 public status = 1;
    bool public isResolved;
    bool public isVoided;
    uint8 public winner;
    uint64 public expiry;
    uint256 public feeBps;
    bool public refundAsCredit;
    IBinaryPool.Level[] private _bids;
    IBinaryPool.Level[] private _asks;
    mapping(address => uint256) public credit;

    constructor(MockLeverageVenue venue_, MockCollateral coll_, bytes32 marketId_, uint64 expiry_) {
        venue = venue_;
        coll = coll_;
        marketId = marketId_;
        expiry = expiry_;
    }

    // knobs
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

    function setFee(uint256 bps) external {
        feeBps = bps;
    }

    function setRefundAsCredit(bool on) external {
        refundAsCredit = on;
    }

    function setStatus(uint8 s) external {
        status = s;
    }

    function setExpiry(uint64 e) external {
        expiry = e;
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

    // pool
    function getOrderBookParameters() external pure returns (uint256 tickSize, uint256 minQuantity, uint256 lotSize) {
        return (1_000, 100_000, 10_000);
    }

    function getBookLevels(bool isBid, uint64 numLevels) external view returns (IBinaryPool.Level[] memory out) {
        IBinaryPool.Level[] storage side = isBid ? _bids : _asks;
        uint256 n;
        for (uint256 i = 0; i < side.length && n < numLevels; i++) {
            if (side[i].quantity != 0) n++;
        }
        out = new IBinaryPool.Level[](n);
        uint256 k;
        for (uint256 i = 0; i < side.length && k < n; i++) {
            if (side[i].quantity != 0) out[k++] = side[i];
        }
    }

    function placeBinaryOrder(uint8 kind, uint256 price, uint256 qty, uint64 expireNs, uint8 orderType, uint8, address, uint96, uint64)
        external
        returns (bool, uint128)
    {
        require(orderType == 2, "IOC only in mock");
        require(status == 1, "not trading");
        require(expireNs > uint64(block.timestamp) * 1e9, "OrderAlreadyExpired");
        bool isBuy = kind == 0 || kind == 2;
        bool isYes = kind < 2;
        // Buying YES or selling NO meets the asks; buying NO or selling YES meets the bids.
        IBinaryPool.Level[] storage side = (isBuy == isYes) ? _asks : _bids;
        uint256 id = isYes ? venue.yesIdOf(marketId) : venue.noIdOf(marketId);
        uint256 filled;
        uint256 weighted;
        for (uint256 i = 0; i < side.length && filled < qty; i++) {
            IBinaryPool.Level storage level = side[i];
            if (level.quantity == 0) continue;
            bool crosses = (isBuy == isYes) ? level.price <= price : level.price >= price;
            if (!crosses) break;
            uint256 take = qty - filled;
            if (level.quantity < take) take = level.quantity;
            weighted += take * (isYes ? level.price : ONE - level.price);
            level.quantity -= take;
            filled += take;
        }
        if (filled == 0) revert ImmediateOrCancelNoFill();
        if (isBuy) {
            uint256 escrow = (qty * (isYes ? price : ONE - price) + ONE - 1) / ONE;
            uint256 fromCredit = credit[msg.sender] < escrow ? credit[msg.sender] : escrow;
            credit[msg.sender] -= fromCredit;
            require(coll.transferFrom(msg.sender, address(this), escrow - fromCredit), "escrow");
            uint256 cost = weighted / ONE;
            cost += cost * feeBps / 10_000;
            // A fee past the escrow is pulled on top, as a taker fee the venue charges would be.
            if (cost > escrow) require(coll.transferFrom(msg.sender, address(this), cost - escrow), "fee");
            else _payBack(escrow - cost);
            venue.mintTo(msg.sender, id, filled);
        } else {
            require(venue.isOperator(msg.sender, address(this)), "pool not operator");
            venue.burnFrom(msg.sender, id, filled);
            uint256 proceeds = weighted / ONE;
            proceeds -= proceeds * feeBps / 10_000;
            _payBack(proceeds);
        }
        return (true, 0);
    }

    function getWithdrawableBalance(address owner, address) external view returns (uint256) {
        return credit[owner];
    }

    function withdraw(address, uint256 amount) external {
        credit[msg.sender] -= amount;
        require(coll.transfer(msg.sender, amount), "withdraw");
    }

    function _payBack(uint256 amount) internal {
        if (amount == 0) return;
        if (refundAsCredit) credit[msg.sender] += amount;
        else require(coll.transfer(msg.sender, amount), "refund");
    }
}

/// @dev The module, the settlement and the ERC-6909 singleton for many leverage Windows.
contract MockLeverageVenue {
    MockCollateral public immutable coll;
    mapping(bytes32 => MockLeveragePool) public poolOf;
    mapping(address => mapping(uint256 => uint256)) public balanceOf;
    mapping(address => mapping(address => bool)) public isOperator;
    uint256 private _next = 1;

    constructor(MockCollateral coll_) {
        coll = coll_;
    }

    function addWindow(uint64 expiry) external returns (bytes32 id, MockLeveragePool pool) {
        id = bytes32(0x40000 + _next);
        _next += 1;
        pool = new MockLeveragePool(this, coll, id, expiry);
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

    function burnFrom(address from, uint256 id, uint256 amount) external {
        balanceOf[from][id] -= amount;
    }

    // module
    function markets(bytes32 id)
        external
        view
        returns (uint256, uint8, uint8, address, uint32, bytes32, address, address, address, address, uint256, uint256, uint64, uint64)
    {
        MockLeveragePool p = poolOf[id];
        if (address(p) == address(0)) {
            return (0, 0, 0, address(0), 0, bytes32(0), address(0), address(0), address(0), address(0), 0, 0, 0, 0);
        }
        return (1, 2, 0, address(coll), 7, bytes32("venue"), address(0), address(0), address(p), address(p), yesIdOf(id), noIdOf(id), 0, p.expiry());
    }

    function settlement() external view returns (address) {
        return address(this);
    }

    function redeem(uint32, bytes32, bytes32 id, uint8 idx, uint256 amount) external {
        MockLeveragePool p = poolOf[id];
        require(p.isResolved() || p.isVoided(), "not settled");
        require(isOperator[msg.sender][address(this)], "settlement not operator");
        uint256 tokenId = idx == 0 ? yesIdOf(id) : noIdOf(id);
        balanceOf[msg.sender][tokenId] -= amount;
        uint256 per = p.isVoided() ? 500_000 : (idx == p.winner() ? 1_000_000 : 0);
        uint256 out = amount * per / 1e6;
        if (out != 0) require(coll.transfer(msg.sender, out), "payout");
    }

    // ERC-6909
    function setOperator(address spender, bool approved) external returns (bool) {
        isOperator[msg.sender][spender] = approved;
        return true;
    }
}
