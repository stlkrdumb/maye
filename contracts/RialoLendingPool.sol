// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CredentialVerifier.sol";

/**
 * @title RialoLendingPool
 * @notice Core lending vault that offers under-collateralized loans based on TEE-verified trust credentials.
 *         Collateral is locked in WETH (18 decimals), and loans are disbursed in USDC (6 decimals).
 */
contract RialoLendingPool is Ownable, ReentrancyGuard {
    // ---- Constants ----
    uint256 public constant BASE_COLLATERAL_RATIO = 15000; // 150% in basis points (10000 = 100%)
    uint256 public constant BASE_INTEREST_RATE = 1250;     // 12.5% APR in basis points (10000 = 100%)

    uint256 public constant MIN_LOAN_AMOUNT = 10_000 * 1e6;   // $10,000 USDC (6 decimals)
    uint256 public constant MAX_LOAN_AMOUNT = 1_000_000 * 1e6; // $1,000,000 USDC (6 decimals)

    // ---- Credential Discount Parameters ----
    // 0: Credit Score               -25% Collateral | -1.8% Interest Rate
    // 1: Banking Verification       -20% Collateral | -1.2% Interest Rate
    // 2: KYC / Identity             -15% Collateral | -0.8% Interest Rate
    // 3: On-chain Reputation       -10% Collateral | -0.6% Interest Rate
    // 4: Credit Reporting Consent   -8% Collateral | -0.4% Interest Rate
    // Combo Bonus (all 5 checked)   -5% Collateral | -0.3% Interest Rate
    uint256[5] public collateralDiscounts = [2500, 2000, 1500, 1000, 800];
    uint256[5] public interestDiscounts = [180, 120, 80, 60, 40];
    uint256 public constant COMBO_COLLATERAL_DISCOUNT = 500;
    uint256 public constant COMBO_INTEREST_DISCOUNT = 30;

    // ---- Structs ----
    struct Loan {
        address borrower;
        uint256 borrowedAmount;    // USDC (6 decimals)
        uint256 collateralLocked;  // WETH (18 decimals)
        uint256 collateralRatio;   // basis points (e.g. 6700 for 67%)
        uint256 interestRate;      // basis points (e.g. 740 for 7.4% APR)
        uint256 startTime;
        uint256 dueTime;
        bool isActive;
    }

    // ---- State Variables ----
    IERC20 public immutable collateralToken; // WETH (18 decimals)
    IERC20 public immutable lendingToken;    // USDC (6 decimals)
    CredentialVerifier public immutable verifier;

    uint256 public wethPrice; // WETH Price in USDC/USD (6 decimals, e.g., 3000 * 1e6 = $3,000)
    uint256 public loanCounter;
    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoanIds;

    // ---- Events ----
    event LoanBorrowed(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 borrowedAmount,
        uint256 collateralLocked,
        uint256 collateralRatio,
        uint256 interestRate,
        uint256 dueTime
    );
    event LoanRepayed(uint256 indexed loanId, address indexed borrower, uint256 totalPaid);
    event LoanLiquidated(uint256 indexed loanId, address indexed liquidator, uint256 repaidDebt, uint256 collateralSeized);
    event WethPriceUpdated(uint256 oldPrice, uint256 newPrice);

    constructor(
        address _collateralToken,
        address _lendingToken,
        address _verifier,
        uint256 _initialWethPrice,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_collateralToken != address(0), "Zero address");
        require(_lendingToken != address(0), "Zero address");
        require(_verifier != address(0), "Zero address");
        require(_initialWethPrice > 0, "Price must be > 0");

        collateralToken = IERC20(_collateralToken);
        lendingToken = IERC20(_lendingToken);
        verifier = CredentialVerifier(_verifier);
        wethPrice = _initialWethPrice;
    }

    /**
     * @notice Admin-set WETH price in USDC (6 decimals, e.g. 3000 * 1e6)
     */
    function setWethPrice(uint256 _newPrice) external onlyOwner {
        require(_newPrice > 0, "Price must be > 0");
        emit WethPriceUpdated(wethPrice, _newPrice);
        wethPrice = _newPrice;
    }

    /**
     * @notice Calculates the borrower's required collateral ratio and active interest rate based on verified credentials
     */
    function getBorrowingTerms(address borrower) public view returns (uint256 ratio, uint256 interestRate) {
        uint256 collDiscount = 0;
        uint256 rateDiscount = 0;
        bool[5] memory creds = verifier.getCredentials(borrower);

        uint256 count = 0;
        for (uint8 i = 0; i < 5; i++) {
            if (creds[i]) {
                collDiscount += collateralDiscounts[i];
                rateDiscount += interestDiscounts[i];
                count++;
            }
        }

        if (count == 5) {
            collDiscount += COMBO_COLLATERAL_DISCOUNT;
            rateDiscount += COMBO_INTEREST_DISCOUNT;
        }

        ratio = BASE_COLLATERAL_RATIO > collDiscount ? BASE_COLLATERAL_RATIO - collDiscount : 0;
        interestRate = BASE_INTEREST_RATE > rateDiscount ? BASE_INTEREST_RATE - rateDiscount : 0;
    }

    /**
     * @notice Helper to compute WETH collateral needed for a given USDC borrow amount based on user credentials
     */
    function computeCollateralNeeded(address borrower, uint256 amount) public view returns (uint256 collateralWeth, uint256 ratio) {
        (ratio, ) = getBorrowingTerms(borrower);
        // Required collateral value in USDC (6 decimals)
        uint256 requiredCollateralUsdc = (amount * ratio) / 10000;
        // WETH needed (18 decimals) = (requiredCollateralUsdc * 10^18) / wethPrice
        collateralWeth = (requiredCollateralUsdc * 1e18) / wethPrice;
    }

    /**
     * @notice Borrow lending tokens (USDC) by locking dynamic, credential-discounted collateral (WETH)
     * @param amount The USDC amount to borrow (6 decimals)
     * @param duration The loan duration in seconds
     */
    function borrow(uint256 amount, uint256 duration) external nonReentrant {
        require(amount >= MIN_LOAN_AMOUNT && amount <= MAX_LOAN_AMOUNT, "Amount out of range");
        require(duration >= 7 days && duration <= 365 days, "Invalid duration");

        (uint256 collateralNeeded, uint256 ratio) = computeCollateralNeeded(msg.sender, amount);
        (, uint256 interestRate) = getBorrowingTerms(msg.sender);

        // Generate unique loan ID via cryptographic hash to prevent redeploy collisions
        uint256 loanId = uint256(
            keccak256(abi.encodePacked(msg.sender, amount, block.timestamp, loanCounter))
        );
        loanCounter++;
        loans[loanId] = Loan({
            borrower: msg.sender,
            borrowedAmount: amount,
            collateralLocked: collateralNeeded,
            collateralRatio: ratio,
            interestRate: interestRate,
            startTime: block.timestamp,
            dueTime: block.timestamp + duration,
            isActive: true
        });

        userLoanIds[msg.sender].push(loanId);

        // Pull WETH collateral from borrower
        require(collateralToken.transferFrom(msg.sender, address(this), collateralNeeded), "Collateral transfer failed");
        // Push USDC borrowed amount to borrower
        require(lendingToken.transfer(msg.sender, amount), "USDC transfer failed");

        emit LoanBorrowed(loanId, msg.sender, amount, collateralNeeded, ratio, interestRate, block.timestamp + duration);
    }

    /**
     * @notice Calculates the total principal + accrued simple interest outstanding for a loan
     */
    function calculateRepaymentAmount(uint256 loanId) public view returns (uint256) {
        Loan memory loan = loans[loanId];
        if (!loan.isActive) return 0;

        uint256 timeElapsed = block.timestamp > loan.startTime ? block.timestamp - loan.startTime : 0;
        // Simple Interest accrued: (Principal * APR * timeElapsed) / (10000 * 365 days)
        uint256 interestAccrued = (loan.borrowedAmount * loan.interestRate * timeElapsed) / (10000 * 365 days);
        return loan.borrowedAmount + interestAccrued;
    }

    /**
     * @notice Repay loan balance in full, unlocking locked WETH collateral
     */
    function repay(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");
        require(loan.borrower == msg.sender, "Not your loan");

        uint256 repaymentAmount = calculateRepaymentAmount(loanId);
        loan.isActive = false;

        // Pull repayment USDC from borrower
        require(lendingToken.transferFrom(msg.sender, address(this), repaymentAmount), "Repayment transfer failed");
        // Release WETH collateral back to borrower
        require(collateralToken.transfer(loan.borrower, loan.collateralLocked), "Collateral release failed");

        emit LoanRepayed(loanId, msg.sender, repaymentAmount);
    }

    /**
     * @notice Liquidates an active under-collateralized loan that is overdue or has breached its minimum collateral ratio
     */
    function liquidate(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");

        // Check if liquidation condition is met:
        // Condition 1: Loan is overdue
        bool isOverdue = block.timestamp > loan.dueTime;

        // Condition 2: Collateral ratio breached due to WETH price drop
        // Collateral value in USDC = (collateralLocked * wethPrice) / 10^18
        uint256 collateralValueUsdc = (loan.collateralLocked * wethPrice) / 1e18;
        uint256 requiredValueUsdc = (loan.borrowedAmount * loan.collateralRatio) / 10000;
        bool isUndercollateralized = collateralValueUsdc < requiredValueUsdc;

        require(isOverdue || isUndercollateralized, "Cannot liquidate");

        uint256 repaymentAmount = calculateRepaymentAmount(loanId);
        loan.isActive = false;

        // Liquidator repays full outstanding debt in USDC
        require(lendingToken.transferFrom(msg.sender, address(this), repaymentAmount), "Liquidation debt repayment failed");
        // Liquidator receives entire locked WETH collateral as incentive
        require(collateralToken.transfer(msg.sender, loan.collateralLocked), "Liquidation collateral seizure failed");

        emit LoanLiquidated(loanId, msg.sender, repaymentAmount, loan.collateralLocked);
    }

    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoanIds[user];
    }
}
