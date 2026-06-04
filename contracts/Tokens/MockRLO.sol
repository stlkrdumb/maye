// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockRLO — Rialo Collateral Token
 * @notice Standard 18-decimal RLO mock with a public 24h faucet to act as collateral.
 *         RLO has a target price of $1.00.
 */
contract MockRLO is ERC20, Ownable {
    mapping(address => uint256) public lastFaucetRequest;
    uint256 public constant FAUCET_AMOUNT = 100_000 * 10**18; // 100,000 RLO ($100k collateral)
    uint256 public constant COOLDOWN = 24 hours;

    event FaucetRequested(address indexed user, uint256 amount);

    constructor(address initialOwner) ERC20("Rialo Token", "RLO") Ownable(initialOwner) {}

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
        return 18;
    }
}
