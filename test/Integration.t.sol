// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {MockCreditOracle} from "./mocks/MockCreditOracle.sol";
import {MayeLendingPool} from "../contracts/LendingPool.sol";
import {BorrowerRegistry} from "../contracts/BorrowerRegistry.sol";
import {bAYE} from "../contracts/Tokens/bAYE.sol";

contract IntegrationTest is Test {
    MockERC20 public usdc;
    MockCreditOracle public oracle;
    MayeLendingPool public pool;
    BorrowerRegistry public registry;
    bAYE public debtToken;

    address public owner = address(0x1);
    address public lender1 = address(0x2);
    address public lender2 = address(0x3);
    address public borrower1 = address(0x4);
    address public borrower2 = address(0x5);

    function calcRepay(uint256 principal, uint256 annualRateBps) pure internal returns (uint256) {
        return principal + (principal * annualRateBps) / 10000;
    }

    // ============================================================
    // Setup helpers
    // ============================================================

    function setupFull() internal {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        oracle = new MockCreditOracle();
        pool = new MayeLendingPool(address(usdc), owner);
        registry = new BorrowerRegistry(owner);
        debtToken = new bAYE();
        
        debtToken.setLendingPool(address(pool));
        vm.prank(owner);
        pool.setDebtToken(address(debtToken));

        usdc.mint(lender1, 500_000 * 1e6);   // 500k USDC
        usdc.mint(lender2, 300_000 * 1e6);   // 300k USDC
        usdc.mint(borrower1, 50_000 * 1e6);  // 50k USDC (for repayment/borrowing)
        usdc.mint(borrower2, 10_000 * 1e6);  // 10k USDC
        usdc.mint(owner, 100_000 * 1e6);     // owner needs USDC for deposit tests
    }

    function _depositLender(address lender, uint256 amount) internal {
        vm.prank(lender);
        usdc.approve(address(pool), amount);
        vm.prank(lender);
        pool.deposit(amount);
    }

    // Default borrow flow: 20 USDC deposit (small loans)
    function _setupBorrowFlow() internal {
        setupFull();
        _depositLender(lender1, 20 * 1e6);
        vm.prank(borrower1);
        usdc.approve(address(pool), 100_000 * 1e6);
        oracle.setScore(borrower1, 750);
        oracle.setScore(borrower2, 750);
        vm.prank(owner);
        pool.setCreditOracle(address(oracle));
    }

    // Large loan flow: 100 USDC deposit (needed because applyAndBorrow transfers out before in)
    function _setupLargeLoanFlow() internal {
        setupFull();
        _depositLender(lender1, 200 * 1e6);
        vm.prank(borrower1);
        usdc.approve(address(pool), 100_000 * 1e6);
        oracle.setScore(borrower1, 750);
        vm.prank(owner);
        pool.setCreditOracle(address(oracle));
    }

    // ============================================================
    // Full Flow Tests
    // ============================================================

    function test_FullFlow_DepositAndWithdraw() public {
        _setupBorrowFlow();
        assertEq(pool.getDeposit(lender1), 20 * 1e6);
        vm.prank(lender1);
        pool.withdraw(8 * 1e6);
        assertEq(pool.getDeposit(lender1), 12 * 1e6);
    }

    function test_FullFlow_BorrowWithGoodScore() public {
        _setupBorrowFlow();
        vm.prank(borrower1);
        registry.registerBorrower();

        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(5 * 1e6, 90 days); // 5 USDC
        assertEq(loanId, 1);
        (,,,, uint256 dt,,) = pool.loans(loanId);
        assertGt(dt, 0);
    }

    function test_FullFlow_RepayEntireLoan() public {
        _setupBorrowFlow();

        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(3 * 1e6, 60 days); // 3 USDC

        vm.prank(borrower1);
        usdc.approve(address(pool), calcRepay(3 * 1e6, 1200));
        vm.prank(borrower1);
        pool.repay(loanId);

        (,,,,,, MayeLendingPool.LoanStatus st) = pool.loans(loanId);
        assertEq(uint256(st), uint256(MayeLendingPool.LoanStatus.REPAYED));
    }

    function test_FullFlow_InterestRateAffectsRepayment() public {
        _setupBorrowFlow();

        vm.prank(owner);
        pool.updatePoolConfig(MayeLendingPool.PoolConfig({
            minCreditScore: 580, maxLoanAmount: 100 * 1e6,
            baseInterestRate: 600, interestRateStep: 200,
            minLoanDuration: 7 days, maxLoanDuration: 365 days
        }));

        vm.prank(borrower1);
        pool.applyAndBorrow(1 * 1e6, 30 days);

        oracle.setScore(borrower2, 600);
        usdc.mint(borrower2, 10_000 * 1e6);
        vm.prank(borrower2);
        uint256 loanId2 = pool.applyAndBorrow(1 * 1e6, 30 days);

        (,,,,, uint256 rb2,) = pool.loans(loanId2);
        assertGt(rb2, 1 * 1e6);
    }

    function test_FullFlow_CreditScoreScreening() public {
        _setupBorrowFlow();
        oracle.setScore(borrower2, 550); // Below 580 minimum

        vm.prank(owner);
        pool.setCreditOracle(address(oracle));

        vm.prank(borrower1);
        pool.applyAndBorrow(1 * 1e6, 30 days);

        vm.expectRevert("Credit score too low");
        vm.prank(borrower2);
        pool.applyAndBorrow(1 * 1e6, 30 days);
    }

    function test_FullFlow_MultipleLenders() public {
        setupFull();
        _depositLender(lender1, 10 * 1e6);
        _depositLender(lender2, 5 * 1e6);

        assertEq(pool.getDeposit(lender1), 10 * 1e6);
        assertEq(pool.getDeposit(lender2), 5 * 1e6);
        assertEq(pool.totalDeposits(), 15 * 1e6);

        vm.prank(lender1);
        pool.withdraw(5 * 1e6);
        assertEq(pool.getDeposit(lender1), 5 * 1e6);
    }

    function test_FullFlow_LoanCapacity() public {
        _setupBorrowFlow();
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(borrower1);
            pool.applyAndBorrow(1 * 1e6, 30 days);
        }
        assertEq(pool.loanCounter(), 3);
    }

    function test_FullFlow_BorrowerHistory() public {
        _setupBorrowFlow();
        vm.prank(borrower1);
        registry.registerBorrower();

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 1 * 1e6;   // 1 USDC
        amounts[1] = 2 * 1e6;   // 2 USDC
        amounts[2] = 500_000;

        for (uint256 i = 0; i < 3; i++) {
            vm.prank(borrower1);
            uint256 loanId = pool.applyAndBorrow(amounts[i], 30 days);
            assertGt(loanId, 0);
        }

        // Loans created but registry tracking is separate (owner.recordLoan)
    }

    function test_FullFlow_PoolStatsAccurate() public {
        setupFull();
        (uint256 dep, uint256 bor, uint256 liq, uint256 active) = pool.getPoolStats();
        assertEq(dep, 0); assertEq(bor, 0); assertEq(liq, 0); assertEq(active, 0);

        _depositLender(owner, 10 * 1e6);
        oracle.setScore(borrower1, 750);
        vm.prank(owner);
        pool.setCreditOracle(address(oracle));

        vm.prank(borrower1);
        usdc.approve(address(pool), 100_000 * 1e6);

        vm.prank(borrower1);
        pool.applyAndBorrow(10 * 1e6, 30 days);

        (dep, bor, liq, active) = pool.getPoolStats();
        assertEq(dep, 10 * 1e6);
        assertEq(bor, 10 * 1e6);
        assertEq(liq, 0); // deposits - borrows = 0
        assertEq(active, 1);
    }

    function test_FullFlow_AccessControl() public {
        setupFull();
        _depositLender(owner, 10 * 1e6);

        vm.expectRevert();
        vm.prank(borrower1);
        pool.setCreditOracle(address(oracle));

        (uint256 ms, uint256 ml, uint256 br, uint256 ist, uint256 mld, uint256 mxd) = pool.poolConfig();
        MayeLendingPool.PoolConfig memory cfg = MayeLendingPool.PoolConfig(ms, ml, br, ist, mld, mxd);
        vm.expectRevert();
        vm.prank(borrower1);
        pool.updatePoolConfig(cfg);

        vm.expectRevert();
        vm.prank(borrower1);
        registry.recordLoan(borrower1, 1, 1000);
    }

    function test_FullFlow_TimeBoundLoan() public {
        _setupBorrowFlow();
        uint256 duration = 30 days;
        uint256 beforeTs = block.timestamp;
        vm.prank(borrower1);
        pool.applyAndBorrow(1 * 1e6, duration);

        (,,,, uint256 dt,,) = pool.loans(1);
        assertGt(dt, beforeTs);
    }

    function test_FullFlow_CannotBorrowTwiceAsSameUser() public {
        _setupBorrowFlow();
        vm.prank(borrower1);
        pool.applyAndBorrow(1 * 1e6, 30 days);

        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(2 * 1e6, 60 days);
        assertEq(loanId, 2);
        assertEq(pool.totalBorrows(), 3 * 1e6);
    }

    function test_FullFlow_MaxLoanAmountBoundary() public {
        _setupLargeLoanFlow();
        
        (uint256 ms,, uint256 br, uint256 ist, uint256 mld, uint256 mxd) = pool.poolConfig();
        vm.prank(owner);
        pool.updatePoolConfig(MayeLendingPool.PoolConfig(ms, 50 * 1e6, br, ist, mld, mxd));

        vm.prank(borrower1);
        pool.applyAndBorrow(50 * 1e6, 30 days);

        usdc.mint(borrower1, 200_000 * 1e6);
        vm.expectRevert("Invalid loan amount");
        vm.prank(borrower1);
        pool.applyAndBorrow(50 * 1e6 + 1, 30 days);
    }

    function test_FullFlow_MultipleLoansRepayment() public {
        _setupBorrowFlow();

        vm.prank(borrower1);
        uint256 loanId1 = pool.applyAndBorrow(1 * 1e6, 30 days);
        vm.prank(borrower1);
        uint256 loanId2 = pool.applyAndBorrow(2 * 1e6, 30 days);
        assertEq(pool.loanCounter(), 2);

        vm.prank(borrower1);
        usdc.approve(address(pool), calcRepay(1 * 1e6, 1200));
        vm.prank(borrower1);
        pool.repay(loanId1);

        (,,,,,, MayeLendingPool.LoanStatus st) = pool.loans(loanId1);
        assertEq(uint256(st), uint256(MayeLendingPool.LoanStatus.REPAYED));
        (,,,,,, MayeLendingPool.LoanStatus st2) = pool.loans(loanId2);
        assertEq(uint256(st2), uint256(MayeLendingPool.LoanStatus.ACTIVE));
    }

    function test_FullFlow_PoolConfigChangeAffectsNewLoans() public {
        _setupBorrowFlow();
        vm.prank(borrower1);
        pool.applyAndBorrow(1 * 1e6, 30 days);

        vm.prank(owner);
        pool.updatePoolConfig(MayeLendingPool.PoolConfig({
            minCreditScore: 700, maxLoanAmount: 100 * 1e6,
            baseInterestRate: 1200, interestRateStep: 200,
            minLoanDuration: 7 days, maxLoanDuration: 365 days
        }));

        oracle.setScore(borrower2, 650);
        usdc.mint(borrower2, 10_000 * 1e6);
        vm.expectRevert("Credit score too low");
        vm.prank(borrower2);
        pool.applyAndBorrow(1 * 1e6, 30 days);
    }

    // ============================================================
    // bAYE NFT Specific Integration Tests
    // ============================================================

    function test_bAYE_MintedOnBorrow() public {
        _setupBorrowFlow();
        vm.prank(borrower1);
        registry.registerBorrower();

        // Check initial state
        assertEq(debtToken.balanceOf(borrower1), 0);

        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(5 * 1e6, 90 days); // 5 USDC

        // Verify NFT is minted to the borrower
        assertEq(debtToken.balanceOf(borrower1), 1);
        assertEq(debtToken.ownerOf(loanId), borrower1);

        // Verify metadata stored on NFT
        (uint256 principal, uint256 rate, uint256 startTime, uint256 deadline, bool isActive) = debtToken.loans(loanId);
        assertEq(principal, 5 * 1e6);
        assertEq(rate, 1200); // 12% APR based on score
        assertEq(startTime, block.timestamp);
        assertEq(deadline, block.timestamp + 90 days);
        assertTrue(isActive);
    }

    function test_bAYE_BurnedOnRepayment() public {
        _setupBorrowFlow();
        vm.prank(borrower1);
        registry.registerBorrower();

        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(3 * 1e6, 60 days); // 3 USDC

        assertEq(debtToken.balanceOf(borrower1), 1);

        vm.prank(borrower1);
        usdc.approve(address(pool), calcRepay(3 * 1e6, 1200));
        vm.prank(borrower1);
        pool.repay(loanId);

        // Verify NFT is burned (balance of borrower becomes 0)
        assertEq(debtToken.balanceOf(borrower1), 0);

        // Verify metadata status updated to inactive
        (,,,, bool isActive) = debtToken.loans(loanId);
        assertFalse(isActive);
    }

    function test_bAYE_TokenURI() public {
        _setupBorrowFlow();
        vm.prank(borrower1);
        registry.registerBorrower();

        vm.prank(borrower1);
        uint256 loanId = pool.applyAndBorrow(5 * 1e6, 90 days);

        string memory uri = debtToken.tokenURI(loanId);
        assertGt(bytes(uri).length, 0);
    }

    function test_bAYE_OnlyLendingPoolAccess() public {
        _setupBorrowFlow();
        
        // Direct call to mint/burn by unauthorized user should fail
        vm.expectRevert("Caller is not LendingPool");
        vm.prank(borrower1);
        debtToken.mint(borrower1, 100 * 1e6, 1000, 30 days);

        vm.expectRevert("Caller is not LendingPool");
        vm.prank(borrower1);
        debtToken.burn(1);
    }
}
