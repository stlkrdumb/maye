// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";

/// @title VerifyAll — Verifies deployed contracts on Basescan Sepolia
/// @notice Run with:
///   forge script script/VerifyAll.s.sol --rpc-url base_sepolia \
///     --private-key $DEPLOYER_PRIVATE_KEY --verify \
///     --etherscan-api-key $BASESCAN_API_KEY
///
/// Or verify manually with:
///   forge verify-contract --chain 84532 --constructor-args <args> \
///     --num-of-optimization-runs 200 --watch <address> BorrowerRegistry
contract VerifyAll is Script {
    // Update these addresses after deployment
    address BORROWER_REGISTRY = vm.envOr("BORROWER_REGISTRY", address(0));
    address MAYE_TOKEN = vm.envOr("MAYE_TOKEN", address(0));
    address LENDING_POOL = vm.envOr("LENDING_POOL", address(0));

    // Base Sepolia USDC
    address constant USDC = 0x03871De2d4e0b6356fd4a977581bc70764077895;

    function setUp() public {}

    function run() public {
        string memory apiKey = vm.envString("BASESCAN_API_KEY");
        console.log("Verifying contracts on Base Sepolia (chain 84532)...\n");

        // 1. Verify BorrowerRegistry(address)
        if (BORROWER_REGISTRY != address(0)) {
            bytes32 constructorArgs = abi.encode(BORROWER_REGISTRY); // deployer = owner
            console.log("Verifying BorrowerRegistry at", BORROWER_REGISTRY);
            vm.setEnv("CONSTRUCTOR_ARGS", vm.toString(constructorArgs));
            // Run: forge verify-contract --chain 84532 --constructor-args <hex> --watch <addr> BorrowerRegistry
            console.log("Command: forge verify-contract --chain 84532 --constructor-args 0x", " --watch ", BORROWER_REGISTRY, " BorrowerRegistry");
        }

        // 2. Verify mAYE(address, address)
        if (MAYE_TOKEN != address(0)) {
            console.log("Verifying mAYE at", MAYE_TOKEN);
            console.log("Command: forge verify-contract --chain 84532 --constructor-args 0x", " --watch ", MAYE_TOKEN, " MAYE");
        }

        // 3. Verify LendingPool(address, address)
        if (LENDING_POOL != address(0)) {
            console.log("Verifying LendingPool at", LENDING_POOL);
            console.log("Command: forge verify-contract --chain 84532 --constructor-args 0x", " --watch ", LENDING_POOL, " MayeLendingPool");
        }

        console.log("\n=== Manual Verification Steps ===");
        console.log("1. Run the deploy script with --broadcast --verify flag for auto-verification");
        console.log("2. Or use the commands above for each contract");
        console.log("3. Constructor args are ABI-encoded constructor parameters as hex");
    }
}
