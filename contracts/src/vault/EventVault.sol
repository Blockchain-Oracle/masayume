// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IBinaryModule, IOutcomeToken6909} from "../interfaces/IDreamDex.sol";
import {VenueGateway} from "./VenueGateway.sol";

/// @title EventVault — Masayume's Trading Balance and its only delegation framework.
/// @notice Deposit once; trade from the balance yourself, or let a bounded actor trade for you.
///         Money leaves only through `withdraw` / `withdrawPrivate`, and only to the owner:
///         no function takes a payout destination. A delegate can, at worst, open in-cap
///         positions that belong to the owner (AD-5, the no-divert rule).
/// @dev Ported from Yosuku's `trading_vault.move` buckets (available / private / agent budget)
///      and extended with typed grants. Sponsored actions arrive through an ERC-2771 forwarder;
///      capital intake is never sponsored.
contract EventVault is VenueGateway, ERC2771Context, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev `grantId` written on an owner's own action.
    uint256 internal constant ATTENDED = 0;

    mapping(address owner => Account) private _accounts;
    /// @dev `grantId` is the 1-based index; 0 means "none".
    Grant[] private _grants;
    mapping(address owner => mapping(GrantKind kind => uint256 grantId)) public activeGrantOf;
    /// @dev Outcome tokens the vault holds for an owner, by ERC-6909 id.
    mapping(address owner => mapping(uint256 outcomeId => uint256 amount)) public positionOf;
    /// @dev The grant that opened a position, so its `openPositions` count closes with it.
    mapping(address owner => mapping(uint256 outcomeId => uint256 grantId)) public positionGrantOf;

    constructor(address forwarder, IERC20 collateral_, IBinaryModule module_, IOutcomeToken6909 outcomeToken_)
        VenueGateway(collateral_, module_, outcomeToken_)
        ERC2771Context(forwarder)
    {
        // Redemption burns the vault's outcome tokens through the module and its settlement contract.
        outcomeToken_.setOperator(address(module_), true);
        outcomeToken_.setOperator(module_.settlement(), true);
    }

    // ------------------------------------------------------------------ funding

    function deposit(uint256 amount) external nonReentrant {
        _deposit(_directSender(), amount);
    }

    /// @notice Credit another account's Trading Balance from the caller's own tokens.
    function creditFor(address owner, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        collateral.safeTransferFrom(_directSender(), address(this), amount);
        Account storage a = _accounts[owner];
        a.available += amount;
        emit Credited(owner, msg.sender, amount, a.available);
    }

    function creditPrivateFor(address owner, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        collateral.safeTransferFrom(_directSender(), address(this), amount);
        Account storage a = _accounts[owner];
        a.privateAvailable += amount;
        emit PrivateCredited(owner, msg.sender, amount, a.privateAvailable);
    }

    function withdraw(uint256 amount) external nonReentrant {
        address owner = _msgSender();
        Account storage a = _accounts[owner];
        _take(a.available, amount);
        a.available -= amount;
        a.totalWithdrawn += amount;
        collateral.safeTransfer(owner, amount);
        emit Withdrawn(owner, amount, a.available);
    }

    function moveToPrivate(uint256 amount) external nonReentrant {
        address owner = _msgSender();
        Account storage a = _accounts[owner];
        _take(a.available, amount);
        a.available -= amount;
        a.privateAvailable += amount;
        emit PrivateMoved(owner, amount, a.privateAvailable);
    }

    function withdrawPrivate(uint256 amount) external nonReentrant {
        address owner = _msgSender();
        Account storage a = _accounts[owner];
        _take(a.privateAvailable, amount);
        a.privateAvailable -= amount;
        a.totalWithdrawn += amount;
        collateral.safeTransfer(owner, amount);
        emit PrivateWithdrawn(owner, amount, a.privateAvailable);
    }

    // ------------------------------------------------------------------ grants

    function grant(GrantKind kind, address actor, Caps calldata caps, uint64 expiresAtSec, uint256 budget)
        external
        nonReentrant
        returns (uint256 grantId)
    {
        return _grant(_msgSender(), kind, actor, caps, expiresAtSec, budget);
    }

    /// @notice Deposit and delegate in one transaction, so a grant never exists without its budget.
    function depositAndGrant(uint256 amount, GrantKind kind, address actor, Caps calldata caps, uint64 expiresAtSec, uint256 budget)
        external
        nonReentrant
        returns (uint256 grantId)
    {
        address owner = _directSender();
        _deposit(owner, amount);
        return _grant(owner, kind, actor, caps, expiresAtSec, budget);
    }

    function fundGrant(uint256 grantId, uint256 amount) external nonReentrant {
        address owner = _msgSender();
        Grant storage g = _ownedGrant(grantId, owner);
        _requireLive(g, grantId);
        Account storage a = _accounts[owner];
        _take(a.available, amount);
        a.available -= amount;
        g.budget += amount;
        emit GrantFunded(grantId, amount, g.budget);
    }

    /// @notice Ends a grant and returns its unspent budget. Positions it opened stay the owner's.
    function revoke(uint256 grantId) external nonReentrant {
        address owner = _msgSender();
        _ownedGrant(grantId, owner);
        _revoke(owner, grantId);
    }

    // ------------------------------------------------------------------ trading

    /// @notice The owner trades from their own Trading Balance.
    function place(bytes32 marketId, uint8 outcomeIdx, bool isBuy, uint256 priceRaw, uint256 quantityRaw, uint64 expireNs)
        external
        nonReentrant
        returns (uint256 cashDelta, uint256 tokenDelta)
    {
        address owner = _msgSender();
        MarketRef memory ref = _resolve(marketId);
        uint256 id = _outcomeId(ref, outcomeIdx);
        Account storage a = _accounts[owner];
        if (isBuy) _requireEscrow(a.available, outcomeIdx, priceRaw, quantityRaw);
        else _take(positionOf[owner][id], quantityRaw);

        (cashDelta, tokenDelta) = _placeIoc(ref, outcomeIdx, isBuy, priceRaw, quantityRaw, expireNs);
        if (isBuy) {
            a.available = _debit(a.available, cashDelta);
            _book(owner, id, tokenDelta, ATTENDED);
        } else {
            _bookSale(owner, id, cashDelta, tokenDelta);
        }
        emit Executed(owner, marketId, ATTENDED, outcomeIdx, isBuy, cashDelta, tokenDelta, owner);
    }

    /// @notice A grant's actor trades for the owner, inside the grant's caps, from its budget.
    ///         Sale proceeds go to the owner's balance, never back to the actor's budget.
    function placeFor(uint256 grantId, bytes32 marketId, uint8 outcomeIdx, bool isBuy, uint256 priceRaw, uint256 quantityRaw, uint64 expireNs)
        external
        nonReentrant
        returns (uint256 cashDelta, uint256 tokenDelta)
    {
        address actor = _msgSender();
        Grant storage g = _grantOf(grantId);
        if (g.actor != actor) revert NotGrantActor(grantId, actor);
        _requireLive(g, grantId);
        address owner = g.owner;
        MarketRef memory ref = _resolve(marketId);
        uint256 id = _outcomeId(ref, outcomeIdx);
        if (isBuy) {
            _requirePrice(g, outcomeIdx, priceRaw);
            _requireEscrow(g.budget, outcomeIdx, priceRaw, quantityRaw);
        } else {
            _take(positionOf[owner][id], quantityRaw);
        }

        (cashDelta, tokenDelta) = _placeIoc(ref, outcomeIdx, isBuy, priceRaw, quantityRaw, expireNs);
        if (isBuy) _bookDelegatedBuy(g, grantId, owner, id, cashDelta, tokenDelta);
        else _bookSale(owner, id, cashDelta, tokenDelta);
        emit Executed(owner, marketId, grantId, outcomeIdx, isBuy, cashDelta, tokenDelta, actor);
    }

    // ------------------------------------------------------------------ settlement

    /// @notice Redeems an owner's settled Window into their Trading Balance. Anyone may crank it;
    ///         the credit always lands on the recorded owner (FR-31: liveness is never custody).
    function crankSettle(address owner, bytes32 marketId) external nonReentrant returns (uint256 payout) {
        MarketRef memory ref = _resolve(marketId);
        if (!_isSettled(ref)) revert MarketNotSettled();
        uint256 yes = positionOf[owner][ref.yesId];
        uint256 no = positionOf[owner][ref.noId];
        if (yes == 0 && no == 0) revert NothingToSettle();

        if (yes != 0) payout += _settleSide(owner, ref, marketId, 0, ref.yesId, yes);
        if (no != 0) payout += _settleSide(owner, ref, marketId, 1, ref.noId, no);
        if (payout != 0) _accounts[owner].available += payout;
        emit Settled(owner, marketId, payout, yes, no, msg.sender);
    }

    // ------------------------------------------------------------------ views

    function accountOf(address owner) external view returns (Account memory) {
        return _accounts[owner];
    }

    function grantOf(uint256 grantId) external view returns (Grant memory) {
        return _grantOf(grantId);
    }

    function grantCount() external view returns (uint256) {
        return _grants.length;
    }

    function isGrantLive(uint256 grantId) external view returns (bool) {
        if (grantId == 0 || grantId > _grants.length) return false;
        Grant storage g = _grants[grantId - 1];
        return !g.revoked && block.timestamp <= g.expiresAtSec;
    }

    // ------------------------------------------------------------------ internals

    /// @dev Capital intake is never sponsored (NFR-7): deposits must come from the paying account itself.
    function _directSender() internal view returns (address) {
        if (isTrustedForwarder(msg.sender)) revert NoDepositViaForwarder();
        return msg.sender;
    }

    function _deposit(address owner, uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();
        collateral.safeTransferFrom(owner, address(this), amount);
        Account storage a = _accounts[owner];
        a.available += amount;
        a.totalDeposited += amount;
        emit Deposited(owner, amount, a.available);
    }

    function _take(uint256 have, uint256 want) internal pure {
        if (want == 0) revert ZeroAmount();
        if (have < want) revert Insufficient(want, have);
    }

    /// @dev A fill may be empty (the book moved), so a zero charge is not an error here.
    function _debit(uint256 have, uint256 charge) internal pure returns (uint256) {
        if (have < charge) revert Insufficient(charge, have);
        return have - charge;
    }

    /// @dev The pool escrows the whole order at its limit before filling any of it. The escrow
    ///      comes out of the vault's pooled balance, so the bucket paying for it must cover the
    ///      worst case up front — nobody's money is borrowed, even for a block.
    function _requireEscrow(uint256 have, uint8 outcomeIdx, uint256 priceRaw, uint256 quantityRaw) internal view {
        uint256 worst = quantityRaw * _sidePrice(outcomeIdx, priceRaw) / one;
        if (worst == 0) revert ZeroAmount();
        if (have < worst) revert Insufficient(worst, have);
    }

    function _grant(address owner, GrantKind kind, address actor, Caps calldata caps, uint64 expiresAtSec, uint256 budget)
        internal
        returns (uint256 grantId)
    {
        if (actor == address(0)) revert ZeroActor();
        if (expiresAtSec <= block.timestamp) revert BadExpiry(expiresAtSec);
        uint256 previous = activeGrantOf[owner][kind];
        if (previous != 0) _revoke(owner, previous);

        Account storage a = _accounts[owner];
        if (a.available < budget) revert Insufficient(budget, a.available);
        a.available -= budget;
        _grants.push(
            Grant({
                owner: owner,
                actor: actor,
                kind: kind,
                revoked: false,
                expiresAtSec: expiresAtSec,
                spentDay: 0,
                openPositions: 0,
                caps: caps,
                budget: budget,
                spentToday: 0
            })
        );
        grantId = _grants.length;
        activeGrantOf[owner][kind] = grantId;
        emit GrantCreated(grantId, owner, actor, kind, caps, expiresAtSec, budget);
    }

    function _revoke(address owner, uint256 grantId) internal {
        Grant storage g = _grants[grantId - 1];
        if (g.revoked) return;
        g.revoked = true;
        uint256 returned = g.budget;
        g.budget = 0;
        _accounts[owner].available += returned;
        if (activeGrantOf[owner][g.kind] == grantId) activeGrantOf[owner][g.kind] = 0;
        emit GrantRevoked(grantId, owner, returned);
    }

    function _grantOf(uint256 grantId) internal view returns (Grant storage) {
        if (grantId == 0 || grantId > _grants.length) revert NoSuchGrant(grantId);
        return _grants[grantId - 1];
    }

    function _ownedGrant(uint256 grantId, address owner) internal view returns (Grant storage g) {
        g = _grantOf(grantId);
        if (g.owner != owner) revert NotGrantOwner(grantId, owner);
    }

    function _requireLive(Grant storage g, uint256 grantId) internal view {
        if (g.revoked) revert GrantIsRevoked(grantId);
        if (block.timestamp > g.expiresAtSec) revert GrantExpired(grantId, g.expiresAtSec);
    }

    function _requirePrice(Grant storage g, uint8 outcomeIdx, uint256 priceRaw) internal view {
        uint64 cap = g.caps.maxPriceRaw;
        if (cap == 0) return;
        uint256 paid = _sidePrice(outcomeIdx, priceRaw);
        if (paid > cap) revert OverPriceCap(paid, cap);
    }

    /// @dev Charges a delegated buy to the grant: per-trade cap, UTC-day cap, then budget.
    function _spend(Grant storage g, uint256 spent) internal {
        if (spent > g.caps.maxStakePerTrade) revert OverStakeCap(spent, g.caps.maxStakePerTrade);
        uint64 day = uint64(block.timestamp / 1 days);
        uint256 today = g.spentDay == day ? g.spentToday : 0;
        if (today + spent > g.caps.maxDailySpend) revert OverDailyCap(today + spent, g.caps.maxDailySpend);
        g.budget = _debit(g.budget, spent);
        g.spentDay = day;
        g.spentToday = today + spent;
    }

    /// @dev A delegated buy: charge the grant, book the tokens, count a newly opened position against its cap.
    function _bookDelegatedBuy(Grant storage g, uint256 grantId, address owner, uint256 id, uint256 spent, uint256 gained) internal {
        _spend(g, spent);
        if (!_book(owner, id, gained, grantId)) return;
        uint32 open = g.openPositions + 1;
        if (open > g.caps.maxOpenPositions) revert OverPositionCap(open, g.caps.maxOpenPositions);
        g.openPositions = open;
    }

    /// @dev Proceeds of any sale are the owner's, whoever placed it.
    function _bookSale(address owner, uint256 id, uint256 received, uint256 sold) internal {
        positionOf[owner][id] -= sold;
        _accounts[owner].available += received;
    }

    /// @return opened true when this fill created a position the owner did not have before
    function _book(address owner, uint256 id, uint256 gained, uint256 grantId) internal returns (bool opened) {
        if (gained == 0) return false;
        uint256 before = positionOf[owner][id];
        positionOf[owner][id] = before + gained;
        if (before != 0) return false;
        positionGrantOf[owner][id] = grantId;
        return grantId != ATTENDED;
    }

    function _settleSide(address owner, MarketRef memory ref, bytes32 marketId, uint8 outcomeIdx, uint256 id, uint256 amount)
        internal
        returns (uint256 payout)
    {
        positionOf[owner][id] = 0;
        uint256 grantId = positionGrantOf[owner][id];
        if (grantId != ATTENDED) {
            positionGrantOf[owner][id] = ATTENDED;
            Grant storage g = _grants[grantId - 1];
            if (g.openPositions != 0) g.openPositions -= 1;
        }
        payout = _redeem(ref, marketId, outcomeIdx, amount);
    }

    // ------------------------------------------------------------------ ERC-2771

    function _msgSender() internal view override(ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}
