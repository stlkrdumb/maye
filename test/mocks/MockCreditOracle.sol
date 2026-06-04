// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICreditOracle} from "../../contracts/interfaces/ICreditOracle.sol";

/// @notice Mock CreditOracle for testing — stores scores by address and returns them on demand
contract MockCreditOracle is ICreditOracle {
    mapping(address => CreditRecord) private _records;

    /// @notice Set a credit score for an address (called by test setup)
    function setScore(address borrower, uint256 score) external {
        ScoreTier tier;
        if (score < 580) tier = ScoreTier.SUBPRIME;
        else if (score < 720) tier = ScoreTier.NEAR_PRIME;
        else tier = ScoreTier.PRIME;

        _records[borrower] = CreditRecord({
            borrower: borrower,
            score: score,
            tier: tier,
            timestamp: block.timestamp,
            attestationHash: bytes3(0)
        });

        emit CreditScoreUpdated(borrower, score, tier, block.timestamp);
    }

    function getCreditRecord(address borrower) external view returns (CreditRecord memory) {
        return _records[borrower];
    }

    function getScore(address borrower) external view returns (uint256) {
        return _records[borrower].score;
    }

    function isScoreValid(address borrower, uint256 maxAgeSeconds) external view returns (bool) {
        CreditRecord memory record = _records[borrower];
        if (record.score == 0) return false;
        return (block.timestamp - record.timestamp) <= maxAgeSeconds;
    }
}
