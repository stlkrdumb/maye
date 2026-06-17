// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/MayeDex.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * Deploy MayeDex on Base Sepolia in two steps:
 *   STEP 1 — factory + router + pair (runs below)
 *   STEP 2 — approve tokens → add liquidity (second script, after step 1 txs land)
 */
contract DeployMayeDex is Script {
    address constant DEFAULT_RLO = 0xEc3185aFbc31F2e50b5B36BB2E7afB1fC5820d64;
    address constant DEFAULT_USDC = 0x6f402aa1285e010fbc5FAc5F176Ed5c5c27D5E0C;

    function setUp() public {}

    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        vm.startBroadcast(privateKey);

        address rlo = _readAddr("RLO_TOKEN_ADDRESS", DEFAULT_RLO);
        address usdc = _readAddr("USDC_TOKEN_ADDRESS", DEFAULT_USDC);

        console.log("=== MayeDex V1 Deployment (Step 1/2) ===");
        string memory l = string.concat("RLO:    ", vm.toString(rlo));
        console.log(l);
        l = string.concat("USDC:   ", vm.toString(usdc));
        console.log(l);

        // ── Deploy Factory ──
        console.log("\n[1/3] MayeDexFactory...");
        MayeDexFactory factory = new MayeDexFactory();
        l = string.concat("  Factory: ", vm.toString(address(factory)));
        console.log(l);

        // ── Deploy Router ──
        console.log("[2/3] MayeDexRouter02...");
        MayeDexRouter02 router = new MayeDexRouter02(address(factory));
        l = string.concat("  Router:  ", vm.toString(address(router)));
        console.log(l);

        // ── Deploy Pair DIRECTLY (not via Factory) to avoid gas issues ──
        console.log("[3/3] MayeDexPair...");
        address t0 = rlo < usdc ? rlo : usdc;
        address t1 = rlo < usdc ? usdc : rlo;
        // CREATE (not CREATE2) for simplicity and smaller gas usage
        MayeDexPair pair = new MayeDexPair(t0, t1, address(factory));
        l = string.concat("  Pair:    ", vm.toString(address(pair)));
        console.log(l);

        // Tell the pair who its factory is
        pair.sync(); // just to set reserves (both zero initially — will be synced after liquidity)

        // Register in factory getPair mapping
        factory.createPair(t0, t1); // this is now a no-op since we bypassed it above, but registers the address

        console.log("\n=== Step 1 COMPLETE ===");
        console.log("Next: approve Router, then run step 2 to add liquidity.");

        vm.stopBroadcast();
    }

    function _readAddr(string memory key, address defaultVal) internal view returns (address) {
        try vm.envAddress(key) returns (address val) { return val; }
        catch                     { return defaultVal; }
    }
}
