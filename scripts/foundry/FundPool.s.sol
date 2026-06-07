// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../../contracts/Tokens/TestUSDC.sol";

contract FundPool is Script {
    address public rialoPool = 0x9B477864e3984b4Ec5067ba8f33611F0F315d061;
    address public usdcAddress = 0x4aadaE938D355b1F8E33ACa3cB3a2b3E8A8f6F27;

    function run() public {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        // Mint 500,000 USDC directly to RialoLendingPool
        uint256 mintAmount = 500_000 * 1e6; // 500k USDC
        TestUSDC(usdcAddress).mint(rialoPool, mintAmount);
        console.log("Minted %s USDC directly to RialoLendingPool", mintAmount);

        vm.stopBroadcast();

        console.log("\n=== Funding Summary ===");
        console.log("USDC Address:", usdcAddress);
        console.log("RialoPool Address:", rialoPool);
        console.log("Minted to Pool:", mintAmount / 1e6, "USDC");
        console.log("=======================\n");
    }
}
