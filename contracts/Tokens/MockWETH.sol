// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockWETH — Wrapped Ether Faucet Token
 * @notice Standard 18-decimal WETH mock with a public 24h faucet to act as collateral.
 */
contract MockWETH is ERC20, Ownable {
    mapping(address => uint256) public lastFaucetRequest;
    uint256 public constant FAUCET_AMOUNT = 5 * 10**18; // 5 WETH
    uint256 public constant COOLDOWN = 24 hours;

    event FaucetRequested(address indexed user, uint256 amount);

    constructor(address initialOwner) ERC20("Mock Wrapped Ether", "WETH") Ownable(initialOwner) {}

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
