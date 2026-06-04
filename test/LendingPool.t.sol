// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockCreditOracle} from "./mocks/MockCreditOracle.sol";
import {MayeLendingPool} from "../contracts/LendingPool.sol";

contract LendingPoolTest is Test {
    MockERC20 public usdc;
    MockCreditOracle public oracle;
    MayeLendingPool public pool;

    address public owner = address(0x1);
    address public lender1 = address(0x2);
    address public lender2 = address(0x3);
    address public borrower1 = address(0x4);
    address public borrower2 = address(0x5);
    address public randomUser = address(0x6);

    uint256 public constant USDC_PRECISION = 1e6;

    // ============================================================
    // Setup helpers
    // ============================================================

    function setupPool() internal {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        oracle = new MockCreditOracle();
        pool = new MayeLendingPool(address(usdc), owner);
        usdc.mint(lender1, 100_000 * USDC_PRECISION);
        usdc.mint(lender2, 50_000 * USDC_PRECISION);
        usdc.mint(borrower1, 20_000 * USDC_PRECISION);
        usdc.mint(borrower2, 20_000 * USDC_PRECISION);
        vm.label(owner, "Owner");
        vm.label(lender1, "Lender1");
        vm.label(lender2, "Lender2");
        vm.label(borrower1, "Borrower1");
        vm.label(borrower2, "Borrower2");
        vm.label(randomUser, "RandomUser");
    }

    function setupOracle() internal {
        oracle.setScore(borrower1, 750);
        vm.prank(owner);
        pool.setCreditOracle(address(oracle));
    }

    // Helper: approve + deposit from a given lender (both pranked)
    function _deposit(address lender, uint256 amount) internal {
        vm.prank(lender);
        usdc.approve(address(pool), amount);
        vm.prank(lender);
        pool.deposit(amount);
    }

    // Helper: setup a pool with USDC deposited by lender1 for borrowing
    function _setupBorrow() internal {
        setupPool();
        _deposit(lender1, 100_000 * USDC_PRECISION);
        setupOracle();
    }

    function calcRepay(uint256 principal, uint256 annualRateBps) pure internal returns (uint256) {
        return principal + (principal * annualRateBps) / 10000;
    }

    // ============================================================
    // Constructor Tests
    // ============================================================

    function test_Ctor_ReceivesCorrectToken() public {
        setupPool();
        assertEq(address(pool.lendingToken()), address(usdc));
    }

    function test_Ctor_SetsOwnerCorrectly() public {
        setupPool();
        assertEq(pool.owner(), owner);
    }

    function test_Ctor_DefaultPoolConfig() public {
        setupPool();
        (uint256 ms, uint256 ml, uint256 br, uint256 ist, uint256 mld, uint256 mxd) = pool.poolConfig();
        assertEq(ms, 580);
        assertEq(ml, 10_000_000_000);
        assertEq(br, 1200);
        assertEq(ist, 200);
        assertEq(mld, 7 days);
        assertEq(mxd, 365 days);
    }

    function test_Ctor_TotalDepositsIsZero() public {
        setupPool();
        assertEq(pool.totalDeposits(), 0);
    }

    function test_Ctor_TotalBorrowsIsZero() public {
        setupPool();
        assertEq(pool.totalBorrows(), 0);
    }

    // ============================================================
    // Deposit Tests
    // ============================================================

    function test_Deposit_AddsToFunds() public {
        setupPool();
        _deposit(lender1, 10_000 * USDC_PRECISION);
        assertEq(pool.getDeposit(lender1), 10_000 * USDC_PRECISION);
        assertEq(pool.totalDeposits(), 10_000 * USDC_PRECISION);
    }

    function test_Deposit_EmitsDepositEvent() public {
        setupPool();
        uint256 amount = 5_000 * USDC_PRECISION;
        vm.prank(lender1);
        usdc.approve(address(pool), amount); // pre-approve
        vm.expectEmit(true, false, false, true);
        emit MayeLendingPool.Deposit(lender1, amount);
        vm.prank(lender1);
        pool.deposit(amount);
    }

    function test_Deposit_EmitsDepositEvent_NoPrank() public {
        setupPool();
        // Without prank, msg.sender is test contract which has no USDC → revert
        vm.expectRevert();
        pool.deposit(5_000 * USDC_PRECISION);
    }

    function test_Deposit_AllowsMultipleDeposits() public {
        setupPool();
        _deposit(lender1, 3_000 * USDC_PRECISION);
        _deposit(lender1, 7_000 * USDC_PRECISION);
        assertEq(pool.getDeposit(lender1), 10_000 * USDC_PRECISION);
    }

    function test_Deposit_RejectsZeroAmount() public {
        setupPool();
        // msg.sender is test contract, which has no USDC - but amount=0 should revert before balance check
        vm.expectRevert("Amount must be > 0");
        pool.deposit(0);
    }

    function test_Deposit_UsesApproval() public {
        setupPool();
        // lender1 has 0 USDC (not minted for deposit) → fails
        usdc.mint(lender1, 5_000 * USDC_PRECISION);
        vm.expectRevert();
        vm.prank(lender1);
        pool.deposit(5_000 * USDC_PRECISION);
    }

    function test_Deposit_AccumulatesPerLender() public {
        setupPool();
        _deposit(lender1, 5_000 * USDC_PRECISION);
        assertEq(pool.getDeposit(lender1), 5_000 * USDC_PRECISION);
        _deposit(lender1, 7_000 * USDC_PRECISION);
        assertEq(pool.getDeposit(lender1), 12_000 * USDC_PRECISION);
    }

    // ============================================================
    // Withdraw Tests
    // ============================================================

    function test_Withdraw_AllowsFullWithdrawal() public {
        setupPool();
        _deposit(lender1, 10_000 * USDC_PRECISION);
        vm.prank(lender1);
        pool.withdraw(10_000 * USDC_PRECISION);
        assertEq(pool.getDeposit(lender1), 0);
    }

    function test_Withdraw_AllowsPartialWithdrawal() public {
        setupPool();
        _deposit(lender1, 10_000 * USDC_PRECISION);
        vm.prank(lender1);
        pool.withdraw(3_000 * USDC_PRECISION);
        assertEq(pool.getDeposit(lender1), 7_000 * USDC_PRECISION);
    }

    function test_Withdraw_EmitsWithdrawalEvent() public {
        setupPool();
        _deposit(lender1, 5_000 * USDC_PRECISION);
        uint256 amount = 3_000 * USDC_PRECISION;
        vm.expectEmit(true, false, false, true);
        emit MayeLendingPool.Withdrawal(lender1, amount);
        vm.prank(lender1);
        pool.withdraw(amount);
    }

    function test_Withdraw_RejectsZeroAmount() public {
        setupPool();
        vm.expectRevert("Amount must be > 0");
        pool.withdraw(0);
    }

    function test_Withdraw_RejectsInsufficientBalance() public {
        setupPool();
        _deposit(lender1, 5_000 * USDC_PRECISION);
        vm.expectRevert("Insufficient balance");
        vm.prank(lender1);
        pool.withdraw(6_000 * USDC_PRECISION);
    }

    function test_Withdraw_RemovesFromTotalDeposits() public {
        setupPool();
        _deposit(lender1, 10_000 * USDC_PRECISION);
        vm.prank(lender1);
        pool.withdraw(4_000 * USDC_PRECISION);
        assertEq(pool.totalDeposits(), 6_000 * USDC_PRECISION);
    }

    function test_Withdraw_NotALenderCanStillTry() public {
        setupPool();
        // randomUser has no deposit — direct call from randomUser
        vm.expectRevert("Insufficient balance");
        vm.prank(randomUser);
        pool.withdraw(50 * USDC_PRECISION);
    }

    // ============================================================
    // Borrow Tests
    // ============================================================

    function test_Borrow_SucceedsWithValidScore() public {
        _setupBorrow();
        uint256 principal = 5_000; // 5,000 (raw), maxLoanAmount = 50,000,000
        uint256 duration = 90 days;
        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(principal, duration);

        (address b,, uint256 rate,, uint256 dt,,) = pool.loans(loanId);
        assertEq(b, borrower1);
        assertEq(rate, 1200); // prime score gets base rate
        assertGt(dt, 0);
    }

    function test_Borrow_RejectsLowCreditScore() public {
        _setupBorrow();
        oracle.setScore(borrower1, 500); // Below 580
        vm.expectRevert("Credit score too low");
        vm.prank(borrower1);
        pool.applyAndBorrow(1_000, 30 days);
    }

    function test_Borrow_RejectsZeroPrincipal() public {
        _setupBorrow();
        vm.expectRevert("Invalid loan amount");
        vm.prank(borrower1);
        pool.applyAndBorrow(0, 30 days);
    }

    function test_Borrow_RejectsAmountExceedingMax() public {
        _setupBorrow();
        // maxLoanAmount = 10_000_000_000 (10,000 USDC)
        vm.expectRevert("Invalid loan amount");
        vm.prank(borrower1);
        pool.applyAndBorrow(11_000_000_000, 30 days);
    }

    function test_Borrow_RejectsDurationTooShort() public {
        _setupBorrow();
        vm.expectRevert("Invalid duration");
        vm.prank(borrower1);
        pool.applyAndBorrow(1_000, 3 days); // valid amount, invalid duration
    }

    function test_Borrow_RejectsDurationTooLong() public {
        _setupBorrow();
        vm.expectRevert("Invalid duration");
        vm.prank(borrower1);
        pool.applyAndBorrow(1_000, 400 days); // valid amount, invalid duration
    }

    function test_Borrow_TransfersUSDCtoBorrower() public {
        _setupBorrow();
        uint256 principal = 1_000;
        vm.prank(borrower1);
        pool.applyAndBorrow(principal, 30 days);
        assertEq(usdc.balanceOf(borrower1), 20_000 * USDC_PRECISION + principal);
    }

    function test_Borrow_IncrementsLoanCounter() public {
        _setupBorrow();
        vm.prank(borrower1);
        pool.applyAndBorrow(1_000, 30 days);
        assertEq(pool.loanCounter(), 1);

        oracle.setScore(borrower2, 750);
        vm.prank(borrower2);
        pool.applyAndBorrow(500, 60 days);
        assertEq(pool.loanCounter(), 2);
    }

    function test_Borrow_IncreasesTotalBorrows() public {
        _setupBorrow();
        assertEq(pool.totalBorrows(), 0);

        uint256 principal = 2_000;
        vm.prank(borrower1);
        pool.applyAndBorrow(principal, 30 days);
        assertEq(pool.totalBorrows(), principal);
    }

    function test_Borrow_EmitsLoanCreatedEvent() public {
        _setupBorrow();
        uint256 principal = 3_000;
        uint256 duration = 30 days;

        vm.expectEmit(true, true, false, true);
        emit MayeLendingPool.LoanCreated(1, borrower1, principal, 1200, block.timestamp + duration);

        vm.prank(borrower1);
        pool.applyAndBorrow(principal, duration);
    }

    // ============================================================
    // Repayment Tests
    // ============================================================

    function test_RepaysLoanInFull() public {
        _setupBorrow();
        uint256 principal = 1_000;
        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(principal, 30 days);

        vm.prank(borrower1);
        usdc.approve(address(pool), calcRepay(principal, 1200));
        vm.prank(borrower1);
        pool.repay(loanId);

        (,,, , , , MayeLendingPool.LoanStatus finalLS) = pool.loans(loanId);
        assertEq(uint256(finalLS), uint256(MayeLendingPool.LoanStatus.REPAYED));
    }

    function test_RepaysEmitLoanRepayedEvent() public {
        _setupBorrow();
        uint256 principal = 1_000;
        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(principal, 30 days);

        uint256 expectedRepay = calcRepay(principal, 1200);
        vm.prank(borrower1);
        usdc.approve(address(pool), expectedRepay);

        vm.expectEmit(true, true, false, true);
        emit MayeLendingPool.LoanRepayed(loanId, borrower1, expectedRepay);

        vm.prank(borrower1);
        pool.repay(loanId);
    }

    function test_Repays_ReduceTotalBorrows() public {
        _setupBorrow();
        uint256 principal = 2_000;
        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(principal, 30 days);

        assertEq(pool.totalBorrows(), principal);

        vm.prank(borrower1);
        usdc.approve(address(pool), calcRepay(principal, 1200));
        vm.prank(borrower1);
        pool.repay(loanId);
        assertEq(pool.totalBorrows(), 0);
    }

    function test_Repays_RejectsNonOwner() public {
        _setupBorrow();
        uint256 principal = 1_000;
        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(principal, 30 days);

        vm.prank(borrower1);
        usdc.approve(address(pool), calcRepay(principal, 1200));
        vm.expectRevert("Not your loan");
        vm.prank(randomUser);
        pool.repay(loanId);
    }

    function test_Repays_RejectsInactiveLoan() public {
        _setupBorrow();
        uint256 principal = 1_000;
        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(principal, 30 days);

        vm.prank(borrower1);
        usdc.approve(address(pool), calcRepay(principal, 1200));
        vm.prank(borrower1);
        pool.repay(loanId);

        vm.expectRevert("Loan not active");
        vm.prank(borrower1);
        pool.repay(loanId);
    }

    function test_Repays_RejectsNonExistentLoan() public {
        _setupBorrow();
        // No approval — borrower == address(0) for non-existent loan → "Not your loan"
        vm.expectRevert("Not your loan");
        vm.prank(randomUser);
        pool.repay(999);
    }

    function test_Repays_TransferFromRequiresApproval() public {
        setupPool();
        _deposit(lender1, 100 * USDC_PRECISION);
        setupOracle();
        vm.prank(borrower1);
        uint256 lid = pool.applyAndBorrow(1_000, 30 days);

        // borrower1 has USDC balance (minted in setupPool) but zero approval for pool
        vm.expectRevert(); // transferFrom fails: allowance = 0
        vm.prank(borrower1);
        pool.repay(lid);
    }

    // ============================================================
    // Interest Rate Tests
    // ============================================================

    function _calcRate(uint256 score) internal view returns (uint256 rate) {
        (, , uint256 baseIR, uint256 IRStep,,) = pool.poolConfig();
        rate = baseIR;
        if (score < 720) rate += IRStep * ((720 - score) / 40);
    }

    function test_InterestRate_PrimeScoreGetsBaseRate() public {
        setupPool();
        uint256 rate = _calcRate(750);
        assertEq(rate, 1200);
    }

    function test_InterestRate_NearPrimeScoreGetsPenalty() public {
        setupPool();
        assertEq(_calcRate(719), 1200);
        assertEq(_calcRate(718), 1200);
        assertEq(_calcRate(680), 1400); // +200 bps (6 tiers of 40 = score < 680)
        assertEq(_calcRate(679), 1400);
    }

    function test_InterestRate_SubprimeGetsHigherPenalty() public {
        setupPool();
        assertEq(_calcRate(639), 1600); // +400 bps
        assertEq(_calcRate(580), 1800); // +600 bps (min score)
    }

    function test_CalcRepayment_SimpleInterestCorrect() public pure {
        assertEq(calcRepay(1_000, 1200), 1120);
    }

    function test_CalcRepayment_HigherRateMoreRepayment() public pure {
        uint256 baseRepay = calcRepay(1000, 1200);
        uint256 highRepay = calcRepay(1000, 1800);
        assertGt(highRepay, baseRepay);
    }

    function test_CalcRepayment_ExactFormula() public pure {
        assertEq(calcRepay(5000, 1400), 5700);
    }

    // ============================================================
    // Pool Stats Tests
    // ============================================================

    function test_AvailableLiquidity_ReturnsCorrectValue() public {
        setupPool();
        _deposit(lender1, 100_000 * USDC_PRECISION);
        assertEq(pool.availableLiquidity(), 100_000 * USDC_PRECISION);
    }

    function test_AvailableLiquidity_ReducedAfterBorrow() public {
        setupPool();
        // Deposit an amount that covers the pool needs
        _deposit(lender1, 10_000 * USDC_PRECISION); // 10M units
        oracle.setScore(borrower1, 750);
        vm.prank(owner);
        pool.setCreditOracle(address(oracle));

        uint256 borrowed = 100;
        vm.prank(borrower1);
        pool.applyAndBorrow(borrowed, 30 days);
        // availableLiquidity = totalDeposits - totalBorrows
        assertEq(pool.availableLiquidity(), 10_000 * USDC_PRECISION - borrowed);
    }

    function test_GetPoolStats_ReturnsAllFourValues() public {
        setupPool();
        _deposit(lender1, 50 * USDC_PRECISION);
        _deposit(lender2, 30 * USDC_PRECISION);

        oracle.setScore(borrower1, 750);
        vm.prank(owner);
        pool.setCreditOracle(address(oracle));

        uint256 borrowed = 2_000; // Small loan within maxLoanAmount of 50M
        vm.prank(borrower1);
        pool.applyAndBorrow(borrowed, 30 days);

        (uint256 dep, uint256 bor, uint256 liq, uint256 active) = pool.getPoolStats();
        assertEq(dep, 80 * USDC_PRECISION);
        assertEq(bor, borrowed);
        assertEq(liq, 80 * USDC_PRECISION - borrowed);
        assertEq(active, 1);
    }

    // ============================================================
    // Admin Function Tests
    // ============================================================

    function test_SetOracle_CanOnlyBeOwner() public {
        setupPool();
        vm.expectRevert();
        vm.prank(randomUser);
        pool.setCreditOracle(address(oracle));
    }

    function test_SetOracle_SetsCorrectAddress() public {
        setupPool();
        vm.prank(owner);
        pool.setCreditOracle(address(oracle));
        assertEq(address(pool.creditOracle()), address(oracle));
    }

    function test_SetOracle_RejectsZeroAddress() public {
        setupPool();
        vm.expectRevert("Zero address");
        vm.prank(owner);
        pool.setCreditOracle(address(0));
    }

    function test_SetOracle_EmitsEvent() public {
        setupPool();
        vm.expectEmit(false, false, false, true);
        emit MayeLendingPool.CreditOracleSet(address(oracle));
        vm.prank(owner);
        pool.setCreditOracle(address(oracle));
    }

    function test_UpdatePoolConfig_CanOnlyBeOwner() public {
        setupPool();
        vm.expectRevert();
        vm.prank(randomUser);
        pool.updatePoolConfig(MayeLendingPool.PoolConfig({
            minCreditScore: 600, maxLoanAmount: 75_000_000,
            baseInterestRate: 1000, interestRateStep: 300,
            minLoanDuration: 14 days, maxLoanDuration: 180 days
        }));
    }

    function test_UpdatePoolConfig_UpdatesValues() public {
        setupPool();
        vm.prank(owner);
        pool.updatePoolConfig(MayeLendingPool.PoolConfig({
            minCreditScore: 600, maxLoanAmount: 75_000_000,
            baseInterestRate: 1000, interestRateStep: 300,
            minLoanDuration: 14 days, maxLoanDuration: 180 days
        }));

        (uint256 ms, uint256 ml, uint256 br, uint256 ist, uint256 mld, uint256 mxd) = pool.poolConfig();
        assertEq(ms, 600);
        assertEq(ml, 75_000_000);
        assertEq(br, 1000);
        assertEq(ist, 300);
        assertEq(mld, 14 days);
        assertEq(mxd, 180 days);
    }

    function test_UpdatePoolConfig_EmitsEvent() public {
        setupPool();
        (uint256 ms, uint256 ml, uint256 br, uint256 ist, uint256 mld, uint256 mxd) = pool.poolConfig();
        MayeLendingPool.PoolConfig memory current = MayeLendingPool.PoolConfig(ms, ml, br, ist, mld, mxd);

        vm.expectEmit(false, false, false, true);
        emit MayeLendingPool.PoolConfigUpdated(current);

        vm.prank(owner);
        pool.updatePoolConfig(current);
    }

    // ============================================================
    // View Function Tests
    // ============================================================

    function test_GetDeposit_UnknownAddress() public {
        setupPool();
        assertEq(pool.getDeposit(randomUser), 0);
    }

    function test_GetDeposit_KnownAddressAfterZeroDeposit() public {
        setupPool();
        assertEq(pool.getDeposit(lender1), 0);
    }

    // ============================================================
    // Fuzz Tests
    // ============================================================

    function test_Fuzz_DepositWithdraw(uint256 depositAmount) public {
        setupPool();
        uint256 capped = bound(depositAmount, 1, 10_000 * USDC_PRECISION);
        _deposit(lender1, capped);
        assertEq(pool.getDeposit(lender1), capped);
        vm.prank(lender1);
        pool.withdraw(capped);
        assertEq(pool.getDeposit(lender1), 0);
    }

    function test_Fuzz_BorrowInterest(uint256 score) public {
        setupPool();
        uint256 capped = bound(score, 580, 850);
        uint256 rate = _calcRate(capped);
        assertGt(rate, 0);
        assertLe(rate, 1800);
    }

    function test_Fuzz_RepaymentAmount(uint256 principalAmt, uint256 rate) public pure {
        uint256 p = bound(principalAmt, 10_000 * USDC_PRECISION, 100_000 * USDC_PRECISION);
        uint256 r = bound(rate, 1200, 2000);
        uint256 repayment = calcRepay(p, r);
        assertGt(repayment, p);
    }
}
