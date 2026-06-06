// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDC — USDC Mock Token
 * @notice Standard 6-decimal USDC mock for testing. No faucet.
 */
contract TestUSDC is ERC20, Ownable {
    constructor(address initialOwner) ERC20("Test USDC", "USDC") Ownable(initialOwner) {}

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
