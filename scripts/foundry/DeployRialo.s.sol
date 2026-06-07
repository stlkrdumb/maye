// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../../contracts/Tokens/MockRLO.sol";
import "../../contracts/CredentialVerifier.sol";
import "../../contracts/RialoLendingPool.sol";

/// @title DeployRialo — Deploys the privacy-preserving under-collateralized lending stack to Base Sepolia
/// @notice Run with:
///   forge script scripts/foundry/DeployRialo.s.sol --rpc-url https://base-sepolia.g.alchemy.com/v2/eo8KpCpOrZX74iQL3yZ0j --broadcast --verify \
///     --private-key $DEPLOYER_PRIVATE_KEY
contract DeployRialo is Script {
    MockRLO public mockRLO;
    CredentialVerifier public verifier;
    RialoLendingPool public pool;

    address public usdcAddress = 0x4aadaE938D355b1F8E33ACa3cB3a2b3E8A8f6F27; // New TestUSDC on Base Sepolia

    function setUp() public {}

    function run() public {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        console.log("Deployer Wallet:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerKey);

        // 1. Deploy MockRLO
        mockRLO = new MockRLO(deployer);
        console.log("MockRLO deployed at:", address(mockRLO));

        // 2. Deploy CredentialVerifier (using deployer as simulated TEE verifier for demo purposes)
        verifier = new CredentialVerifier(deployer, deployer);
        console.log("CredentialVerifier deployed at:", address(verifier));

        // 3. Deploy RialoLendingPool (1 RLO = $1 USDC)
        pool = new RialoLendingPool(
            address(mockRLO),
            usdcAddress,
            address(verifier),
            1 * 10**6, // $1 USDC price (6 decimals)
            deployer
        );
        console.log("RialoLendingPool deployed at:", address(pool));

        vm.stopBroadcast();

        console.log("\n=== Rialo Suite Deployment Summary ===");
        console.log("MockRLO:", address(mockRLO));
        console.log("CredentialVerifier:", address(verifier));
        console.log("RialoLendingPool:", address(pool));
        console.log("USDC (Underlying):", usdcAddress);
        console.log("======================================\n");
    }
}
