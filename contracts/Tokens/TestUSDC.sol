// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDC — Public Faucet Token
 * @notice Standard 6-decimal USDC mock with a public 24h faucet.
 */
contract TestUSDC is ERC20, Ownable {
    mapping(address => uint256) public lastFaucetRequest;
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**6; // 1,000 USDC
    uint256 public constant COOLDOWN = 24 hours;

    event FaucetRequested(address indexed user, uint256 amount);

    constructor(address initialOwner) ERC20("Test USDC", "USDC") Ownable(initialOwner) {}

    /**
     * @notice Public faucet available to anyone once every 24 hours.
     */
    function requestFaucet() external {
        require(block.timestamp >= lastFaucetRequest[msg.sender] + COOLDOWN, "Faucet: 24h cooldown active");
        
        lastFaucetRequest[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        
        emit FaucetRequested(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Administrative mint function.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function decimals() public view override returns (uint8) {
        return 6;
    }
}
