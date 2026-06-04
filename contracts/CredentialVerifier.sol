// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CredentialVerifier
 * @notice Cryptographically verifies off-chain TEE (REX) credential attestations
 *         and records borrower eligibility tiers on-chain.
 */
contract CredentialVerifier is Ownable {
    address public teeVerifier;

    // credentialId => user => verified status
    // 0: Credit Score
    // 1: Banking Verification
    // 2: KYC / Identity
    // 3: On-chain Reputation
    // 4: Credit Reporting Consent
    mapping(uint8 => mapping(address => bool)) public hasCredential;

    event CredentialVerified(address indexed user, uint8 indexed credentialId);
    event TeeVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    constructor(address _teeVerifier, address initialOwner) Ownable(initialOwner) {
        require(_teeVerifier != address(0), "Zero address");
        teeVerifier = _teeVerifier;
    }

    /**
     * @notice Updates the public key / signer address of the authorized off-chain TEE engine
     */
    function setTeeVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "Zero address");
        emit TeeVerifierUpdated(teeVerifier, _newVerifier);
        teeVerifier = _newVerifier;
    }

    /**
     * @notice Cryptographically verifies a TEE-signed attestation for a credential ID
     * @param user The address of the borrower
     * @param credentialId The verified credential tier (0..4)
     * @param payloadHash A unique hash of the off-chain credentials to ensure freshness / metadata mapping
     * @param signature The ECDSA TEE signature over the message hash
     */
    function verifyAndRecord(
        address user,
        uint8 credentialId,
        bytes32 payloadHash,
        bytes calldata signature
    ) external {
        require(credentialId < 5, "Invalid credentialId");
        
        // Reconstruct the message hash verified by the TEE
        // TEE signs the hash of the packed tuple: (user, credentialId, payloadHash)
        bytes32 messageHash = keccak256(abi.encodePacked(user, credentialId, payloadHash));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        address signer = _recoverSigner(ethSignedHash, signature);
        require(signer == teeVerifier, "Invalid signature");

        hasCredential[credentialId][user] = true;
        emit CredentialVerified(user, credentialId);
    }

    /**
     * @notice Allows the admin to revoke a credential if a breach or identity falsification is discovered
     */
    function removeCredential(address user, uint8 credentialId) external onlyOwner {
        require(credentialId < 5, "Invalid credentialId");
        hasCredential[credentialId][user] = false;
    }

    /**
     * @notice Returns an array of bools representing the user's verified credentials
     */
    function getCredentials(address user) external view returns (bool[5] memory) {
        return [
            hasCredential[0][user],
            hasCredential[1][user],
            hasCredential[2][user],
            hasCredential[3][user],
            hasCredential[4][user]
        ];
    }

    /**
     * @notice Checks if the borrower has all 5 credentials verified to qualify for the Combo Bonus
     */
    function hasAllCredentials(address user) external view returns (bool) {
        return hasCredential[0][user] &&
               hasCredential[1][user] &&
               hasCredential[2][user] &&
               hasCredential[3][user] &&
               hasCredential[4][user];
    }

    /**
     * @notice Recovers the ECDSA signer address from the ethereum signed message hash and signature
     */
    function _recoverSigner(bytes32 _ethSignedHash, bytes memory _signature) internal pure returns (address) {
        if (_signature.length != 65) {
            return address(0);
        }
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }
        return ecrecover(_ethSignedHash, v, r, s);
    }
}
