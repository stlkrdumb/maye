// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../../contracts/BorrowerRegistry.sol";
import "../../contracts/Tokens/mAYE.sol";
import "../../contracts/Tokens/TestUSDC.sol";
import "../../contracts/Tokens/bAYE.sol";
import "../../contracts/Tokens/MAYEGov.sol";
import "../../contracts/Tokens/MockRLO.sol";
import "../../contracts/LendingPool.sol";
import "../../contracts/RialoLendingPool.sol";
import "../../contracts/CredentialVerifier.sol";

/// @title Deploy — Deploys all Maye contracts to Base Sepolia
/// @notice Run with:
///   forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify \
///     --private-key $DEPLOYER_PRIVATE_KEY --etherscan-api-key $BASESCAN_API_KEY
contract Deploy is Script {
    BorrowerRegistry public borrowerRegistry;
    TestUSDC public testUSDC;
    MAYE public mayeToken;
    MAYEGov public mayeGovToken;
    bAYE public debtToken;
    MayeLendingPool public lendingPool;
    CredentialVerifier public credentialVerifier;
    MockRLO public mockRLO;
    RialoLendingPool public rialoLendingPool;

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

        // 6. Deploy Credential Verifier (using deployer as a mock TEE signer for now)
        credentialVerifier = new CredentialVerifier(deployer, deployer);
        console.log("CredentialVerifier deployed at:", address(credentialVerifier));

        // 7. Deploy MAYEGov reward token
        mayeGovToken = new MAYEGov(deployer, address(lendingPool));
        console.log("MAYEGov Token deployed at:", address(mayeGovToken));

        // 8. Set up cross-contract references
        lendingPool.setCreditOracle(address(borrowerRegistry));
        lendingPool.setDebtToken(address(debtToken));
        lendingPool.setRewardToken(address(mayeGovToken));
        lendingPool.setCredentialVerifier(address(credentialVerifier));
        debtToken.setLendingPool(address(lendingPool));
        
        // 9. Enable initial reward rate (e.g. 0.001 MAYE/s = 1e15 wei)
        mayeGovToken.setRewardRate(1_000_000_000_000_000);

        // 10. Deploy MockRLO (collateral token)
        mockRLO = new MockRLO(deployer);
        console.log("MockRLO deployed at:", address(mockRLO));

        // 11. Deploy RialoLendingPool
        rialoLendingPool = new RialoLendingPool(
            address(mockRLO),
            address(testUSDC),
            address(credentialVerifier),
            100000, // $0.10 initial peg (6 decimals)
            deployer
        );
        console.log("RialoLendingPool deployed at:", address(rialoLendingPool));

        // 12. Fund RialoLendingPool with USDC liquidity so it can offer loans
        testUSDC.mint(address(rialoLendingPool), 5_000_000 * 1e6); // $5M USDC
        console.log("RialoLendingPool seeded with 5,000,000 USDC liquidity.");
        
        console.log("Protocol logic linked and permissions set.");

        vm.stopBroadcast();

        // 13. Log deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("TestUSDC:", address(testUSDC));
        console.log("BorrowerRegistry:", address(borrowerRegistry));
        console.log("CredentialVerifier:", address(credentialVerifier));
        console.log("bAYE NFT:", address(debtToken));
        console.log("mAYE Receipt Token:", address(mayeToken));
        console.log("MAYEGov Reward Token:", address(mayeGovToken));
        console.log("LendingPool:", address(lendingPool));
        console.log("MockRLO:", address(mockRLO));
        console.log("RialoLendingPool:", address(rialoLendingPool));
        console.log("==========================\n");

        // Write deployment data to a JSON file for frontend consumption
        string memory json = vm.serializeAddress(
            "deployment",
            "testUSDC",
            address(testUSDC)
        );
        json = vm.serializeAddress(json, "borrowerRegistry", address(borrowerRegistry));
        json = vm.serializeAddress(json, "credentialVerifier", address(credentialVerifier));
        json = vm.serializeAddress(json, "bAYE", address(debtToken));
        json = vm.serializeAddress(json, "mAYE", address(mayeToken));
        json = vm.serializeAddress(json, "mayeGovernance", address(mayeGovToken));
        json = vm.serializeAddress(json, "lendingPool", address(lendingPool));
        json = vm.serializeAddress(json, "mockRLO", address(mockRLO));
        json = vm.serializeAddress(json, "rialoLendingPool", address(rialoLendingPool));
        console.log("Deployment addresses:");
        console.log(json);
    }
}
