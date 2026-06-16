// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {CredentialVerifier} from "../contracts/CredentialVerifier.sol";
import {MayeLendingPool} from "../contracts/LendingPool.sol";
import {MAYEGov} from "../contracts/Tokens/MAYEGov.sol";

contract MAYEGovTest is Test {
    MockERC20 public usdc;
    CredentialVerifier public verifier;
    MayeLendingPool public pool;
    MAYEGov public mayeGov;

    address public owner = address(0x1);
    address public lender1 = address(0x2);
    address public lender2 = address(0x3);
    address public borrower = address(0x4);

    uint256 public teePrivateKey = 0x9999;
    address public teeVerifierAddress;

    uint256 public constant USDC_PRECISION = 1e6;

    function setUp() public {
        teeVerifierAddress = vm.addr(teePrivateKey);

        // Deploy Mock USDC
        usdc = new MockERC20("USD Coin", "USDC", 6);

        // Deploy Credential Verifier
        verifier = new CredentialVerifier(teeVerifierAddress, owner);

        // Deploy MayeLendingPool
        pool = new MayeLendingPool(address(usdc), owner);

        // Deploy MAYEGov with pool as the distributor
        mayeGov = new MAYEGov(owner, address(pool));

        // Setup LendingPool wires
        vm.startPrank(owner);
        pool.setRewardToken(address(mayeGov));
        pool.setCredentialVerifier(address(verifier));
        vm.stopPrank();

        // Mint USDC to Lenders
        usdc.mint(lender1, 100_000 * USDC_PRECISION);
        usdc.mint(lender2, 100_000 * USDC_PRECISION);

        // Label accounts
        vm.label(owner, "Owner");
        vm.label(lender1, "Lender1");
        vm.label(lender2, "Lender2");
        vm.label(teeVerifierAddress, "TEE Enclave");
    }

    // Helper: Simulate off-chain TEE enclave signature generation
    function getTeeSignature(address user, uint8 credentialId, bytes32 payloadHash) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(user, credentialId, payloadHash));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(teePrivateKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }

    // Helper: Verify a credential for a lender/borrower
    function verifyCredential(address user, uint8 credentialId) internal {
        bytes32 payloadHash = keccak256(abi.encodePacked("fresh-metadata-salt", credentialId));
        bytes memory signature = getTeeSignature(user, credentialId, payloadHash);
        
        vm.prank(user);
        verifier.verifyAndRecord(user, credentialId, payloadHash, signature);
    }

    // ============================================================
    // Core Reward Tests
    // ============================================================

    function test_InitialSupply() public view {
        assertEq(mayeGov.totalSupply(), 500_000 * 1e18);
        assertEq(mayeGov.balanceOf(owner), 500_000 * 1e18);
        assertEq(mayeGov.rewardRatePerSecond(), 0);
    }

    function test_AccrualNoRewardsIfRateIsZero() public {
        vm.prank(owner);
        mayeGov.setRewardRate(0);

        vm.prank(lender1);
        usdc.approve(address(pool), 10_000 * USDC_PRECISION);
        vm.prank(lender1);
        pool.deposit(10_000 * USDC_PRECISION);

        skip(100);

        assertEq(mayeGov.getPendingAt(lender1), 0);
    }

    function test_AccrualProportionalToDeposit() public {
        // Set reward rate to 0.1 MAYE/s per dollar unit (where deposit has 18 decimal scale inside MAYE)
        // Let's set it to 1e15 (0.001 MAYE/s per effective stake unit)
        // Rate is per effective stake per second / 1e18.
        // effective stake of 1000 USDC = 1000 * 1e18 (since scale is 1e12).
        // If rewardRatePerSecond = 0.5 * 1e18:
        // accrued = effectiveStake * rate * elapsed / 1e18
        // Let's test the math directly.
        vm.prank(owner);
        mayeGov.setRewardRate(1e12); // 0.000001 MAYE per second per scaled token

        // Lender 1 deposits 10,000 USDC (effective stake: 10,000 * 1e18)
        vm.prank(lender1);
        usdc.approve(address(pool), 10_000 * USDC_PRECISION);
        vm.prank(lender1);
        pool.deposit(10_000 * USDC_PRECISION);

        // Lender 2 deposits 20,000 USDC (effective stake: 20,000 * 1e18)
        vm.prank(lender2);
        usdc.approve(address(pool), 20_000 * USDC_PRECISION);
        vm.prank(lender2);
        pool.deposit(20_000 * USDC_PRECISION);

        skip(10); // 10 seconds pass

        // Lender 1 pending: 10,000 * 1e18 * 1e12 * 10 / 1e18 = 100,000 * 1e12 = 1e17 wei = 0.1 MAYE
        assertEq(mayeGov.getPendingAt(lender1), 1e17);

        // Lender 2 pending: 20,000 * 1e18 * 1e12 * 10 / 1e18 = 200,000 * 1e12 = 2e17 wei = 0.2 MAYE
        assertEq(mayeGov.getPendingAt(lender2), 2e17);
    }

    function test_AccrualWithCredentials() public {
        vm.prank(owner);
        mayeGov.setRewardRate(1e12);

        // Lender 1 verifies 3 credentials (+24% bonus)
        verifyCredential(lender1, 0);
        verifyCredential(lender1, 1);
        verifyCredential(lender1, 2);

        // Lender 2 verifies all 5 credentials (+160% bonus)
        verifyCredential(lender2, 0);
        verifyCredential(lender2, 1);
        verifyCredential(lender2, 2);
        verifyCredential(lender2, 3);
        verifyCredential(lender2, 4);

        // Lender 1 deposits 10,000 USDC (effective stake: 10,000 * 1e18 * 1.24 = 12,400 * 1e18)
        vm.prank(lender1);
        usdc.approve(address(pool), 10_000 * USDC_PRECISION);
        vm.prank(lender1);
        pool.deposit(10_000 * USDC_PRECISION);

        // Lender 2 deposits 10,000 USDC (effective stake: 10,000 * 1e18 * 2.6 = 26,000 * 1e18)
        vm.prank(lender2);
        usdc.approve(address(pool), 10_000 * USDC_PRECISION);
        vm.prank(lender2);
        pool.deposit(10_000 * USDC_PRECISION);

        skip(10);

        // Lender 1 pending: 12,400 * 1e18 * 1e12 * 10 / 1e18 = 124,000 * 1e12 = 1.24e17 wei = 0.124 MAYE
        assertEq(mayeGov.getPendingAt(lender1), 1.24e17);

        // Lender 2 pending: 26,000 * 1e18 * 1e12 * 10 / 1e18 = 260,000 * 1e12 = 2.6e17 wei = 0.26 MAYE
        assertEq(mayeGov.getPendingAt(lender2), 2.6e17);
    }

    function test_AccrualCheckpointOnSecondDeposit() public {
        vm.prank(owner);
        mayeGov.setRewardRate(1e12);

        vm.prank(lender1);
        usdc.approve(address(pool), 30_000 * USDC_PRECISION);

        // 1st Deposit: 10,000 USDC
        vm.prank(lender1);
        pool.deposit(10_000 * USDC_PRECISION);

        skip(10);

        console.log("Before 2nd deposit:");
        console.log("Accrued:", mayeGov.rewardsAccrued(lender1));
        console.log("Last snapshot deposit:", mayeGov.lastSnapshotDeposit(lender1));
        console.log("Pending:", mayeGov.getPendingAt(lender1));

        // Accrued: 10,000 * 1e18 * 1e12 * 10 / 1e18 = 0.1 MAYE
        assertEq(mayeGov.getPendingAt(lender1), 1e17);

        // 2nd Deposit: 20,000 USDC (now total deposit: 30,000 USDC)
        vm.prank(lender1);
        pool.deposit(20_000 * USDC_PRECISION);

        console.log("After 2nd deposit:");
        console.log("Accrued:", mayeGov.rewardsAccrued(lender1));
        console.log("Last snapshot deposit:", mayeGov.lastSnapshotDeposit(lender1));
        console.log("Pending:", mayeGov.getPendingAt(lender1));

        // Immediately after deposit, pending should be the same (checkpointed)
        assertEq(mayeGov.getPendingAt(lender1), 1e17);
        assertEq(mayeGov.rewardsAccrued(lender1), 1e17);

        skip(10);

        // Accrued from new stake: 30,000 * 1e18 * 1e12 * 10 / 1e18 = 0.3 MAYE
        // Total pending = 0.1 + 0.3 = 0.4 MAYE
        assertEq(mayeGov.getPendingAt(lender1), 4e17);
    }

    function test_ClaimRewardMintsTokens() public {
        vm.prank(owner);
        mayeGov.setRewardRate(1e12);

        vm.prank(lender1);
        usdc.approve(address(pool), 10_000 * USDC_PRECISION);
        vm.prank(lender1);
        pool.deposit(10_000 * USDC_PRECISION);

        skip(100);

        uint256 expectedClaim = 10_000 * 1e18 * 1e12 * 100 / 1e18; // 1e18 wei = 1.0 MAYE
        assertEq(mayeGov.getPendingAt(lender1), expectedClaim);

        uint256 balanceBefore = mayeGov.balanceOf(lender1);

        vm.prank(lender1);
        mayeGov.claim();

        uint256 balanceAfter = mayeGov.balanceOf(lender1);
        assertEq(balanceAfter - balanceBefore, expectedClaim);
        assertEq(mayeGov.getPendingAt(lender1), 0); // no pending rewards after claiming
    }

    function test_RewardsPausePreventsAccrual() public {
        vm.prank(owner);
        mayeGov.setRewardRate(1e12);

        vm.prank(lender1);
        usdc.approve(address(pool), 10_000 * USDC_PRECISION);
        vm.prank(lender1);
        pool.deposit(10_000 * USDC_PRECISION);

        skip(10);
        assertEq(mayeGov.getPendingAt(lender1), 1e17);

        // Pause rewards
        vm.prank(owner);
        mayeGov.setRewardsEnabled(false);

        skip(10);
        // Pending should not have changed since rewards are disabled
        assertEq(mayeGov.getPendingAt(lender1), 1e17);

        // Resume rewards
        vm.prank(owner);
        mayeGov.setRewardsEnabled(true);

        skip(10);
        // Should have accrued another 10 seconds (total 20s active accrual)
        assertEq(mayeGov.getPendingAt(lender1), 2e17);
    }

    function test_RewardRateCap() public {
        // MAX_REWARD_RATE is 10 ether (10e18)
        vm.prank(owner);
        vm.expectRevert("Rate exceeds cap");
        mayeGov.setRewardRate(11 ether);
    }
}
