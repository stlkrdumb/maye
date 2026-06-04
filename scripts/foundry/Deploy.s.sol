// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../../contracts/BorrowerRegistry.sol";
import "../../contracts/Tokens/mAYE.sol";
import "../../contracts/Tokens/TestUSDC.sol";
import "../../contracts/Tokens/bAYE.sol";
import "../../contracts/LendingPool.sol";

/// @title Deploy — Deploys all Maye contracts to Base Sepolia
/// @notice Run with:
///   forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify \
///     --private-key $DEPLOYER_PRIVATE_KEY --etherscan-api-key $BASESCAN_API_KEY
contract Deploy is Script {
    BorrowerRegistry public borrowerRegistry;
    TestUSDC public testUSDC;
    MAYE public mayeToken;
    bAYE public debtToken;
    MayeLendingPool public lendingPool;

    function setUp() public {}

    function run() public {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerKey);

        // 1. Deploy TestUSDC (mintable testnet token)
        testUSDC = new TestUSDC(deployer);
        console.log("TestUSDC deployed at:", address(testUSDC));

        // 2. Deploy BorrowerRegistry
        borrowerRegistry = new BorrowerRegistry(deployer);
        console.log("BorrowerRegistry deployed at:", address(borrowerRegistry));

        // 3. Deploy bAYE Debt NFT
        debtToken = new bAYE();
        console.log("bAYE NFT deployed at:", address(debtToken));

        // 4. Deploy mAYE token (backed by TestUSDC)
        mayeToken = new MAYE(deployer, address(testUSDC));
        console.log("mAYE deployed at:", address(mayeToken));

        // 5. Deploy LendingPool (uses TestUSDC)
        lendingPool = new MayeLendingPool(address(testUSDC), deployer);
        console.log("MayeLendingPool deployed at:", address(lendingPool));

        // 6. Set up cross-contract references
        lendingPool.setCreditOracle(address(borrowerRegistry));
        lendingPool.setDebtToken(address(debtToken));
        debtToken.setLendingPool(address(lendingPool));
        
        console.log("Protocol logic linked and permissions set.");

        vm.stopBroadcast();

        // 7. Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("TestUSDC:", address(testUSDC));
        console.log("BorrowerRegistry:", address(borrowerRegistry));
        console.log("bAYE NFT:", address(debtToken));
        console.log("mAYE Token:", address(mayeToken));
        console.log("LendingPool:", address(lendingPool));
        console.log("==========================\n");

        // Write deployment data to a JSON file for frontend consumption
        string memory json = vm.serializeAddress(
            "deployment",
            "testUSDC",
            address(testUSDC)
        );
        json = vm.serializeAddress(json, "borrowerRegistry", address(borrowerRegistry));
        json = vm.serializeAddress(json, "bAYE", address(debtToken));
        json = vm.serializeAddress(json, "mAYE", address(mayeToken));
        json = vm.serializeAddress(json, "lendingPool", address(lendingPool));
        console.log("Deployment addresses:");
        console.log(json);
    }
}
