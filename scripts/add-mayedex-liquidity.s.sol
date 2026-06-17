// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/MayeDex.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * Step 3 — Approve Router + Add initial liquidity to RLO-USDC pool
 */
contract AddMayeDexLiquidity is Script {
    address constant DEFAULT_RLO = 0xEc3185aFbc31F2e50b5B36BB2E7afB1fC5820d64;
    address constant DEFAULT_USDC = 0x6f402aa1285e010fbc5FAc5F176Ed5c5c27D5E0C;
    address constant DEFAULT_FACTORY = 0xC02600d0094c4d89a116161062fCB36927485704;

    function setUp() public {}

    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        vm.startBroadcast(privateKey);

        // Read addresses
        address rlo = _readAddr("RLO_TOKEN_ADDRESS", DEFAULT_RLO);
        address usdc = _readAddr("USDC_TOKEN_ADDRESS", DEFAULT_USDC);
        address factoryAddr = _readAddr("MAYEDEX_FACTORY", DEFAULT_FACTORY);
        address routerAddr = _readAddr("MAYEDEX_ROUTER", address(0));

        require(routerAddr != address(0), "set MAYEDEX_ROUTER env var");

        MayeDexRouter02 router = MayeDexRouter02(routerAddr);
        MayeDexFactory factory = MayeDexFactory(factoryAddr);

        console.log("----= Step 3/3 Add RLO-USDC Liquidity ----=");
        console.log("Router:", routerAddr);
        console.log("Pair:", factory.getPair(rlo, usdc));

        // Amounts: 100k RLO ($10k at $0.10 peg) + $10k USDC → initial price = $0.10/RLO
        uint256 amountRLO = 100_000 * 10**18; // 100,000 RLO (18 decimals)
        uint256 amountUSDC = 10_000 * 10**6;  // $10,000 USDC (6 decimals)

        console.log("\n[1/3] Approving Router for RLO...");
        _approve(rlo, routerAddr, amountRLO);
        console.log("  Amount:", amountRLO / 1e18);

        console.log("[2/3] Approving Router for USDC...");
        _approve(usdc, routerAddr, amountUSDC);
        console.log("  Amount:", amountUSDC / 1e6);

        console.log("\n[3/3] Adding liquidity...");
        (uint256 reserveA, uint256 reserveB, uint256 liq) = router.addLiquidity{gas: 400000}(
            rlo, usdc, amountRLO, amountUSDC, 0, 0, deployer
        );

        console.log("\n----= Pool Created ----=");
        console.log("RLO reserve:", reserveA);
        console.log("USDC reserve:", reserveB);
        console.log("LP minted:", liq);

        // Final verification
        address pairAddr = factory.getPair(rlo, usdc);
        MayeDexPair pair = MayeDexPair(pairAddr);
        console.log("\nFinal state:");
        console.log("Pair:", pairAddr);
        console.log("Reserve RLO:", pair.reserveA());
        console.log("Reserve USDC:", pair.reserveB());

        vm.stopBroadcast();
    }

    function _readAddr(string memory key, address defaultVal) internal view returns (address) {
        try vm.envAddress(key) returns (address val) { return val; }
        catch                     { return defaultVal; }
    }

    function _approve(address token, address spender, uint256 amount) internal {
        uint256 allowed = IERC20(token).allowance(msg.sender, spender);
        if (allowed < amount && allowed != type(uint256).max) {
            (bool ok,) = token.call(abi.encodeWithSignature("approve(address,uint256)", spender, type(uint256).max));
            require(ok, "approve failed");
        }
    }
}
