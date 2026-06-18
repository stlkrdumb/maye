// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/MayeDex.sol";

contract DeployNewDex is Script {
    function run() public {
        uint256 privateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        MayeDexFactory factory = new MayeDexFactory();
        MayeDexRouter02 router = new MayeDexRouter02(address(factory));

        console.log("New Factory deployed at:", address(factory));
        console.log("New Router deployed at:", address(router));

        vm.stopBroadcast();
    }
}
