// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IBinaryMarket, IBinaryModule, IOutcomeToken6909} from "../interfaces/IDreamDex.sol";
import {MakerGateway} from "./MakerGateway.sol";

/// @title MarketMakerVault — pooled capital that makes markets on DreamDEX Windows, bounded on-chain.
/// @notice The reference's Earn ("be the house") supplied a venue-run vault that took the other side
///         of every bet. DreamDEX has no house: the other side is the order book. So this vault IS
///         the maker. It rests one post-only order on each side of a Window — a YES bid and a YES ask,
///         the ask being a NO buy in the venue's terms — at least the minimum spread apart, so the only
///         thing it can ever buy is a complete set at a discount; it never takes, never sells what it
///         holds and never quotes one side alone. Fills land
///         as outcome tokens; pairs are merged back into collateral (the spread), and what is left
///         settles on the venue's resolution. Suppliers hold shares of `liquid + deployed` and may
///         withdraw from `liquid` once every expired Window is settled — so no one can exit ahead of
///         a loss the crank has not yet booked.
/// @dev The maker actor is one key the admin names; every bound it works under is a public param.
///      Pull, merge and settle are permissionless. Storage and events carry market ids only (AD-10).
///      Nothing takes a payout destination (AD-5): every collateral flow is the vault's own.
contract MarketMakerVault is MakerGateway, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 internal constant BPS = 10_000;

    address public admin;
    address public maker;
    bool public paused;
    Params public params;

    /// @dev Withdrawable supplier capital plus everything the venue has handed back.
    uint256 public liquid;
    uint256 public supplyShares;
    mapping(address supplier => uint256 shares) public sharesOf;

    mapping(bytes32 marketId => WindowBook) private _books;
    /// @dev Windows quoted and not yet settled; bounded by `maxOpenWindows`, so the valuation loop is too.
    bytes32[] private _open;
    mapping(bytes32 marketId => uint256 indexPlusOne) private _openAt;
    /// @dev Every Window ever quoted, oldest first — the vault's own history, readable without an event scan.
    bytes32[] private _history;

    constructor(IERC20 collateral_, IBinaryModule module_, IOutcomeToken6909 outcomeToken_, Params memory params_)
        MakerGateway(collateral_, module_, outcomeToken_)
    {
        admin = msg.sender;
        _setParams(params_);
    }

    // ------------------------------------------------------------------ admin

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin(msg.sender);
        _;
    }

    /// @notice Tunables only; resting quotes keep the terms they were placed on.
    function setParams(Params calldata next) external onlyAdmin {
        _setParams(next);
    }

    /// @notice The one key that may quote. Zero disarms quoting; pull, merge and settle stay open to anyone.
    function setMaker(address next) external onlyAdmin {
        maker = next;
        emit MakerChanged(next);
    }

    /// @notice Pauses new quotes and new supply. Pull, merge, settle and withdrawals never pause.
    function setPaused(bool next) external onlyAdmin {
        paused = next;
        emit PausedSet(next);
    }

    function setAdmin(address next) external onlyAdmin {
        if (next == address(0)) revert ZeroAddress();
        admin = next;
        emit AdminChanged(next);
    }

    function _setParams(Params memory p) internal {
        if (p.maxExposureBps > BPS || p.minPriceRaw == 0 || p.maxPriceRaw <= p.minPriceRaw || p.maxPriceRaw >= one) revert BadParams();
        if (p.minSpreadRaw == 0 || p.minSpreadRaw >= one || p.maxQuantityRaw == 0 || p.maxWindowDeployed == 0) revert BadParams();
        if (p.maxOpenWindows == 0 || p.maxOpenWindows > 64 || p.minTimeLeftSec == 0) revert BadParams();
        params = p;
        emit ParamsUpdated(p);
    }

    // ------------------------------------------------------------------ suppliers

    /// @notice Capital for the vault, as shares of its total value.
    function supply(uint256 amount) external nonReentrant returns (uint256 shares) {
        if (paused) revert IsPaused();
        if (amount == 0) revert ZeroAmount();
        uint256 tv = totalValue();
        shares = (supplyShares == 0 || tv == 0) ? amount : amount * supplyShares / tv;
        if (shares == 0) revert ZeroAmount();
        collateral.safeTransferFrom(msg.sender, address(this), amount);
        supplyShares += shares;
        sharesOf[msg.sender] += shares;
        liquid += amount;
        emit Supplied(msg.sender, amount, shares, liquid);
    }

    /// @notice Redeems shares for their part of the total value, from `liquid` only, to the caller.
    ///         Refused while a Window past its expiry is still unsettled — settle it first (anyone may).
    function withdraw(uint256 shares) external nonReentrant returns (uint256 amount) {
        if (shares == 0) revert ZeroAmount();
        uint256 held = sharesOf[msg.sender];
        if (held < shares) revert InsufficientShares(shares, held);
        bytes32 stale = unsettledExpired();
        if (stale != bytes32(0)) revert UnsettledWindow(stale);
        amount = shares * totalValue() / supplyShares;
        if (liquid < amount) revert InsufficientLiquidity(amount, liquid);
        sharesOf[msg.sender] = held - shares;
        supplyShares -= shares;
        liquid -= amount;
        collateral.safeTransfer(msg.sender, amount);
        emit SupplyRedeemed(msg.sender, amount, shares, liquid);
    }

    // ------------------------------------------------------------------ the maker

    /// @notice Rests a YES bid and a YES ask on a Window, post-only, as one quote — both in the venue's own
    ///         YES terms; the ask is a NO buy at `one − askYes`. The ask must sit `minSpreadRaw` above the
    ///         bid, so a double fill buys a complete set for `one − (askYes − bidYes)` and nothing else is
    ///         possible. The venue's escrow for both is what the vault books.
    function quote(bytes32 marketId, uint256 bidYesRaw, uint256 askYesRaw, uint256 quantityRaw, uint64 expireNs)
        external
        nonReentrant
        returns (uint256 escrow)
    {
        if (msg.sender != maker) revert NotMaker(msg.sender);
        if (paused) revert IsPaused();
        Params memory p = params;
        if (quantityRaw == 0 || quantityRaw > p.maxQuantityRaw) revert OverQuantity(quantityRaw, p.maxQuantityRaw);
        if (bidYesRaw < p.minPriceRaw || bidYesRaw > p.maxPriceRaw) revert BadPrice(bidYesRaw);
        if (askYesRaw < p.minPriceRaw || askYesRaw > p.maxPriceRaw) revert BadPrice(askYesRaw);
        if (askYesRaw < bidYesRaw + p.minSpreadRaw) revert SpreadTooThin(bidYesRaw, askYesRaw, p.minSpreadRaw);

        MarketRef memory ref = _resolve(marketId);
        uint8 status = IBinaryMarket(ref.market).status();
        if (status != STATUS_TRADING) revert MarketNotTrading(marketId, status);
        if (ref.expiry < block.timestamp + p.minTimeLeftSec) revert TooLate(marketId, ref.expiry);
        if (expireNs <= uint64(block.timestamp) * NS || expireNs > uint64(ref.expiry) * NS) revert BadExpiry(expireNs, ref.expiry);

        WindowBook storage b = _books[marketId];
        if (b.settled) revert MarketNotTrading(marketId, status);
        if (b.quoteCount == 0) {
            if (_open.length >= p.maxOpenWindows) revert TooManyWindows(uint32(_open.length), p.maxOpenWindows);
            _open.push(marketId);
            _openAt[marketId] = _open.length;
            _history.push(marketId);
            b.openedAtSec = uint64(block.timestamp);
        }

        uint256 expected = (bidYesRaw + (one - askYesRaw)) * quantityRaw / one;
        if (liquid < expected) revert InsufficientLiquidity(expected, liquid);
        _ensureAllowance(ref.pool);
        (uint256 escrowBid, uint256 backBid, uint128 bidId) = _rest(ref, BUY_YES, bidYesRaw, quantityRaw, expireNs);
        (uint256 escrowAsk, uint256 backAsk, uint128 askId) = _rest(ref, BUY_NO, askYesRaw, quantityRaw, expireNs);
        escrow = escrowBid + escrowAsk;
        uint256 returned = backBid + backAsk;
        _collect(ref.pool);
        if (liquid + returned < escrow) revert InsufficientLiquidity(escrow, liquid + returned);

        // The venue's lazy refund of this Window's expired quotes lands inside the placement; it is booked as such.
        b.escrowBack += uint128(returned);
        b.escrowOut += uint128(escrow);
        b.quoteCount += 1;
        liquid = liquid + returned - escrow;
        uint256 windowDeployed = deployedOf(marketId);
        if (windowDeployed > p.maxWindowDeployed) revert OverWindowCap(marketId, windowDeployed, p.maxWindowDeployed);
        uint256 tv = totalValue();
        uint256 deployed = tv - liquid;
        if (deployed * BPS > tv * p.maxExposureBps) revert OverExposure(deployed, tv, p.maxExposureBps);
        emit Quoted(marketId, bidYesRaw, askYesRaw, quantityRaw, escrow, bidId, askId);
    }

    /// @notice Cancels every quote the vault has resting on a Window and books what came back. The maker
    ///         may pull any time; anyone may once the Window has expired (its orders are dead weight then).
    function pull(bytes32 marketId) external nonReentrant returns (uint256 orders, uint256 returned) {
        MarketRef memory ref = _resolve(marketId);
        if (msg.sender != maker && block.timestamp < ref.expiry) revert NotMaker(msg.sender);
        (orders, returned) = _pullAll(ref);
        _collect(ref.pool);
        if (returned != 0) {
            _books[marketId].escrowBack += uint128(returned);
            liquid += returned;
        }
        emit Pulled(marketId, orders, returned, msg.sender);
    }

    /// @notice Merges every complete set the vault holds on a Window back into collateral — the spread,
    ///         realized. Anyone may call; the collateral only ever lands in the vault.
    function merge(bytes32 marketId) external nonReentrant returns (uint256 pairs, uint256 returned) {
        MarketRef memory ref = _resolve(marketId);
        (uint256 yes, uint256 no) = _held(ref);
        pairs = yes < no ? yes : no;
        if (pairs == 0) revert NothingToMerge(marketId);
        returned = _merge(ref, marketId, pairs);
        _collect(ref.pool);
        _books[marketId].merged += uint128(returned);
        liquid += returned;
        emit Merged(marketId, pairs, returned, msg.sender);
    }

    /// @notice Settles a Window the venue has resolved or voided: pulls any dead quotes, redeems what the
    ///         vault holds on either side, closes the book. Permissionless; a second call is a no-op.
    function settle(bytes32 marketId) external nonReentrant returns (uint256 payout) {
        WindowBook storage b = _books[marketId];
        if (b.quoteCount == 0) revert NotQuoted(marketId);
        if (b.settled) return 0;
        MarketRef memory ref = _resolve(marketId);
        if (!_isSettled(ref)) revert MarketNotSettled(marketId);

        (, uint256 returned) = _pullAll(ref);
        (uint256 yes, uint256 no) = _held(ref);
        if (yes != 0) payout += _redeem(ref, marketId, 0, yes);
        if (no != 0) payout += _redeem(ref, marketId, 1, no);
        _collect(ref.pool);

        b.escrowBack += uint128(returned);
        b.payout += uint128(payout);
        b.settled = true;
        b.settledAtSec = uint64(block.timestamp);
        liquid += returned + payout;
        _removeOpen(marketId);
        int256 realized = int256(uint256(b.escrowBack) + b.merged + b.payout) - int256(uint256(b.escrowOut));
        emit WindowSettled(marketId, payout, yes, no, realized, msg.sender);
    }

    // ------------------------------------------------------------------ views

    /// @notice Capital the venue still holds for the vault on a Window: resting escrow plus the cost of
    ///         whatever filled and has not been merged or settled. Floored at zero, so the value never
    ///         counts a spread before it is realized.
    function deployedOf(bytes32 marketId) public view returns (uint256) {
        WindowBook storage b = _books[marketId];
        uint256 back = uint256(b.escrowBack) + b.merged + b.payout;
        return b.escrowOut > back ? b.escrowOut - back : 0;
    }

    function totalDeployed() public view returns (uint256 sum) {
        for (uint256 i = 0; i < _open.length; i++) {
            sum += deployedOf(_open[i]);
        }
    }

    function totalValue() public view returns (uint256) {
        return liquid + totalDeployed();
    }

    /// @notice Collateral per share, scaled by `one`; `one` before any supply.
    function sharePriceRaw() external view returns (uint256) {
        return supplyShares == 0 ? one : totalValue() * one / supplyShares;
    }

    function utilizationBps() external view returns (uint256) {
        uint256 tv = totalValue();
        return tv == 0 ? 0 : totalDeployed() * BPS / tv;
    }

    /// @notice The first open Window past its expiry, or zero — what blocks a withdrawal until settled.
    function unsettledExpired() public view returns (bytes32) {
        for (uint256 i = 0; i < _open.length; i++) {
            (,,,,,,,,,,,,, uint64 expiry) = module.markets(_open[i]);
            if (expiry != 0 && expiry <= block.timestamp) return _open[i];
        }
        return bytes32(0);
    }

    function openWindows() external view returns (bytes32[] memory) {
        return _open;
    }

    function bookOf(bytes32 marketId) external view returns (WindowBook memory) {
        return _books[marketId];
    }

    /// @notice What the vault holds on a Window right now, both sides — the inventory its fills left.
    function inventoryOf(bytes32 marketId) external view returns (uint256 yes, uint256 no) {
        return _held(_resolve(marketId));
    }

    function windowCount() external view returns (uint256) {
        return _history.length;
    }

    /// @notice Every Window quoted, oldest first, paged.
    function windowsAt(uint256 offset, uint256 limit) external view returns (bytes32[] memory page) {
        if (offset >= _history.length) return page;
        uint256 end = offset + limit;
        if (end > _history.length) end = _history.length;
        page = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = _history[i];
        }
    }

    // ------------------------------------------------------------------ internals

    function _removeOpen(bytes32 marketId) internal {
        uint256 at = _openAt[marketId];
        if (at == 0) return;
        uint256 last = _open.length - 1;
        if (at - 1 != last) {
            bytes32 moved = _open[last];
            _open[at - 1] = moved;
            _openAt[moved] = at;
        }
        _open.pop();
        delete _openAt[marketId];
    }
}
