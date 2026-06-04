// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title mAYE — Yield-bearing receipt token for Maye Lending Pool deposits
/// @notice ERC-20 token representing a user's share of the lending pool.
///         Users mint mAYE by depositing and burn to withdraw their proportional share.
contract MAYE is ERC20, Ownable {
    /// @notice The underlying asset this token represents claims on
    address public immutable underlyingAsset;

    constructor(
        address initialOwner,
        address _underlyingAsset
    ) ERC20("Maye Yield Token", "mAYE") Ownable(initialOwner) {
        underlyingAsset = _underlyingAsset;
    }

    /// @notice Mint tokens to a recipient (called by LendingPool on deposit)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn tokens from caller (called by LendingPool on withdrawal)
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /// @notice Allow owner to recover any tokens sent to contract by mistake
    /// @notice Recover any ERC-20 tokens sent by mistake
    function recoverERC20(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
