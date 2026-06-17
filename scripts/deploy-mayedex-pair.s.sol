// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/MayeDex.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * Step 2 — Deploy Pair + register in Factory
 */
contract DeployMayeDexStep2 is Script {
    address constant DEFAULT_RLO = 0xEc3185aFbc31F2e50b5B36BB2E7afB1fC5820d64;
    address constant DEFAULT_USDC = 0x6f402aa1285e010fbc5FAc5F176Ed5c5c27D5E0C;

    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        vm.startBroadcast(privateKey);

        // Get addresses from env
        address rlo = _readAddr("RLO_TOKEN_ADDRESS", DEFAULT_RLO);
        address usdc = _readAddr("USDC_TOKEN_ADDRESS", DEFAULT_USDC);
        address factoryAddr = _readAddr("MAYEDEX_FACTORY", address(0));
        require(factoryAddr != address(0), "set MAYEDEX_FACTORY env var");

        console.log("RLO:", rlo);
        console.log("USDC:", usdc);
        console.log("Factory:", factoryAddr);

        // Register pair in factory (before deployment, so getPair returns the addr)
        address t0 = rlo < usdc ? rlo : usdc;
        address t1 = rlo < usdc ? usdc : rlo;
        
        // Use factory.createPair to register + deploy via CREATE2
        MayeDexFactory(factoryAddr).createPair(rlo, usdc);
        
        address pair = MayeDexFactory(factoryAddr).getPair(t0, t1);
        console.log("Pair:", pair);

        vm.stopBroadcast();
    }

    function _readAddr(string memory key, address defaultVal) internal view returns (address) {
        try vm.envAddress(key) returns (address val) { return val; }
        catch                     { return defaultVal; }
    }
}
