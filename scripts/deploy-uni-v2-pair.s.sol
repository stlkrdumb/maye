// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "uniswap-v2-core/contracts/UniswapV2Factory.sol";
import "uniswap-v2-core/interfaces/IUniswapV2Pair.sol";
import "uniswap-v2-periphery/contracts/UniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Deploy Uniswap V2 Factory + Router on Base Sepolia, then create the RLO-TestUSDC pool
 *         and add initial liquidity. Run:
 *           forge script scripts/deploy-uni-v2-pair.s.sol --rpc-url $RPC_URL --private-key $KEY --broadcast --legacy -vvv
 */
contract DeployUniswapV2Pair is Script {
    // Base Sepolia WETH address (L2 standard)
    address constant BASE_SEPOLIA_WETH = 0x4200000000000000000000000000000000000006;

    function setUp() public {}

    function run() public {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        vm.startBroadcast(privateKey);

        // 1. Deploy Uni V2 Factory + Router
        console.log("[1/5] Deploying Uniswap V2 Factory...");
        UniswapV2Factory factory = new UniswapV2Factory(deployer);
        console.logAddress("  Factory deployed at:", address(factory));

        console.log("[2/5] Deploying Uniswap V2 Router02...");
        UniswapV2Router02 router = new UniswapV2Router02(address(factory), BASE_SEPOLIA_WETH);
        console.logAddress("  Router deployed at:", address(router));

        // 2. Read token addresses from env
        address rlo = vm.envAddress("RLO_TOKEN_ADDRESS");
        address usdc = vm.envAddress("USDC_TOKEN_ADDRESS");

        require(rlo != address(0) && usdc != address(0), "Token addresses required");
        console.logAddress("  RLO token:      ", rlo);
        console.logAddress("  TestUSDC token:  ", usdc);

        // 3. Approve the Router to spend both tokens
        uint256 amountRLO = 100_000 * 10**18;   // 100k RLO (18 decimals)
        uint256 amountUSDC = 10_000 * 10**6;    // $10k USDC (6 decimals)

        console.log("[3/5] Approving Router for", amountRLO / 1e18, "RLO...");
        _approve(rlo, address(router), amountRLO);

        console.log("[4/5] Approving Router for", amountUSDC / 1e6, "USDC...");
        _approve(usdc, address(router), amountUSDC);

        // 4. Create pair + add initial liquidity (auto-created on first call)
        console.log("[5/5] Adding initial liquidity to RLO-USDC pool...");
        (uint256 AmtA, uint256 AmtB, uint256 Liquidity) = router.addLiquidity(
            rlo,
            usdc,
            amountRLO,
            amountUSDC,
            0, // minA — we want the full desired amount
            0, // minB
            deployer,
            block.timestamp + 3600
        );

        console.log("  Pair created & liquidity added!");
        console.logUint("    RLO provided:", AmtA);
        console.logUint("    USDC provided:", AmtB);
        console.logUint("    LP Tokens minted:", Liquidity);

        // 5. Verify pair exists
        IUniswapV2Pair pair = IUniswapV2Pair(factory.getPair(rlo, usdc));
        require(address(pair) != address(0), "Pair not created!");
        console.logAddress("  Pool contract:", address(pair));

        (uint112 reserveA, uint112 reserveB,) = (pair.reserve0(), pair.reserve1(), 0);
        console.logUint("    Reserve RLO:     ", reserveA);
        console.logUint("    Reserve USDC:    ", reserveB);

        vm.stopBroadcast();
    }

    // Helper: call approve on a token
    function _approve(address token, address spender, uint256 amount) internal {
        (bool ok,) = token.call(abi.encodeWithSignature("approve(address,uint256)", spender, amount));
        require(ok, "Approval failed");
    }
}
