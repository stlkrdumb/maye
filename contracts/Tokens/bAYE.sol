// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title bAYE — Maye Debt Position NFT
 * @notice Represents a borrower's debt position in the Maye protocol.
 * @dev Minted by the LendingPool upon loan issuance.
 */
contract bAYE is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextTokenId;
    address public lendingPool;

    struct LoanMetadata {
        uint256 principal;
        uint256 interestRate;
        uint256 startTime;
        uint256 deadline;
        bool isActive;
    }

    mapping(uint256 => LoanMetadata) public loans;

    event LendingPoolUpdated(address indexed newPool);

    constructor() ERC721("Maye Debt Position", "bAYE") Ownable(msg.sender) {}

    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "Caller is not LendingPool");
        _;
    }

    /**
     * @notice Sets the authorized LendingPool address
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        lendingPool = _lendingPool;
        emit LendingPoolUpdated(_lendingPool);
    }

    /**
     * @notice Mints a new debt position NFT
     */
    function mint(
        address to,
        uint256 principal,
        uint256 interestRate,
        uint256 duration
    ) external onlyLendingPool returns (uint256) {
        uint256 tokenId = ++_nextTokenId;
        
        loans[tokenId] = LoanMetadata({
            principal: principal,
            interestRate: interestRate,
            startTime: block.timestamp,
            deadline: block.timestamp + duration,
            isActive: true
        });

        _mint(to, tokenId);
        return tokenId;
    }

    /**
     * @notice Burns the NFT when the loan is fully repaid
     */
    function burn(uint256 tokenId) external onlyLendingPool {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        loans[tokenId].isActive = false;
        _burn(tokenId);
    }

    /**
     * @notice Generates a premium on-chain SVG representation of the debt position
     */
    function _generateSVG(uint256 tokenId, LoanMetadata memory loan) internal view returns (string memory) {
        string memory statusStr = loan.isActive ? "ACTIVE" : "REPAID";
        string memory statusColor = loan.isActive ? "#a9ddd3" : "#808080";
        
        uint256 daysRemaining = 0;
        if (loan.isActive && loan.deadline > block.timestamp) {
            daysRemaining = (loan.deadline - block.timestamp) / 1 days;
        }

        // Format USDC amount (assuming 6 decimals)
        uint256 cents = (loan.principal % 1e6) / 1e4;
        string memory centsStr = cents < 10 ? string(abi.encodePacked("0", Strings.toString(cents))) : Strings.toString(cents);
        string memory principalStr = string(abi.encodePacked(Strings.toString(loan.principal / 1e6), ".", centsStr));
        
        // Format APR (e.g. 1200 basis points -> 12.00%)
        uint256 aprCents = loan.interestRate % 100;
        string memory aprCentsStr = aprCents < 10 ? string(abi.encodePacked("0", Strings.toString(aprCents))) : Strings.toString(aprCents);
        string memory aprStr = string(abi.encodePacked(Strings.toString(loan.interestRate / 100), ".", aprCentsStr));

        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 500" width="100%" height="100%">',
            '<defs>',
            '<linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" stop-color="#050808"/>',
            '<stop offset="100%" stop-color="#020303"/>',
            '</linearGradient>',
            '<linearGradient id="sageGlow" x1="0%" y1="0%" x2="100%" y2="100%">',
            '<stop offset="0%" stop-color="#a9ddd3" stop-opacity="0.15"/>',
            '<stop offset="100%" stop-color="#a9ddd3" stop-opacity="0"/>',
            '</linearGradient>',
            '</defs>',
            '<rect width="350" height="500" rx="20" fill="url(#bgGrad)" stroke="#1a2e2b" stroke-width="1.5"/>',
            '<rect width="330" height="480" x="10" y="10" rx="12" fill="url(#sageGlow)"/>',
            // Grid Lines
            '<line x1="30" y1="90" x2="320" y2="90" stroke="#1a2e2b" stroke-dasharray="4 4"/>',
            '<line x1="30" y1="410" x2="320" y2="410" stroke="#1a2e2b" stroke-dasharray="4 4"/>',
            // Header
            '<text x="30" y="55" font-family="monospace" font-size="12" fill="#a9ddd3" letter-spacing="3">MAYE PROTOCOL</text>',
            '<text x="320" y="55" font-family="monospace" font-size="12" fill="#e8e3d5" text-anchor="end" opacity="0.6">// v1.0</text>',
            // Loan ID
            '<text x="30" y="140" font-family="sans-serif" font-weight="700" font-size="36" fill="#e8e3d5">Position #', Strings.toString(tokenId), '</text>',
            // Status Badge
            '<rect x="30" y="160" width="70" height="20" rx="4" fill="', statusColor, '" fill-opacity="0.15"/>',
            '<text x="65" y="174" font-family="monospace" font-size="10" font-weight="700" fill="', statusColor, '" text-anchor="middle">', statusStr, '</text>',
            // Metrics Label & Values
            '<text x="30" y="240" font-family="monospace" font-size="11" fill="#e8e3d5" opacity="0.5">PRINCIPAL DEBT</text>',
            '<text x="30" y="270" font-family="sans-serif" font-weight="600" font-size="24" fill="#e8e3d5">', principalStr, ' USDC</text>',
            
            '<text x="30" y="320" font-family="monospace" font-size="11" fill="#e8e3d5" opacity="0.5">INTEREST RATE (APR)</text>',
            '<text x="30" y="340" font-family="sans-serif" font-weight="600" font-size="16" fill="#a9ddd3">', aprStr, '%</text>',
            
            '<text x="200" y="320" font-family="monospace" font-size="11" fill="#e8e3d5" opacity="0.5">TIME REMAINING</text>',
            '<text x="200" y="340" font-family="sans-serif" font-weight="600" font-size="16" fill="#e8e3d5">', Strings.toString(daysRemaining), ' Days</text>',
            // Footer
            '<text x="30" y="445" font-family="monospace" font-size="10" fill="#e8e3d5" opacity="0.4">DEBT POSITION TOKEN (bAYE)</text>',
            '<text x="30" y="460" font-family="monospace" font-size="9" fill="#e8e3d5" opacity="0.3">SECURED BY AI RISK AGENT ATTESTATION</text>',
            '</svg>'
        ));
    }

    /**
     * @dev Returns dynamically generated dynamic SVG/JSON metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        LoanMetadata memory loan = loans[tokenId];
        
        string memory svg = _generateSVG(tokenId, loan);
        string memory base64SVG = Base64.encode(bytes(svg));
        
        string memory statusStr = loan.isActive ? "ACTIVE" : "REPAID";
        
        uint256 daysRemaining = 0;
        if (loan.isActive && loan.deadline > block.timestamp) {
            daysRemaining = (loan.deadline - block.timestamp) / 1 days;
        }

        string memory json = string(abi.encodePacked(
            '{"name": "Maye Debt Position #', Strings.toString(tokenId), '", ',
            '"description": "This NFT represents an active unsecured private debt position in the Maye Lending protocol.", ',
            '"image": "data:image/svg+xml;base64,', base64SVG, '", ',
            '"attributes": [',
            '{"trait_type": "Principal (USDC)", "value": ', Strings.toString(loan.principal / 1e6), '}, ',
            '{"trait_type": "Interest Rate (APR %)", "value": "', Strings.toString(loan.interestRate / 100), '.', Strings.toString((loan.interestRate % 100) / 10), '"}, ',
            '{"trait_type": "Days Remaining", "value": ', Strings.toString(daysRemaining), '}, ',
            '{"trait_type": "Status", "value": "', statusStr, '"}',
            ']}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }
}
