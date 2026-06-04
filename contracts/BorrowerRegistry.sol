// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICreditOracle.sol";

/**
 * @title BorrowerRegistry
 * @notice Maintains borrower history and aggregate statistics for Maye.
 * @dev Implements the ICreditOracle interface for ZK-proof score updates.
 */
contract BorrowerRegistry is Ownable, ICreditOracle {
    // ---- Types ----

    struct BorrowerProfile {
        address borrower;
        uint256 totalLoansTaken;
        uint256 totalAmountBorrowed;
        uint256 totalRepaid;
        uint256 latestCreditScore;
        bool isBanned;
        uint256 createdAt;
    }

    // ---- State Variables ----

    mapping(address => BorrowerProfile) public borrowers;
    mapping(address => CreditRecord) public creditRecords;
    mapping(uint256 => address) public loanToBorrower;

    // ---- Events ----

    event BorrowerRegistered(address indexed borrower);
    event LoanRecorded(address indexed borrower, uint256 loanId, uint256 amount);
    event RepaymentRecorded(address indexed borrower, uint256 repaidAmount);
    event BorrowerBanned(address indexed borrower, bool banned);

    // ---- Constructor ----

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ---- Core Functions ----

    function registerBorrower() external {
        if (borrowers[msg.sender].borrower != address(0)) return;

        borrowers[msg.sender] = BorrowerProfile({
            borrower: msg.sender,
            totalLoansTaken: 0,
            totalAmountBorrowed: 0,
            totalRepaid: 0,
            latestCreditScore: 0,
            isBanned: false,
            createdAt: block.timestamp
        });

        emit BorrowerRegistered(msg.sender);
    }

    function recordLoan(address borrower, uint256 loanId, uint256 amount) external onlyOwner {
        borrowers[borrower].totalLoansTaken++;
        borrowers[borrower].totalAmountBorrowed += amount;
        loanToBorrower[loanId] = borrower;

        emit LoanRecorded(borrower, loanId, amount);
    }

    function recordRepayment(address borrower, uint256 amount) external onlyOwner {
        borrowers[borrower].totalRepaid += amount;
        emit RepaymentRecorded(borrower, amount);
    }

    function updateCreditScore(
        address borrower,
        uint256 score,
        ScoreTier tier,
        bytes32 attestationHash
    ) external onlyOwner {
        require(score <= 1000, "Invalid score");
        
        // Auto-register if profile doesn't exist
        if (borrowers[borrower].borrower == address(0)) {
            borrowers[borrower] = BorrowerProfile({
                borrower: borrower,
                totalLoansTaken: 0,
                totalAmountBorrowed: 0,
                totalRepaid: 0,
                latestCreditScore: score,
                isBanned: false,
                createdAt: block.timestamp
            });
            emit BorrowerRegistered(borrower);
        } else {
            borrowers[borrower].latestCreditScore = score;
        }
        
        creditRecords[borrower] = CreditRecord({
            borrower: borrower,
            score: score,
            tier: tier,
            timestamp: block.timestamp,
            attestationHash: attestationHash
        });

        emit CreditScoreUpdated(borrower, score, tier, block.timestamp);
    }

    function setBanStatus(address borrower, bool banned) external onlyOwner {
        borrowers[borrower].isBanned = banned;
        emit BorrowerBanned(borrower, banned);
    }

    // ---- ICreditOracle Implementation ----

    function getScore(address borrower) external view override returns (uint256) {
        return creditRecords[borrower].score;
    }

    function getCreditRecord(address borrower) external view override returns (CreditRecord memory) {
        return creditRecords[borrower];
    }

    function isScoreValid(address borrower, uint256 maxAgeSeconds) external view override returns (bool) {
        CreditRecord memory record = creditRecords[borrower];
        if (record.score == 0) return false;
        return (block.timestamp - record.timestamp) <= maxAgeSeconds;
    }

    // ---- View Functions ----

    /**
     * @notice Get a complete borrower profile
     */
    function getProfile(address borrower) external view returns (BorrowerProfile memory) {
        return borrowers[borrower];
    }

    function getProfileTuple(address borrower) external view returns (
        address borrowerAddr,
        uint256 totalLoansTaken,
        uint256 totalAmountBorrowed,
        uint256 totalRepaid,
        uint256 latestCreditScore,
        bool isBanned,
        uint256 createdAt
    ) {
        BorrowerProfile memory p = borrowers[borrower];
        return (p.borrower, p.totalLoansTaken, p.totalAmountBorrowed, p.totalRepaid, p.latestCreditScore, p.isBanned, p.createdAt);
    }

    function isEligible(address borrower) external view returns (bool) {
        BorrowerProfile storage profile = borrowers[borrower];
        return profile.borrower != address(0) && !profile.isBanned;
    }

    function getRepaymentRate(address borrower) external view returns (uint256) {
        BorrowerProfile memory profile = borrowers[borrower];
        if (profile.totalAmountBorrowed == 0) return 0;
        return (profile.totalRepaid * 10000) / profile.totalAmountBorrowed;
    }
}
