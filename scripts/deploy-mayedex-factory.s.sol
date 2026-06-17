// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/MayeDex.sol";

/**
 * Step 1 — Deploy Factory + Router (pair deployed separately in step 2)
 */
contract DeployMayeDexStep1 is Script {
    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);

        MayeDexFactory factory = new MayeDexFactory();
        console.log("Factory:", address(factory));

        MayeDexRouter02 router = new MayeDexRouter02(address(factory));
        console.log("Router:", address(router));

        vm.stopBroadcast();
    }
}
