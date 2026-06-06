// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../../contracts/Tokens/TestUSDC.sol";

contract FundPool is Script {
    function run() public {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address pool = 0xFE3F04af1ad5c83740d731B06CA4316F13402C7a;
        address usdcAddress = 0x19fc415Cd4c0C68981E40c4A9C7688CEc485C624;

        vm.startBroadcast(deployerKey);
        // Attempt to mint 1,000,000 USDC directly to the pool contract
        TestUSDC(usdcAddress).mint(pool, 1_000_000 * 1e6);
        vm.stopBroadcast();
    }
}
