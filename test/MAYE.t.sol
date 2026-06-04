// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MAYE} from "../contracts/Tokens/mAYE.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract MAYETest is Test {
    MAYE public maye;
    MockERC20 public usdc;

    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public randomUser = address(0x4);

    uint256 public constant USDC_PRECISION = 1e6;

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        maye = new MAYE(owner, address(usdc));
        vm.label(owner, "Owner");
        vm.label(user1, "User1");
        vm.label(user2, "User2");
    }

    // ============================================================
    // Constructor Tests
    // ============================================================

    function test_Ctor_SetsCorrectNameAndSymbol() public view {
        assertEq(maye.name(), "Maye Yield Token");
        assertEq(maye.symbol(), "mAYE");
    }

    function test_Ctor_SetsOwner() public view {
        assertEq(maye.owner(), owner);
    }

    function test_Ctor_SetsUnderlyingAsset() public view {
        assertEq(maye.underlyingAsset(), address(usdc));
    }

    function test_Ctor_InitialSupplyIsZero() public view {
        assertEq(maye.totalSupply(), 0);
        assertEq(maye.balanceOf(user1), 0);
    }

    // ============================================================
    // Mint Tests
    // ============================================================

    function test_Mint_FromOwner_Succeeds() public {
        uint256 amount = 10_000 * USDC_PRECISION;
        vm.prank(owner);
        maye.mint(user1, amount);

        assertEq(maye.balanceOf(user1), amount);
        assertEq(maye.totalSupply(), amount);
    }

    function test_Mint_FromOwner_ToMultipleUsers() public {
        vm.prank(owner);
        maye.mint(user1, 5_000 * USDC_PRECISION);
        vm.prank(owner);
        maye.mint(user2, 3_000 * USDC_PRECISION);

        assertEq(maye.balanceOf(user1), 5_000 * USDC_PRECISION);
        assertEq(maye.balanceOf(user2), 3_000 * USDC_PRECISION);
        assertEq(maye.totalSupply(), 8_000 * USDC_PRECISION);
    }

    function test_Mint_FromOwner_EmitsNoEventButIncreasesSupply() public {
        uint256 amount = 1_000 * USDC_PRECISION;
        vm.prank(owner);
        maye.mint(user1, amount);
        assertEq(maye.totalSupply(), amount);
    }

    function test_Mint_FromOwner_LargeAmount() public {
        uint256 largeAmount = 1_000_000 * USDC_PRECISION; // $1M mAYE
        vm.prank(owner);
        maye.mint(user1, largeAmount);

        assertEq(maye.balanceOf(user1), largeAmount);
    }

    function test_Mint_CannotBeCalledByNonOwner() public {
        vm.expectRevert();
        vm.prank(randomUser);
        maye.mint(user1, 1000 * USDC_PRECISION);
    }

    // ============================================================
    // Burn Tests
    // ============================================================

    function test_Burn_FromOwner_Succeeds() public {
        uint256 amount = 10_000 * USDC_PRECISION;
        vm.prank(owner);
        maye.mint(user1, amount);
        vm.prank(owner);
        maye.burn(user1, amount);

        assertEq(maye.balanceOf(user1), 0);
        assertEq(maye.totalSupply(), 0);
    }

    function test_Burn_FromOwner_PartialBurn() public {
        uint256 amount = 5_000 * USDC_PRECISION;
        vm.prank(owner);
        maye.mint(user1, amount);
        vm.prank(owner);
        maye.burn(user1, 2_000 * USDC_PRECISION);

        assertEq(maye.balanceOf(user1), 3_000 * USDC_PRECISION);
        assertEq(maye.totalSupply(), 3_000 * USDC_PRECISION);
    }

    function test_Burn_FromOwner_CannotExceedBalance() public {
        vm.prank(owner);
        maye.mint(user1, 1_000 * USDC_PRECISION);

        vm.expectRevert(); // Burn exceeds balance
        vm.prank(owner);
        maye.burn(user1, 2_000 * USDC_PRECISION);
    }

    function test_Burn_FromOwner_CannotBurnFromZeroBalance() public {
        vm.expectRevert(); // Burn from address with zero balance
        vm.prank(owner);
        maye.burn(randomUser, 1000);
    }

    function test_Burn_ZeroAmount_Succeeds() public {
        vm.prank(owner);
        maye.mint(user1, 1_000 * USDC_PRECISION);
        vm.prank(owner);
        maye.burn(user1, 0);

        assertEq(maye.balanceOf(user1), 1_000 * USDC_PRECISION);
    }

    function test_Burn_CannotBeCalledByNonOwner() public {
        vm.prank(owner);
        maye.mint(user1, 1_000 * USDC_PRECISION);

        vm.expectRevert();
        vm.prank(randomUser);
        maye.burn(user1, 500 * USDC_PRECISION);
    }

    // ============================================================
    // Transfer Tests (Standard ERC20)
    // ============================================================

    function test_Transfer_FromMintedTokens_Succeeds() public {
        vm.prank(owner);
        maye.mint(user1, 5_000 * USDC_PRECISION);

        vm.prank(user1);
        bool success = maye.transfer(user2, 2_000 * USDC_PRECISION);
        assertTrue(success);

        assertEq(maye.balanceOf(user1), 3_000 * USDC_PRECISION);
        assertEq(maye.balanceOf(user2), 2_000 * USDC_PRECISION);
    }

    function test_Transfer_RejectsInsufficientBalance() public {
        vm.prank(owner);
        maye.mint(user1, 1_000 * USDC_PRECISION);

        // OZ v5 reverts on insufficient balance
        vm.expectRevert();
        vm.prank(user1);
        maye.transfer(user2, 2_000 * USDC_PRECISION);

        assertEq(maye.balanceOf(user1), 1_000 * USDC_PRECISION); // unchanged
    }

    function test_Transfer_ToSelf() public {
        vm.prank(owner);
        maye.mint(user1, 5_000 * USDC_PRECISION);

        vm.prank(user1);
        maye.transfer(user1, 1_000 * USDC_PRECISION);

        assertEq(maye.balanceOf(user1), 5_000 * USDC_PRECISION); // unchanged
    }

    // ============================================================
    // Allowance / TransferFrom Tests (Standard ERC20)
    // ============================================================

    function test_ApproveAndTransferFrom_Succeeds() public {
        vm.prank(owner);
        maye.mint(user1, 5_000 * USDC_PRECISION);

        vm.prank(user1);
        maye.approve(user2, 3_000 * USDC_PRECISION);
        assertEq(maye.allowance(user1, user2), 3_000 * USDC_PRECISION);

        vm.prank(user2);
        bool success = maye.transferFrom(user1, user2, 3_000 * USDC_PRECISION);
        assertTrue(success);

        assertEq(maye.balanceOf(user1), 2_000 * USDC_PRECISION);
        assertEq(maye.balanceOf(user2), 3_000 * USDC_PRECISION);
        assertEq(maye.allowance(user1, user2), 0);
    }

    function test_Approve_IncreasesAllowance() public {
        vm.prank(owner);
        maye.mint(user1, 5_000 * USDC_PRECISION);

        vm.prank(user1);
        maye.approve(user2, 2_000 * USDC_PRECISION);
        assertEq(maye.allowance(user1, user2), 2_000 * USDC_PRECISION);

        vm.prank(user1);
        maye.approve(user2, 3_000 * USDC_PRECISION);
        assertEq(maye.allowance(user1, user2), 3_000 * USDC_PRECISION);
    }

    // ============================================================
    // RecoverERC20 Tests
    // ============================================================

    function test_RecoverERC20_FromOwner_Succeeds() public {
        uint256 sentAmount = 1_000 * USDC_PRECISION;
        usdc.mint(address(maye), sentAmount);

        assertEq(usdc.balanceOf(address(maye)), sentAmount);

        vm.prank(owner);
        maye.recoverERC20(address(usdc), sentAmount);

        assertEq(usdc.balanceOf(address(maye)), 0);
        assertEq(usdc.balanceOf(owner), sentAmount);
    }

    function test_RecoverERC20_FromOwner_PartialRecovery() public {
        usdc.mint(address(maye), 5_000 * USDC_PRECISION);

        vm.prank(owner);
        maye.recoverERC20(address(usdc), 2_000 * USDC_PRECISION);

        assertEq(usdc.balanceOf(address(maye)), 3_000 * USDC_PRECISION);
    }

    function test_RecoverERC20_CannotBeCalledByNonOwner() public {
        usdc.mint(address(maye), 1_000 * USDC_PRECISION);

        vm.expectRevert();
        vm.prank(randomUser);
        maye.recoverERC20(address(usdc), 500 * USDC_PRECISION);
    }

    function test_RecoverERC20_RecoversToOwner() public {
        usdc.mint(address(maye), 1_000 * USDC_PRECISION);

        vm.prank(owner);
        maye.recoverERC20(address(usdc), 1_000 * USDC_PRECISION);

        assertEq(usdc.balanceOf(owner), 1_000 * USDC_PRECISION);
    }

    // ============================================================
    // ERC20 Interface Tests
    // ============================================================

    function test_Decimals_ReturnsDefault() public view {
        assertEq(maye.decimals(), 18);
    }

    function test_TotalSupply_UpdatesAfterMint() public {
        vm.prank(owner);
        maye.mint(user1, 10_000 * USDC_PRECISION);
        assertEq(maye.totalSupply(), 10_000 * USDC_PRECISION);
    }

    function test_TotalSupply_DecreasesAfterBurn() public {
        vm.prank(owner);
        maye.mint(user1, 10_000 * USDC_PRECISION);
        vm.prank(owner);
        maye.burn(user1, 3_000 * USDC_PRECISION);
        assertEq(maye.totalSupply(), 7_000 * USDC_PRECISION);
    }

    // ============================================================
    // Fuzz Tests
    // ============================================================

    function test_Fuzz_MintBalance(uint256 amount) public {
        uint256 capped = bound(amount, 1, 1_000_000 * USDC_PRECISION);
        vm.prank(owner);
        maye.mint(user1, capped);
        assertEq(maye.balanceOf(user1), capped);
    }

    function test_Fuzz_MintBurnCycle(uint256 mintAmount, uint256 burnRatio) public {
        uint256 amt = bound(mintAmount, 1, 1_000_000 * USDC_PRECISION);
        uint256 ratio = bound(burnRatio, 0, 100);

        vm.prank(owner);
        maye.mint(user1, amt);

        uint256 burnAmt = (amt * ratio) / 100;
        vm.prank(owner);
        maye.burn(user1, burnAmt);

        assertEq(maye.totalSupply(), amt - burnAmt);
    }

    function test_Fuzz_TransferFromBalance(uint256 balance, uint256 transferAmt) public {
        uint256 b = bound(balance, 1, 1_000_000 * USDC_PRECISION);
        uint256 t = bound(transferAmt, 0, b);

        vm.prank(owner);
        maye.mint(user1, b);
        vm.prank(user1);
        maye.approve(user2, t);

        vm.prank(user2);
        maye.transferFrom(user1, user2, t);

        assertEq(maye.balanceOf(user1), b - t);
        assertEq(maye.balanceOf(user2), t);
    }
}
