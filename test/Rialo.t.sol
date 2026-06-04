// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {CredentialVerifier} from "../contracts/CredentialVerifier.sol";
import {RialoLendingPool} from "../contracts/RialoLendingPool.sol";

contract RialoLendingPoolTest is Test {
    MockERC20 public weth;  // Collateral (18 decimals)
    MockERC20 public usdc;  // Lending Token (6 decimals)
    CredentialVerifier public verifier;
    RialoLendingPool public pool;

    address public owner = address(0x1);
    address public borrower = address(0x2);
    address public liquidator = address(0x3);

    // Private key for TEE simulator to sign on-chain attestations
    uint256 public teePrivateKey = 0x9999;
    address public teeVerifierAddress;

    uint256 public constant USDC_PRECISION = 1e6;
    uint256 public constant WETH_PRECISION = 1e18;

    function setUp() public {
        teeVerifierAddress = vm.addr(teePrivateKey);

        // Deploy Mock Tokens
        weth = new MockERC20("Wrapped Ether", "WETH", 18);
        usdc = new MockERC20("USD Coin", "USDC", 6);

        // Deploy Registry & Verifier
        verifier = new CredentialVerifier(teeVerifierAddress, owner);

        // Deploy Lending Pool (WETH Collateral, USDC Loan, 3000 USD/WETH price)
        pool = new RialoLendingPool(
            address(weth),
            address(usdc),
            address(verifier),
            3000 * USDC_PRECISION, // 1 WETH = $3000 USDC
            owner
        );

        // Mint USDC to Lending Pool for disbursement
        usdc.mint(address(pool), 5_000_000 * USDC_PRECISION);

        // Mint WETH to Borrower for collateral
        weth.mint(borrower, 100 * WETH_PRECISION);

        // Mint USDC to Liquidator to repay debt
        usdc.mint(liquidator, 2_000_000 * USDC_PRECISION);

        // Label accounts
        vm.label(owner, "Owner");
        vm.label(borrower, "Borrower");
        vm.label(liquidator, "Liquidator");
        vm.label(teeVerifierAddress, "TEE Enclave");
    }

    // Helper: Simulate off-chain TEE enclave signature generation
    function getTeeSignature(address user, uint8 credentialId, bytes32 payloadHash) internal view returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(user, credentialId, payloadHash));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(teePrivateKey, ethSignedHash);
        return abi.encodePacked(r, s, v);
    }

    // Helper: Verify a credential for a borrower
    function verifyCredential(address user, uint8 credentialId) internal {
        bytes32 payloadHash = keccak256(abi.encodePacked("fresh-metadata-salt", credentialId));
        bytes memory signature = getTeeSignature(user, credentialId, payloadHash);
        
        vm.prank(user);
        verifier.verifyAndRecord(user, credentialId, payloadHash, signature);
    }

    // ============================================================
    // Credential Verifier Tests
    // ============================================================

    function test_TEE_Verification_Succeeds() public {
        bytes32 payloadHash = keccak256("test-kyc-enclave");
        bytes memory sig = getTeeSignature(borrower, 2, payloadHash); // 2: KYC/Identity

        vm.prank(borrower);
        verifier.verifyAndRecord(borrower, 2, payloadHash, sig);

        assertTrue(verifier.hasCredential(2, borrower));
    }

    function test_TEE_Verification_FailsForBadSigner() public {
        bytes32 payloadHash = keccak256("test-kyc-enclave");
        
        // Sign with a completely different key
        bytes32 messageHash = keccak256(abi.encodePacked(borrower, uint8(2), payloadHash));
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xBAAD, ethSignedHash);
        bytes memory invalidSig = abi.encodePacked(r, s, v);

        vm.prank(borrower);
        vm.expectRevert("Invalid signature");
        verifier.verifyAndRecord(borrower, 2, payloadHash, invalidSig);
    }

    // ============================================================
    // Pricing & Discount Engine Tests
    // ============================================================

    function test_Default_BorrowingTerms() public view {
        (uint256 ratio, uint256 rate) = pool.getBorrowingTerms(borrower);
        assertEq(ratio, 15000); // 150% base collateral ratio
        assertEq(rate, 1250);   // 12.5% base APR
    }

    function test_Single_Credential_Discount() public {
        verifyCredential(borrower, 0); // 0: Credit Score (-25% Collateral | -1.8% rate)

        (uint256 ratio, uint256 rate) = pool.getBorrowingTerms(borrower);
        assertEq(ratio, 15000 - 2500); // 125%
        assertEq(rate, 1250 - 180);   // 10.7%
    }

    function test_Multiple_Credential_Discounts() public {
        verifyCredential(borrower, 0); // Credit Score:   -25% Collateral | -1.8% rate
        verifyCredential(borrower, 2); // KYC / Identity: -15% Collateral | -0.8% rate

        (uint256 ratio, uint256 rate) = pool.getBorrowingTerms(borrower);
        assertEq(ratio, 15000 - 2500 - 1500); // 110%
        assertEq(rate, 1250 - 180 - 80);     // 9.9%
    }

    function test_Combo_Bonus_AppliesCorrectly() public {
        // Verify all 5 credentials to qualify for Combo Bonus
        for (uint8 i = 0; i < 5; i++) {
            verifyCredential(borrower, i);
        }

        assertTrue(verifier.hasAllCredentials(borrower));

        (uint256 ratio, uint256 rate) = pool.getBorrowingTerms(borrower);
        // Collateral ratio: 150 - 25 - 20 - 15 - 10 - 8 - 5 (Combo) = 67%
        assertEq(ratio, 6700); 
        // Rate: 12.5 - 1.8 - 1.2 - 0.8 - 0.6 - 0.4 - 0.3 (Combo) = 7.4%
        assertEq(rate, 740);
    }

    // ============================================================
    // Borrow & Repayment Flow Tests
    // ============================================================

    function test_Borrow_Zero_Collateral_Discount_Flow() public {
        uint256 borrowAmount = 60_000 * USDC_PRECISION; // $60k
        
        // 150% standard DeFi collateral requirement for $60k is $90k
        // At WETH = $3000, $90k = 30 WETH needed
        (uint256 collateralNeeded, ) = pool.computeCollateralNeeded(borrower, borrowAmount);
        assertEq(collateralNeeded, 30 * WETH_PRECISION);

        vm.startPrank(borrower);
        weth.approve(address(pool), collateralNeeded);
        pool.borrow(borrowAmount, 30 days);
        vm.stopPrank();

        // Check borrower received the USDC and locked WETH in pool
        assertEq(usdc.balanceOf(borrower), borrowAmount);
        assertEq(weth.balanceOf(borrower), 100 * WETH_PRECISION - collateralNeeded);
        assertEq(weth.balanceOf(address(pool)), collateralNeeded);
    }

    function test_Borrow_Undercollateralized_FullDiscount_Flow() public {
        // Grant borrower all 5 credentials (67% collateral ratio)
        for (uint8 i = 0; i < 5; i++) {
            verifyCredential(borrower, i);
        }

        uint256 borrowAmount = 60_000 * USDC_PRECISION; // $60k
        // 67% collateral requirement for $60k is $40.2k
        // At WETH = $3000, $40.2k = 13.4 WETH needed
        (uint256 collateralNeeded, ) = pool.computeCollateralNeeded(borrower, borrowAmount);
        assertEq(collateralNeeded, (134 * WETH_PRECISION) / 10);

        vm.startPrank(borrower);
        weth.approve(address(pool), collateralNeeded);
        pool.borrow(borrowAmount, 30 days);
        vm.stopPrank();

        assertEq(weth.balanceOf(address(pool)), (134 * WETH_PRECISION) / 10);
        assertEq(weth.balanceOf(borrower), 100 * WETH_PRECISION - ((134 * WETH_PRECISION) / 10));
    }

    function test_Repay_Unlocks_Collateral_And_Calculates_Interest() public {
        // Verify all 5 credentials (7.4% active APR)
        for (uint8 i = 0; i < 5; i++) {
            verifyCredential(borrower, i);
        }

        uint256 borrowAmount = 100_000 * USDC_PRECISION; // $100k
        (uint256 collateralNeeded, ) = pool.computeCollateralNeeded(borrower, borrowAmount);

        vm.startPrank(borrower);
        weth.approve(address(pool), collateralNeeded);
        pool.borrow(borrowAmount, 365 days);
        vm.stopPrank();

        // Simulate 182.5 days passing (exactly half of the 365-day loan term)
        vm.warp(block.timestamp + 182.5 days);

        // Total outstanding should be Principal + (7.4% / 2 = 3.7% interest)
        // 3.7% of $100k is $3.7k -> Total = $103,700 USDC
        uint256 repaymentAmount = pool.calculateRepaymentAmount(1);
        assertEq(repaymentAmount, 103_700 * USDC_PRECISION);

        // Repay loan
        vm.startPrank(borrower);
        usdc.mint(borrower, 3_700 * USDC_PRECISION); // Mint the accrued interest tokens
        usdc.approve(address(pool), repaymentAmount);
        pool.repay(1);
        vm.stopPrank();

        // Ensure borrower got back 100% of WETH collateral and loan is inactive
        assertEq(weth.balanceOf(borrower), 100 * WETH_PRECISION);
        (,,,,,,,bool isActive) = pool.loans(1);
        assertFalse(isActive);
    }

    // ============================================================
    // Liquidation Flow Tests
    // ============================================================

    function test_Liquidation_Fails_For_Healthy_Loan() public {
        uint256 borrowAmount = 60_000 * USDC_PRECISION;
        (uint256 collateralNeeded, ) = pool.computeCollateralNeeded(borrower, borrowAmount);

        vm.startPrank(borrower);
        weth.approve(address(pool), collateralNeeded);
        pool.borrow(borrowAmount, 30 days);
        vm.stopPrank();

        vm.prank(liquidator);
        vm.expectRevert("Cannot liquidate");
        pool.liquidate(1);
    }

    function test_Liquidation_Succeeds_When_Overdue() public {
        uint256 borrowAmount = 60_000 * USDC_PRECISION;
        (uint256 collateralNeeded, ) = pool.computeCollateralNeeded(borrower, borrowAmount);

        vm.startPrank(borrower);
        weth.approve(address(pool), collateralNeeded);
        pool.borrow(borrowAmount, 30 days);
        vm.stopPrank();

        // Warp past dueTime (31 days)
        vm.warp(block.timestamp + 31 days);

        uint256 repayDebt = pool.calculateRepaymentAmount(1);

        vm.startPrank(liquidator);
        usdc.approve(address(pool), repayDebt);
        pool.liquidate(1);
        vm.stopPrank();

        // Liquidator should receive all locked WETH collateral
        assertEq(weth.balanceOf(liquidator), collateralNeeded);
        (,,,,,,,bool isActive) = pool.loans(1);
        assertFalse(isActive);
    }

    function test_Liquidation_Succeeds_When_Undercollateralized_DueToPriceDrop() public {
        // Borrower has all credentials (67% ratio, $40.2k needed for $60k loan)
        // Locked: 13.4 WETH (at $3000/WETH = $40.2k collateral value)
        for (uint8 i = 0; i < 5; i++) {
            verifyCredential(borrower, i);
        }

        uint256 borrowAmount = 60_000 * USDC_PRECISION;
        (uint256 collateralNeeded, ) = pool.computeCollateralNeeded(borrower, borrowAmount);

        vm.startPrank(borrower);
        weth.approve(address(pool), collateralNeeded);
        pool.borrow(borrowAmount, 30 days);
        vm.stopPrank();

        // Crash WETH price from $3000 to $2000 (USDC/USD)
        // 13.4 WETH is now worth only $26,800, which is below required $40,200!
        vm.prank(owner);
        pool.setWethPrice(2000 * USDC_PRECISION);

        uint256 repayDebt = pool.calculateRepaymentAmount(1);

        vm.startPrank(liquidator);
        usdc.approve(address(pool), repayDebt);
        pool.liquidate(1);
        vm.stopPrank();

        // Liquidator seized WETH at a deep discount
        assertEq(weth.balanceOf(liquidator), collateralNeeded);
    }
}
