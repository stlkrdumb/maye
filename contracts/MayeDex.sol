// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Ultra-minimal LP token — no name, symbol, decimals, transfer logic
contract MayeDexPair {
    address public immutable T0; // lower-address token
    address public immutable T1; // higher-address token
    address public factory;
    address public router;

    uint256 private _rA; // reserve of T0
    uint256 private _rB; // reserve of T1
    uint256 private _supply;

    mapping(address => uint256) public lpBalance;

    // reentrancy guard
    uint256 private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, "LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    constructor(address _t0, address _t1, address _factory) {
        require(_t0 < _t1);
        T0 = _t0;
        T1 = _t1;
        factory = _factory;
    }

    function setRouter(address _router) external { require(msg.sender == factory); router = _router; }

    function mint(address to) external lock returns (uint256 liq) {
        uint256 bA = IERC20(T0).balanceOf(address(this));
        uint256 bB = IERC20(T1).balanceOf(address(this));

        if (_supply == 0) {
            liq = sqrt(bA * bB) - 1000;
            lpBalance[address(0xdead)] = 1000;
        } else {
            liq = (bA - _rA) * _supply / bA;
        }

        _rA = bA;
        _rB = bB;
        _supply += liq;
        lpBalance[to] += liq;
    }

    function burn(address to) external lock returns (uint256 a, uint256 b) {
        uint256 lp = lpBalance[msg.sender];
        require(lp > 0, "NO_LP");
        a = _rA * lp / _supply;
        b = _rB * lp / _supply;
        _supply -= lp;
        lpBalance[msg.sender] -= lp;
        require(IERC20(T0).transfer(to, a), "T0 transfer failed");
        require(IERC20(T1).transfer(to, b), "T1 transfer failed");
    }

    function swap(uint256 amount0Out, uint256 amount1Out, address to) external lock {
        require(amount0Out > 0 || amount1Out > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        require(amount0Out < _rA && amount1Out < _rB, "INSUFFICIENT_LIQUIDITY");
        require(to != T0 && to != T1, "INVALID_TO");

        if (amount0Out > 0) require(IERC20(T0).transfer(to, amount0Out), "T0 transfer failed");
        if (amount1Out > 0) require(IERC20(T1).transfer(to, amount1Out), "T1 transfer failed");

        uint256 balance0 = IERC20(T0).balanceOf(address(this));
        uint256 balance1 = IERC20(T1).balanceOf(address(this));

        uint256 amount0In = balance0 > _rA - amount0Out ? balance0 - (_rA - amount0Out) : 0;
        uint256 amount1In = balance1 > _rB - amount1Out ? balance1 - (_rB - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, "INSUFFICIENT_INPUT_AMOUNT");

        uint256 balance0Adjusted = balance0 * 1000 - amount0In * 3;
        uint256 balance1Adjusted = balance1 * 1000 - amount1In * 3;
        require(balance0Adjusted * balance1Adjusted >= _rA * _rB * 1000000, "K_LIMIT");

        _rA = balance0;
        _rB = balance1;
    }

    function sync() external lock {
        _rA = IERC20(T0).balanceOf(address(this));
        _rB = IERC20(T1).balanceOf(address(this));
    }

    function reserveA() external view returns (uint256) { return _rA; }
    function reserveB() external view returns (uint256) { return _rB; }
    function totalSupply_() external view returns (uint256) { return _supply; }

    // ---- helpers ----
    function sqrt(uint256 x) internal pure returns (uint256 z) {
        if (x > 3) {
            z = x;
            uint256 y = x / 2 + 1;
            while (y < z) { z = y; y = (x / y + y) / 2; }
        } else if (x != 0) { z = 1; }
    }
}

/// @notice Creates pairs. Anyone can call createPair.
contract MayeDexFactory {
    address public owner;
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    constructor() { owner = msg.sender; }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB);
        (address t0, address t1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(t0 != address(0));
        pair = getPair[t0][t1];
        if (pair != address(0)) return pair;

        bytes32 salt = keccak256(abi.encodePacked(t0, t1));
        pair = address(new MayeDexPair{salt: salt}(t0, t1, address(this)));
        getPair[t0][t1] = pair;
        getPair[t1][t0] = pair;
        allPairs.push(pair);
    }
}

/// @notice One-click liquidity provisioning and swapping
contract MayeDexRouter02 {
    address public immutable FACTORY;

    constructor(address _factory) { FACTORY = _factory; }

    function getReserves(address tokenA, address tokenB) public view returns (uint256 rA, uint256 rB) {
        address t0 = tokenA < tokenB ? tokenA : tokenB;
        address t1 = tokenA < tokenB ? tokenB : tokenA;
        address pair = MayeDexFactory(FACTORY).getPair(t0, t1);
        require(pair != address(0), "PAIR_NOT_FOUND");
        if (tokenA == t0) { rA = MayeDexPair(pair).reserveA(); rB = MayeDexPair(pair).reserveB(); }
        else             { rB = MayeDexPair(pair).reserveA(); rA = MayeDexPair(pair).reserveB(); }
    }

    function addLiquidity(
        address tokenA, address tokenB,
        uint256 amtA, uint256 amtB,
        uint256 /*minA*/, uint256 /*minB*/,
        address to
    ) external returns (uint256 reserveA, uint256 reserveB, uint256 liq) {
        address t0 = tokenA < tokenB ? tokenA : tokenB;
        address t1 = tokenA < tokenB ? tokenB : tokenA;
        address pair = MayeDexFactory(FACTORY).getPair(t0, t1);

        if (pair == address(0)) {
            MayeDexFactory(FACTORY).createPair(tokenA, tokenB);
            pair = MayeDexFactory(FACTORY).getPair(t0, t1);
        }

        require(IERC20(tokenA).transferFrom(msg.sender, pair, amtA), "transferFrom tokenA failed");
        require(IERC20(tokenB).transferFrom(msg.sender, pair, amtB), "transferFrom tokenB failed");

        MayeDexPair(pair).sync();
        liq = MayeDexPair(pair).mint(to);

        reserveA = IERC20(tokenA).balanceOf(pair);
        reserveB = IERC20(tokenB).balanceOf(pair);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "INSUFFICIENT_LIQUIDITY");
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to
    ) external returns (uint256[] memory amounts) {
        require(path.length >= 2, "INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 0; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(path[i], path[i+1]);
            amounts[i+1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
        require(amounts[amounts.length - 1] >= amountOutMin, "INSUFFICIENT_OUTPUT_AMOUNT");

        address pair = MayeDexFactory(FACTORY).getPair(path[0], path[1]);
        require(pair != address(0), "PAIR_NOT_FOUND");

        require(IERC20(path[0]).transferFrom(msg.sender, pair, amounts[0]), "transferFrom failed");

        for (uint256 i = 0; i < path.length - 1; i++) {
            address input = path[i];
            address output = path[i+1];
            (address t0, ) = input < output ? (input, output) : (output, input);
            uint256 amountOut = amounts[i+1];
            (uint256 amount0Out, uint256 amount1Out) = input == t0 ? (uint256(0), amountOut) : (amountOut, uint256(0));
            
            address dest = i < path.length - 2 ? MayeDexFactory(FACTORY).getPair(output, path[i+2]) : to;
            MayeDexPair(pair).swap(amount0Out, amount1Out, dest);
            if (i < path.length - 2) {
                pair = dest;
            }
        }
    }
}
