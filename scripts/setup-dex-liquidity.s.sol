// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../contracts/MayeDex.sol";
import "../contracts/Tokens/MockRLO.sol";
import "../contracts/Tokens/TestUSDC.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SetupDexLiquidity is Script {
    address constant RLO = 0xEc3185aFbc31F2e50b5B36BB2E7afB1fC5820d64;
    address constant USDC = 0x6f402aa1285e010fbc5FAc5F176Ed5c5c27D5E0C;
    address constant MAYE = 0xD63A89A014f37c229E25d2fb85c88a3479e50583;
    
    address constant FACTORY = 0xC90b0568B8A6ea8eC00c8dcf59E208E9C2aa77f8;
    address constant ROUTER = 0xaCd63A02E2Fcaf90459525112f34a2e83759AB65;

    function run() public {
        uint256 privateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        vm.startBroadcast(privateKey);

        MayeDexFactory factory = MayeDexFactory(FACTORY);
        MayeDexRouter02 router = MayeDexRouter02(ROUTER);

        // 1. Ensure RLO-USDC Pair is created in factory
        address rloUsdcPair = factory.getPair(RLO, USDC);
        if (rloUsdcPair == address(0)) {
            rloUsdcPair = factory.createPair(RLO, USDC);
            console.log("Created RLO-USDC Pair at:", rloUsdcPair);
        } else {
            console.log("RLO-USDC Pair already exists at:", rloUsdcPair);
        }

        // 2. Ensure MAYE-USDC Pair is created in factory
        address mayeUsdcPair = factory.getPair(MAYE, USDC);
        if (mayeUsdcPair == address(0)) {
            mayeUsdcPair = factory.createPair(MAYE, USDC);
            console.log("Created MAYE-USDC Pair at:", mayeUsdcPair);
        } else {
            console.log("MAYE-USDC Pair already exists at:", mayeUsdcPair);
        }

        // 3. Mint/Ensure deployer has tokens
        MockRLO(RLO).mint(deployer, 200_000 * 1e18);
        TestUSDC(USDC).mint(deployer, 100_000 * 1e6);

        // 4. Approve router
        IERC20(RLO).approve(ROUTER, type(uint256).max);
        IERC20(USDC).approve(ROUTER, type(uint256).max);
        IERC20(MAYE).approve(ROUTER, type(uint256).max);

        // 5. Add RLO-USDC liquidity: 100,000 RLO + 10,000 USDC ($0.10 per RLO)
        console.log("Adding RLO-USDC liquidity...");
        router.addLiquidity(RLO, USDC, 100_000 * 1e18, 10_000 * 1e6, 0, 0, deployer);

        // 6. Add MAYE-USDC liquidity: 10,000 MAYE + 10,000 USDC ($1.00 per MAYE)
        console.log("Adding MAYE-USDC liquidity...");
        router.addLiquidity(MAYE, USDC, 10_000 * 1e18, 10_000 * 1e6, 0, 0, deployer);

        console.log("Liquidity setup completed!");
        console.log("RLO-USDC Pair reserves:", MayeDexPair(rloUsdcPair).reserveA(), MayeDexPair(rloUsdcPair).reserveB());
        console.log("MAYE-USDC Pair reserves:", MayeDexPair(mayeUsdcPair).reserveA(), MayeDexPair(mayeUsdcPair).reserveB());

        vm.stopBroadcast();
    }
}
