// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import {IEventVault} from "../src/vault/IEventVault.sol";
import {VaultTestBase} from "./VaultTestBase.sol";

contract EventVaultFundingTest is VaultTestBase {
    function test_deposit_withdraw_roundTrip() public {
        depositAs(owner, DEPOSIT);
        assertEq(available(owner), DEPOSIT);
        vm.prank(owner);
        vault.withdraw(400 * ONE);
        assertEq(available(owner), 600 * ONE);
        assertEq(coll.balanceOf(owner), 10_000 * ONE - 600 * ONE);
        IEventVault.Account memory a = vault.accountOf(owner);
        assertEq(a.totalDeposited, DEPOSIT);
        assertEq(a.totalWithdrawn, 400 * ONE);
    }

    function test_withdraw_refusesMoreThanAvailable() public {
        depositAs(owner, DEPOSIT);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.Insufficient.selector, DEPOSIT + 1, DEPOSIT));
        vault.withdraw(DEPOSIT + 1);
    }

    function test_zeroAmountsRefused() public {
        vm.startPrank(owner);
        vm.expectRevert(IEventVault.ZeroAmount.selector);
        vault.deposit(0);
        vm.expectRevert(IEventVault.ZeroAmount.selector);
        vault.withdraw(0);
        vm.stopPrank();
    }

    function test_privateBucket() public {
        depositAs(owner, DEPOSIT);
        vm.startPrank(owner);
        vault.moveToPrivate(300 * ONE);
        assertEq(available(owner), 700 * ONE);
        assertEq(vault.accountOf(owner).privateAvailable, 300 * ONE);
        vault.withdrawPrivate(300 * ONE);
        vm.stopPrank();
        assertEq(vault.accountOf(owner).privateAvailable, 0);
        assertEq(coll.balanceOf(owner), 10_000 * ONE - 700 * ONE);
    }

    function test_creditFor_pullsFromCaller() public {
        coll.mint(stranger, 50 * ONE);
        vm.startPrank(stranger);
        coll.approve(address(vault), 50 * ONE);
        vault.creditFor(owner, 20 * ONE);
        vault.creditPrivateFor(owner, 30 * ONE);
        vm.stopPrank();
        assertEq(available(owner), 20 * ONE);
        assertEq(vault.accountOf(owner).privateAvailable, 30 * ONE);
        assertEq(coll.balanceOf(stranger), 0);
    }

    function test_grant_movesBudgetAndReplacesPrevious() public {
        depositAs(owner, DEPOSIT);
        uint256 first = grantStrategy(200 * ONE, caps(10 * ONE, 100 * ONE, 5, 0));
        assertEq(available(owner), 800 * ONE);
        uint256 second = grantStrategy(300 * ONE, caps(10 * ONE, 100 * ONE, 5, 0));
        assertEq(second, first + 1);
        assertTrue(vault.grantOf(first).revoked);
        assertEq(vault.grantOf(first).budget, 0);
        assertEq(available(owner), 700 * ONE, "old budget returned before the new one is taken");
        assertEq(vault.activeGrantOf(owner, IEventVault.GrantKind.STRATEGY), second);
    }

    function test_grant_refusesPastExpiryAndZeroActor() public {
        depositAs(owner, DEPOSIT);
        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.BadExpiry.selector, uint64(block.timestamp)));
        vault.grant(IEventVault.GrantKind.SESSION, actor, caps(1, 1, 1, 0), uint64(block.timestamp), 0);
        vm.expectRevert(IEventVault.ZeroActor.selector);
        vault.grant(IEventVault.GrantKind.SESSION, address(0), caps(1, 1, 1, 0), uint64(block.timestamp + 1), 0);
        vm.stopPrank();
    }

    function test_revoke_returnsBudget_onlyOwner() public {
        depositAs(owner, DEPOSIT);
        uint256 id = grantStrategy(200 * ONE, caps(10 * ONE, 100 * ONE, 5, 0));
        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.NotGrantOwner.selector, id, stranger));
        vault.revoke(id);
        vm.prank(owner);
        vault.revoke(id);
        assertEq(available(owner), DEPOSIT);
        assertFalse(vault.isGrantLive(id));
    }

    function test_fundGrant_topsUpLiveGrantOnly() public {
        depositAs(owner, DEPOSIT);
        uint256 id = grantStrategy(100 * ONE, caps(10 * ONE, 100 * ONE, 5, 0));
        vm.prank(owner);
        vault.fundGrant(id, 50 * ONE);
        assertEq(vault.grantOf(id).budget, 150 * ONE);
        vm.warp(block.timestamp + 2 days);
        uint64 expiresAt = vault.grantOf(id).expiresAtSec;
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(IEventVault.GrantExpired.selector, id, expiresAt));
        vault.fundGrant(id, 1);
    }

    function test_depositAndGrant_isOneTransaction() public {
        vm.prank(owner);
        uint256 id = vault.depositAndGrant(500 * ONE, IEventVault.GrantKind.SESSION, actor, caps(5 * ONE, 50 * ONE, 3, 0), uint64(block.timestamp + 1 hours), 200 * ONE);
        assertEq(available(owner), 300 * ONE);
        assertEq(vault.grantOf(id).budget, 200 * ONE);
        assertEq(uint8(vault.grantOf(id).kind), uint8(IEventVault.GrantKind.SESSION));
    }

    // --- ERC-2771: sponsored calls act for the signer; deposits refuse the forwarder ---

    function _signedRequest(uint256 signerKey, bytes memory data) internal view returns (ERC2771Forwarder.ForwardRequestData memory req) {
        address from = vm.addr(signerKey);
        req = ERC2771Forwarder.ForwardRequestData({
            from: from,
            to: address(vault),
            value: 0,
            gas: 1_000_000,
            deadline: uint48(block.timestamp + 1 hours),
            data: data,
            signature: ""
        });
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint48 deadline,bytes data)"),
                req.from,
                req.to,
                req.value,
                req.gas,
                forwarder.nonces(from),
                req.deadline,
                keccak256(req.data)
            )
        );
        bytes32 domain = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("Masayume"),
                keccak256("1"),
                block.chainid,
                address(forwarder)
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, keccak256(abi.encodePacked("\x19\x01", domain, structHash)));
        req.signature = abi.encodePacked(r, s, v);
    }

    function test_forwarder_withdrawPaysTheSigner() public {
        uint256 key = 0xA11CE;
        address signer = vm.addr(key);
        coll.mint(signer, DEPOSIT);
        vm.startPrank(signer);
        coll.approve(address(vault), DEPOSIT);
        vault.deposit(DEPOSIT);
        vm.stopPrank();

        ERC2771Forwarder.ForwardRequestData memory req = _signedRequest(key, abi.encodeCall(vault.withdraw, (DEPOSIT)));
        vm.prank(stranger); // the relayer pays gas; the signer is who acts
        forwarder.execute(req);
        assertEq(coll.balanceOf(signer), DEPOSIT);
        assertEq(coll.balanceOf(stranger), 0, "the relayer received nothing");
    }

    function test_forwarder_cannotDeposit() public {
        uint256 key = 0xB0B;
        address signer = vm.addr(key);
        coll.mint(signer, DEPOSIT);
        vm.prank(signer);
        coll.approve(address(vault), DEPOSIT);
        ERC2771Forwarder.ForwardRequestData memory req = _signedRequest(key, abi.encodeCall(vault.deposit, (DEPOSIT)));
        vm.prank(stranger);
        vm.expectRevert(); // the forwarder surfaces the vault's NoDepositViaForwarder as a failed request
        forwarder.execute(req);
        assertEq(available(signer), 0);
    }
}
