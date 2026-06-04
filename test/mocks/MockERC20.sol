// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Mock USDC for testing with full precision (6 decimals) and minting capability
contract MockERC20 is ERC20 {
    uint8 private _decimalsValue;

    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimalsValue = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimalsValue;
    }

    /// @notice Mint tokens to an address (for testing only)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
