// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title ICreditOracle — Interface for AI-powered credit score verification
/// @notice Credit scores are generated offchain by the AI agent,
///         then attested and recorded onchain via this oracle interface.
interface ICreditOracle {
    enum ScoreTier { INVALID, SUBPRIME, NEAR_PRIME, PRIME }

    struct CreditRecord {
        address borrower;
        uint256 score;           // 0–1000 scale
        ScoreTier tier;
        uint256 timestamp;       // when the score was generated
        bytes32 attestationHash; // hash of AI agent's attestation signature
    }

    event CreditScoreUpdated(
        address indexed borrower,
        uint256 score,
        ScoreTier tier,
        uint256 timestamp
    );

    /// @notice Returns the current credit record for a borrower
    function getCreditRecord(address borrower) external view returns (CreditRecord memory);

    /// @notice Returns the latest credit score for a borrower
    function getScore(address borrower) external view returns (uint256);

    /// @notice Checks if a score is valid and within freshness window (default 30 days)
    function isScoreValid(address borrower, uint256 maxAgeSeconds) external view returns (bool);
}
