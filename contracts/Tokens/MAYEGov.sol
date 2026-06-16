// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MAYEGov — Governance & Reward Token for Maye Protocol
 * @notice Separate from mAYE (deposit receipt token).
 *         MAYE is earned by providing liquidity over time and used for governance.
 *         Rewards accrue proportionally to deposit size, duration, and credential bonuses.
 */
contract MAYEGov is ERC20, Ownable, AccessControl {
    // ── Roles ────────────────────────────────────────────────────────

    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ── Reward State (per user) ──────────────────────────────────────

    /// @notice Total MAYE accrued but not yet claimed
    mapping(address => uint256) public rewardsAccrued;

    /// @notice The value of cumulativeRewardPerToken last paid/checkpointed for the user
    mapping(address => uint256) public userRewardPerTokenPaid;

    /// @notice User's tracked deposit balance at last snapshot (in smallest unit, scaled to 18 decimals)
    mapping(address => uint256) public lastSnapshotDeposit;

    // ── Global Reward State ──────────────────────────────────────────

    /// @notice Accumulated rewards per unit of scaled deposit (18 decimals)
    uint256 public cumulativeRewardPerToken;

    /// @notice Last timestamp the global reward state was updated
    uint256 public lastUpdateTime;

    /// @notice MAYE minted per second per unit of scaled deposit (18 decimals)
    uint256 public rewardRatePerSecond;

    /// @notice Emergency pause for reward minting
    bool public rewardsEnabled = true;

    // ── Constants ────────────────────────────────────────────────────

    uint256 public constant MAX_REWARD_RATE = 10 ether; // Cap at 10 MAYE/s
    uint256 public constant INITIAL_SUPPLY = 500_000 * 1e18; // 500K pre-minted

    // ── Events ───────────────────────────────────────────────────────

    event RewardSnapshot(address indexed user, uint256 depositBalance, uint256 accrued);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event RewardsEnabled(bool enabled);

    // ── Constructor ──────────────────────────────────────────────────

    constructor(
        address initialOwner,
        address distributor
    ) ERC20("Maya Governance Token", "MAYE") Ownable(initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(DISTRIBUTOR_ROLE, distributor);
        
        lastUpdateTime = block.timestamp;

        // Setup initial pre-mint for treasury
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    // ── Modifier ─────────────────────────────────────────────────────

    modifier updateReward(address account) {
        updateGlobalReward();
        if (account != address(0)) {
            rewardsAccrued[account] = getPendingAt(account);
            userRewardPerTokenPaid[account] = cumulativeRewardPerToken;
        }
        _;
    }

    // ── Core Functions ───────────────────────────────────────────────

    /**
     * @notice Update the global reward accumulator
     */
    function updateGlobalReward() public {
        uint256 elapsed = block.timestamp - lastUpdateTime;
        if (elapsed > 0) {
            if (rewardsEnabled && rewardRatePerSecond > 0) {
                cumulativeRewardPerToken += rewardRatePerSecond * elapsed;
            }
            lastUpdateTime = block.timestamp;
        }
    }

    /**
     * @notice Take a snapshot of user's deposit balance for proportional accrual.
     *         Called by LendingPool on every deposit and withdrawal.
     */
    function snapshotDeposit(
        address user,
        uint256 depositBalance
    ) external onlyRole(DISTRIBUTOR_ROLE) updateReward(user) {
        lastSnapshotDeposit[user] = depositBalance;
        emit RewardSnapshot(user, depositBalance, rewardsAccrued[user]);
    }

    /**
     * @notice Calculate how much MAYE a user has earned.
     */
    function getPendingAt(address user) public view returns (uint256) {
        uint256 tempCumulative = cumulativeRewardPerToken;
        uint256 elapsed = block.timestamp - lastUpdateTime;
        if (elapsed > 0 && rewardsEnabled && rewardRatePerSecond > 0) {
            tempCumulative += rewardRatePerSecond * elapsed;
        }

        uint256 pendingAccrual = (lastSnapshotDeposit[user] * (tempCumulative - userRewardPerTokenPaid[user])) / 1e18;
        return rewardsAccrued[user] + pendingAccrual;
    }

    /**
     * @notice Claim all pending MAYE rewards. Mints new tokens.
     */
    function claim() external updateReward(msg.sender) {
        require(rewardsEnabled, "Rewards disabled");

        uint256 toClaim = rewardsAccrued[msg.sender];
        require(toClaim > 0, "No rewards to claim");

        rewardsAccrued[msg.sender] = 0;

        _mint(msg.sender, toClaim);
        emit RewardClaimed(msg.sender, toClaim);
    }

    /**
     * @notice Set the global reward rate (admin only).
     */
    function setRewardRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) updateReward(address(0)) {
        require(newRate <= MAX_REWARD_RATE, "Rate exceeds cap");

        uint256 oldRate = rewardRatePerSecond;
        rewardRatePerSecond = newRate;
        emit RewardRateUpdated(oldRate, newRate);
    }

    /**
     * @notice Enable or disable rewards globally (admin only).
     */
    function setRewardsEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) updateReward(address(0)) {
        rewardsEnabled = enabled;
        emit RewardsEnabled(enabled);
    }

    /**
     * @notice Mint MAYE directly (admin only, for treasury/top-up purposes).
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
