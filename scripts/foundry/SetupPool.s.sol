// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../../contracts/LendingPool.sol";
import "../../contracts/BorrowerRegistry.sol";

/// @title SetupPool — Configures the LendingPool after deployment
/// @notice Run with:
///   forge script script/SetupPool.s.sol --rpc-url base_sepolia \
///     --private-key $DEPLOYER_PRIVATE_KEY
///
/// Configures:
/// - Credit oracle address
/// - Pool config (interest rates, limits)
/// - Registers test borrower
contract SetupPool is Script {
    address constant LENDING_POOL_ADDR = 0xYOUR_LENDING_POOL; // update after deploy
    address constant BORROWER_REGISTRY_ADDR = 0xYOUR_REGISTRY; // update after deploy

    function setUp() public {}

    function run() public {
        uint256 adminKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        console.log("Admin:", vm.addr(adminKey));

        vm.startBroadcast(adminKey);

        MayeLendingPool pool = MayeLendingPool(LENDING_POOL_ADDR);
        BorrowerRegistry registry = BorrowerRegistry(BORROWER_REGISTRY_ADDR);

        // 1. Set credit oracle
        pool.setCreditOracle(BORROWER_REGISTRY_ADDR);
        console.log("Credit oracle set to:", BORROWER_REGISTRY_ADDR);

        // 2. Update pool config (optional — defaults are reasonable)
        // PoolConfig(uint256 minCreditScore, uint256 maxLoanAmount,
        //            uint256 baseInterestRate, uint256 interestRateStep,
        //            uint256 minLoanDuration, uint256 maxLoanDuration)
        pool.updatePoolConfig(
            MayeLendingPool.PoolConfig({
                minCreditScore: 580,
                maxLoanAmount: 50_000_000,      // 50 USDC
                baseInterestRate: 1200,         // 12% APR
                interestRateStep: 200,          // +2% per tier
                minLoanDuration: 7 days,
                maxLoanDuration: 365 days
            })
        );
        console.log("Pool config updated");

        // 3. Register a test borrower
        address testBorrower = vm.envAddress("TEST_BORROWER");
        registry.registerBorrower();
        console.log("Test borrower registered:", testBorrower);

        vm.stopBroadcast();

        console.log("\n=== Setup Complete ===");
        console.log("Pool:", LENDING_POOL_ADDR);
        console.log("Registry:", BORROWER_REGISTRY_ADDR);
    }
}
