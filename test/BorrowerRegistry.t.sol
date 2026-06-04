// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {BorrowerRegistry} from "../contracts/BorrowerRegistry.sol";
import {ICreditOracle} from "../contracts/interfaces/ICreditOracle.sol";

contract BorrowerRegistryTest is Test {
    BorrowerRegistry public registry;

    address public owner = address(0x1);
    address public borrower1 = address(0x2);
    address public borrower2 = address(0x3);
    address public randomUser = address(0x4);

    function setUp() public {
        registry = new BorrowerRegistry(owner);
        vm.label(owner, "Owner");
        vm.label(borrower1, "Borrower1");
        vm.label(borrower2, "Borrower2");
        vm.label(randomUser, "RandomUser");
    }

    // ============================================================
    // Constructor Tests
    // ============================================================

    function test_Ctor_SetsOwner() public view {
        assertEq(registry.owner(), owner);
    }

    function test_Ctor_EmptyRegistry() public view {
        BorrowerRegistry.BorrowerProfile memory profile = registry.getProfile(borrower1);
        assertEq(profile.borrower, address(0));
        assertEq(profile.totalLoansTaken, 0);
        assertEq(profile.totalAmountBorrowed, 0);
    }

    // ============================================================
    // Register Borrower Tests
    // ============================================================

    function test_Register_CreatesProfile() public {
        vm.prank(borrower1);
        registry.registerBorrower();
        BorrowerRegistry.BorrowerProfile memory profile = registry.getProfile(borrower1);

        assertEq(profile.borrower, borrower1);
        assertEq(profile.totalLoansTaken, 0);
        assertEq(profile.totalAmountBorrowed, 0);
        assertEq(profile.totalRepaid, 0);
        assertEq(profile.latestCreditScore, 0);
        assertFalse(profile.isBanned);
    }

    function test_Register_EmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit BorrowerRegistry.BorrowerRegistered(borrower1);

        vm.prank(borrower1);
        registry.registerBorrower();
    }

    // ============================================================
    // Record Loan Tests
    // ============================================================

    function test_RecordLoan_IncrementsLoansTaken() public {
        vm.prank(borrower1);
        registry.registerBorrower();
        uint256 loanId = 1;
        uint256 amount = 5_000 * 1e6;

        vm.prank(owner);
        registry.recordLoan(borrower1, loanId, amount);

        BorrowerRegistry.BorrowerProfile memory profile = registry.getProfile(borrower1);
        assertEq(profile.totalLoansTaken, 1);
    }

    // ============================================================
    // Record Repayment Tests
    // ============================================================

    function test_RecordRepayment_AddsToTotalRepaid() public {
        vm.prank(borrower1);
        registry.registerBorrower();

        vm.prank(owner);
        registry.recordLoan(borrower1, 1, 5_000 * 1e6);

        vm.prank(owner);
        registry.recordRepayment(borrower1, 2_500 * 1e6);

        BorrowerRegistry.BorrowerProfile memory profile = registry.getProfile(borrower1);
        assertEq(profile.totalRepaid, 2_500 * 1e6);
    }

    // ============================================================
    // Credit Score Tests
    // ============================================================

    function test_UpdateCreditScore_SetsScore() public {
        uint256 score = 720;

        vm.prank(owner);
        registry.updateCreditScore(borrower1, score, ICreditOracle.ScoreTier.NEAR_PRIME, bytes32(0));

        BorrowerRegistry.BorrowerProfile memory profile = registry.getProfile(borrower1);
        assertEq(profile.latestCreditScore, score);
        
        assertEq(registry.getScore(borrower1), score);
    }

    function test_UpdateCreditScore_RejectsInvalidAbove1000() public {
        vm.expectRevert("Invalid score");
        vm.prank(owner);
        registry.updateCreditScore(borrower1, 1001, ICreditOracle.ScoreTier.INVALID, bytes32(0));
    }

    function test_UpdateCreditScore_AcceptsZeroScore() public {
        vm.prank(owner);
        registry.updateCreditScore(borrower1, 0, ICreditOracle.ScoreTier.INVALID, bytes32(0));

        BorrowerRegistry.BorrowerProfile memory profile = registry.getProfile(borrower1);
        assertEq(profile.latestCreditScore, 0);
    }

    function test_UpdateCreditScore_AcceptsMaxScore() public {
        vm.prank(owner);
        registry.updateCreditScore(borrower1, 1000, ICreditOracle.ScoreTier.PRIME, bytes32(0));

        BorrowerRegistry.BorrowerProfile memory profile = registry.getProfile(borrower1);
        assertEq(profile.latestCreditScore, 1000);
    }

    function test_UpdateCreditScore_EmitsEvent() public {
        vm.expectEmit(true, false, false, false);
        emit ICreditOracle.CreditScoreUpdated(borrower1, 680, ICreditOracle.ScoreTier.NEAR_PRIME, block.timestamp);

        vm.prank(owner);
        registry.updateCreditScore(borrower1, 680, ICreditOracle.ScoreTier.NEAR_PRIME, bytes32(0));
    }

    function test_UpdateCreditScore_OnlyOwner() public {
        vm.expectRevert();
        vm.prank(randomUser);
        registry.updateCreditScore(borrower1, 700, ICreditOracle.ScoreTier.NEAR_PRIME, bytes32(0));
    }

    function test_UpdateCreditScore_UpdatesExisting() public {
        vm.prank(owner);
        registry.updateCreditScore(borrower1, 600, ICreditOracle.ScoreTier.SUBPRIME, bytes32(0));

        BorrowerRegistry.BorrowerProfile memory p1 = registry.getProfile(borrower1);
        assertEq(p1.latestCreditScore, 600);

        // Update to higher score
        vm.prank(owner);
        registry.updateCreditScore(borrower1, 750, ICreditOracle.ScoreTier.PRIME, bytes32(0));

        BorrowerRegistry.BorrowerProfile memory p2 = registry.getProfile(borrower1);
        assertEq(p2.latestCreditScore, 750);
    }

    // ============================================================
    // Eligibility Tests
    // ============================================================

    function test_IsEligible_FalseForUnregisteredAddress() public view {
        assertFalse(registry.isEligible(borrower1));
    }

    function test_IsEligible_TrueForRegisteredAndNotBanned() public {
        vm.prank(borrower1);
        registry.registerBorrower();
        assertTrue(registry.isEligible(borrower1));
    }

    function test_IsEligible_FalseForBannedBorrower() public {
        vm.prank(borrower1);
        registry.registerBorrower();

        vm.prank(owner);
        registry.setBanStatus(borrower1, true);

        assertFalse(registry.isEligible(borrower1));
    }
}
