// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ICreditOracle.sol";
import "./Tokens/bAYE.sol";

/**
 * @title MayeLendingPool
 * @notice Core lending protocol for unsecured consumer credit on Base Sepolia.
 * @dev Implements CEI pattern, ReentrancyGuard, and Pausable for institutional safety.
 */
contract MayeLendingPool is Ownable, ReentrancyGuard, Pausable {
    // ---- Types ----

    enum LoanStatus { NONE, ACTIVE, REPAYED, DEFAULTED }

    struct Loan {
        address borrower;
        uint256 principal;
        uint256 interestRate; // basis points
        uint256 startTime;
        uint256 dueTime;
        uint256 remainingBalance;
        LoanStatus status;
    }

    struct DepositRecord {
        uint256 amount;
        uint256 lastAccruedInterest;
    }

    struct PoolConfig {
        uint256 minCreditScore;
        uint256 maxLoanAmount;
        uint256 baseInterestRate;
        uint256 interestRateStep;
        uint256 minLoanDuration;
        uint256 maxLoanDuration;
    }

    // ---- State Variables ----

    IERC20 public immutable lendingToken;
    ICreditOracle public creditOracle;
    bAYE public debtToken;

    uint256 public totalDeposits;
    uint256 public totalBorrows;
    uint256 public activeLoanCount;
    uint256 public loanCounter;

    PoolConfig public poolConfig;
    mapping(address => DepositRecord) public deposits;
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoanIds;

    // ---- Events ----

    event Deposit(address indexed lender, uint256 amount);
    event Withdrawal(address indexed lender, uint256 amount);
    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 principal, uint256 rate, uint256 dueTime);
    event LoanRepayed(uint256 indexed loanId, address indexed borrower, uint256 amount);
    event PoolConfigUpdated(PoolConfig config);
    event CreditOracleSet(address oracleAddress);
    event DebtTokenSet(address debtTokenAddress);

    // ---- Constructor ----

    constructor(
        address _lendingToken,
        address initialOwner
    ) Ownable(initialOwner) {
        lendingToken = IERC20(_lendingToken);
        poolConfig = PoolConfig({
            minCreditScore: 580,
            maxLoanAmount: 10_000_000_000, // 10,000 USDC (6 decimals)
            baseInterestRate: 1200,      // 12% APR
            interestRateStep: 200,       // +2% per tier
            minLoanDuration: 7 days,
            maxLoanDuration: 365 days
        });
    }

    // ---- Lender Functions ----

    function deposit(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        // CEI Pattern
        deposits[msg.sender].amount += amount;
        totalDeposits += amount;

        require(lendingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(deposits[msg.sender].amount >= amount, "Insufficient balance");
        require(availableLiquidity() >= amount, "Insufficient pool liquidity");

        // CEI Pattern
        deposits[msg.sender].amount -= amount;
        totalDeposits -= amount;

        require(lendingToken.transfer(msg.sender, amount), "Transfer failed");
        emit Withdrawal(msg.sender, amount);
    }

    // ---- Borrower Functions ----

    function applyAndBorrow(
        uint256 principal,
        uint256 duration
    ) external whenNotPaused nonReentrant returns (uint256 loanId) {
        PoolConfig memory cfg = poolConfig;
        require(principal > 0 && principal <= cfg.maxLoanAmount, "Invalid loan amount");
        require(duration >= cfg.minLoanDuration && duration <= cfg.maxLoanDuration, "Invalid duration");
        require(availableLiquidity() >= principal, "Insufficient pool liquidity");

        uint256 score = creditOracle.getScore(msg.sender);
        require(score >= cfg.minCreditScore, "Credit score too low");

        uint256 interestRate = _calculateInterestRate(score, cfg);
        
        loanCounter++;
        loanId = loanCounter;

        // EFFECTS: Update state before transfer
        loans[loanId] = Loan({
            borrower: msg.sender,
            principal: principal,
            interestRate: interestRate,
            startTime: block.timestamp,
            dueTime: block.timestamp + duration,
            remainingBalance: _calculateRepayment(principal, interestRate),
            status: LoanStatus.ACTIVE
        });

        totalBorrows += principal;
        activeLoanCount++;
        userLoanIds[msg.sender].push(loanId);

        // Mint Debt NFT to borrower
        if (address(debtToken) != address(0)) {
            debtToken.mint(msg.sender, principal, interestRate, duration);
        }

        // INTERACTIONS: Final transfer
        require(lendingToken.transfer(msg.sender, principal), "Transfer failed");

        emit LoanCreated(loanId, msg.sender, principal, interestRate, loans[loanId].dueTime);
    }

    function repay(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.borrower == msg.sender, "Not your loan");
        require(loan.status == LoanStatus.ACTIVE, "Loan not active");

        uint256 repaymentAmount = loan.remainingBalance;

        // EFFECTS
        totalBorrows -= loan.principal;
        loan.status = LoanStatus.REPAYED;
        loan.remainingBalance = 0;
        activeLoanCount--;

        // Burn Debt NFT
        if (address(debtToken) != address(0)) {
            debtToken.burn(loanId);
        }

        // INTERACTIONS
        require(lendingToken.transferFrom(msg.sender, address(this), repaymentAmount), "Transfer failed");

        emit LoanRepayed(loanId, msg.sender, repaymentAmount);
    }

    // ---- Admin Functions ----

    function setCreditOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Zero address");
        creditOracle = ICreditOracle(_oracle);
        emit CreditOracleSet(_oracle);
    }

    function setDebtToken(address _debtToken) external onlyOwner {
        require(_debtToken != address(0), "Zero address");
        debtToken = bAYE(_debtToken);
        emit DebtTokenSet(_debtToken);
    }

    function updatePoolConfig(PoolConfig calldata newConfig) external onlyOwner {
        poolConfig = newConfig;
        emit PoolConfigUpdated(newConfig);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ---- View Functions ----

    function availableLiquidity() public view returns (uint256) {
        return lendingToken.balanceOf(address(this));
    }

    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    function getUserLoanIds(address borrower) external view returns (uint256[] memory) {
        return userLoanIds[borrower];
    }

    function getDeposit(address lender) external view returns (uint256) {
        return deposits[lender].amount;
    }

    /**
     * @notice Helper to get all pool aggregate stats in one call
     */
    function getPoolStats() external view returns (
        uint256 depositsTotal,
        uint256 borrowsTotal,
        uint256 liquidity,
        uint256 activeLoans
    ) {
        return (totalDeposits, totalBorrows, availableLiquidity(), activeLoanCount);
    }

    // ---- Internal Logic ----

    function _calculateInterestRate(uint256 score, PoolConfig memory cfg) internal pure returns (uint256) {
        if (score >= 750) return cfg.baseInterestRate;
        if (score >= 650) return cfg.baseInterestRate + cfg.interestRateStep;
        return cfg.baseInterestRate + (cfg.interestRateStep * 2);
    }

    function _calculateRepayment(uint256 principal, uint256 rate) internal pure returns (uint256) {
        // (Principal * (1 + rate/10000))
        return principal + (principal * rate) / 10000;
    }
}
