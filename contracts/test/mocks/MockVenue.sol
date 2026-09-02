// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCollateral is ERC20 {
    constructor() ERC20("Test USDC", "tUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @dev One contract plays the module, the market, the pool, the settlement and the ERC-6909
///      singleton, with knobs for the behaviours the vault's accounting must survive: partial
///      fills, fees, refunds landing as pool credit, and the three settlement outcomes.
/// @dev The venue reverts an IOC that crosses nothing (`ImmediateOrCancelNoFill`, verified on Shannon 2026-09-02).
error ImmediateOrCancelNoFill();

contract MockVenue {
    uint256 internal constant ONE = 1e6;
    bytes32 public constant MARKET = bytes32(uint256(0x11019));
    uint256 public constant YES = 0xABC00;
    uint256 public constant NO = 0xABC01;

    MockCollateral public immutable coll;
    uint8 public status = 1;
    bool public isResolved;
    bool public isVoided;
    uint8 public winner;
    uint256 public fillPriceRaw = 600_000; // YES at 0.60, so NO at 0.40
    uint256 public fillBps = 10_000; // share of the requested quantity that fills
    uint256 public feeBps = 0;
    bool public refundAsCredit;

    mapping(address => uint256) public credit;
    mapping(address => mapping(uint256 => uint256)) public balanceOf;
    mapping(address => mapping(address => bool)) public isOperator;

    constructor(MockCollateral coll_) {
        coll = coll_;
    }

    // knobs
    function setFill(uint256 priceRaw, uint256 bps) external {
        fillPriceRaw = priceRaw;
        fillBps = bps;
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

    function resolve(uint8 w) external {
        status = 4;
        isResolved = true;
        winner = w;
    }

    function voidIt() external {
        status = 5;
        isVoided = true;
    }

    // module
    function markets(bytes32 id)
        external
        view
        returns (uint256, uint8, uint8, address, uint32, bytes32, address, address, address, address, uint256, uint256, uint64, uint64)
    {
        if (id != MARKET) return (0, 0, 0, address(0), 0, bytes32(0), address(0), address(0), address(0), address(0), 0, 0, 0, 0);
        return (1, 2, 0, address(coll), 7, bytes32("venue"), address(0), address(0), address(this), address(this), YES, NO, 0, 0);
    }

    function settlement() external view returns (address) {
        return address(this);
    }

    function redeem(uint32, bytes32, bytes32 id, uint8 idx, uint256 amount) external {
        require(id == MARKET, "unknown market");
        require(isResolved || isVoided, "not settled");
        require(isOperator[msg.sender][address(this)], "settlement not operator");
        uint256 tokenId = idx == 0 ? YES : NO;
        balanceOf[msg.sender][tokenId] -= amount;
        uint256 per = isVoided ? ONE / 2 : (idx == winner ? ONE : 0);
        coll.transfer(msg.sender, amount * per / ONE);
    }

    // ERC-6909
    function setOperator(address spender, bool approved) external returns (bool) {
        isOperator[msg.sender][spender] = approved;
        return true;
    }

    // pool vault
    function getWithdrawableBalance(address owner, address) external view returns (uint256) {
        return credit[owner];
    }

    function withdraw(address, uint256 amount) external {
        credit[msg.sender] -= amount;
        coll.transfer(msg.sender, amount);
    }

    // pool
    function placeBinaryOrder(uint8 kind, uint256 price, uint256 qty, uint64, uint8 orderType, uint8, address, uint96, uint64)
        external
        returns (bool, uint128)
    {
        require(orderType == 2, "IOC only in mock");
        require(status == 1, "not trading");
        bool isBuy = kind == 0 || kind == 2;
        uint256 id = kind < 2 ? YES : NO;
        uint256 sidePrice = kind < 2 ? fillPriceRaw : ONE - fillPriceRaw;
        uint256 limit = kind < 2 ? price : ONE - price;
        uint256 filled = qty * fillBps / 10_000;

        if (isBuy) {
            if (limit < sidePrice) revert ImmediateOrCancelNoFill();
            uint256 escrow = qty * limit / ONE;
            uint256 fromCredit = credit[msg.sender] < escrow ? credit[msg.sender] : escrow;
            credit[msg.sender] -= fromCredit;
            coll.transferFrom(msg.sender, address(this), escrow - fromCredit);
            uint256 cost = filled * sidePrice / ONE;
            cost += cost * feeBps / 10_000;
            _payBack(escrow - cost);
            balanceOf[msg.sender][id] += filled;
        } else {
            require(isOperator[msg.sender][address(this)], "pool not operator");
            if (limit > sidePrice) revert ImmediateOrCancelNoFill();
            balanceOf[msg.sender][id] -= filled;
            uint256 proceeds = filled * sidePrice / ONE;
            proceeds -= proceeds * feeBps / 10_000;
            _payBack(proceeds);
        }
        return (true, 0);
    }

    function _payBack(uint256 amount) internal {
        if (amount == 0) return;
        if (refundAsCredit) credit[msg.sender] += amount;
        else coll.transfer(msg.sender, amount);
    }
}
