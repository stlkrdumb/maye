// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../../contracts/Tokens/TestUSDC.sol";

/// @title DeployTestUSDC — Deploys only the TestUSDC token
/// @notice Run with:
///   forge script scripts/foundry/DeployTestUSDC.s.sol --rpc-url base_sepolia \
///     --broadcast --verify --private-key $DEPLOYER_PRIVATE_KEY --etherscan-api-key $BASESCAN_API_KEY
contract DeployTestUSDC is Script {
    TestUSDC public testUSDC;

    function setUp() public {}

    function run() public {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerKey);

        testUSDC = new TestUSDC(deployer);
        console.log("TestUSDC deployed at:", address(testUSDC));

        vm.stopBroadcast();

        console.log("\n=== TestUSDC Deployed ===");
        console.log("Address:", address(testUSDC));
        console.log("==========================\n");
    }
}
