// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MayeDexFactory, MayeDexRouter02, MayeDexPair} from "../contracts/MayeDex.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract MayeDexTest is Test {
    MayeDexFactory public factory;
    MayeDexRouter02 public router;
    MockERC20 public rlo;
    MockERC20 public usdc;

    address public user = address(0x99);

    function setUp() public {
        factory = new MayeDexFactory();
        router = new MayeDexRouter02(address(factory));
        
        rlo = new MockERC20("Rialo Token", "RLO", 18);
        usdc = new MockERC20("USD Coin", "USDC", 6);

        rlo.mint(user, 1_000_000 * 1e18);
        usdc.mint(user, 100_000 * 1e6);
    }

    function test_AddLiquidityAndSwap() public {
        vm.startPrank(user);

        // Approve Router
        rlo.approve(address(router), type(uint256).max);
        usdc.approve(address(router), type(uint256).max);

        // Add liquidity
        // 100k RLO (18 decimals) and 10k USDC (6 decimals)
        uint256 amtRLO = 100_000 * 1e18;
        uint256 amtUSDC = 10_000 * 1e6;

        router.addLiquidity(
            address(rlo),
            address(usdc),
            amtRLO,
            amtUSDC,
            0,
            0,
            user
        );

        address pairAddress = factory.getPair(address(rlo), address(usdc));
        assertTrue(pairAddress != address(0), "Pair should be created");

        MayeDexPair pair = MayeDexPair(pairAddress);
        
        // Check reserves
        uint256 rA = pair.reserveA();
        uint256 rB = pair.reserveB();
        
        // Assert correct reserves (T0/T1 are sorted by address)
        if (address(rlo) < address(usdc)) {
            assertEq(rA, amtRLO);
            assertEq(rB, amtUSDC);
        } else {
            assertEq(rA, amtUSDC);
            assertEq(rB, amtRLO);
        }

        // Swap RLO for USDC
        // User has 900k RLO left, 90k USDC left
        uint256 swapAmtRLO = 1_000 * 1e18;
        uint256 balanceUSDCOld = usdc.balanceOf(user);

        address[] memory path = new address[](2);
        path[0] = address(rlo);
        path[1] = address(usdc);

        // Calculate expected output
        (uint256 resRLO, uint256 resUSDC) = router.getReserves(address(rlo), address(usdc));
        uint256 expectedOut = router.getAmountOut(swapAmtRLO, resRLO, resUSDC);
        assertTrue(expectedOut > 0, "Expected output should be > 0");

        router.swapExactTokensForTokens(
            swapAmtRLO,
            expectedOut,
            path,
            user
        );

        uint256 balanceUSDCNew = usdc.balanceOf(user);
        assertEq(balanceUSDCNew - balanceUSDCOld, expectedOut);

        // Swap USDC for RLO
        uint256 swapAmtUSDC = 100 * 1e6;
        uint256 balanceRLOOld = rlo.balanceOf(user);

        path[0] = address(usdc);
        path[1] = address(rlo);

        (resUSDC, resRLO) = router.getReserves(address(usdc), address(rlo));
        expectedOut = router.getAmountOut(swapAmtUSDC, resUSDC, resRLO);

        router.swapExactTokensForTokens(
            swapAmtUSDC,
            expectedOut,
            path,
            user
        );

        uint256 balanceRLONew = rlo.balanceOf(user);
        assertEq(balanceRLONew - balanceRLOOld, expectedOut);

        vm.stopPrank();
    }
}
