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

    constructor(address _t0, address _t1, address _factory) {
        require(_t0 < _t1);
        T0 = _t0;
        T1 = _t1;
        factory = _factory;
    }

    function setRouter(address _router) external { require(msg.sender == factory); router = _router; }

    function mint(address to) external returns (uint256 liq) {
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

    function burn(address to) external returns (uint256 a, uint256 b) {
        uint256 lp = lpBalance[msg.sender];
        require(lp > 0);
        a = _rA * lp / _supply;
        b = _rB * lp / _supply;
        _supply -= lp;
        lpBalance[msg.sender] -= lp;
        IERC20(T0).transfer(to, a);
        IERC20(T1).transfer(to, b);
    }

    function sync() external {
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

/// @notice One-click liquidity provisioning
contract MayeDexRouter02 {
    address public immutable FACTORY;

    constructor(address _factory) { FACTORY = _factory; }

    function getReserves(address tokenA, address tokenB) external view returns (uint256 rA, uint256 rB) {
        address t0 = tokenA < tokenB ? tokenA : tokenB;
        address t1 = tokenA < tokenB ? tokenB : tokenA;
        address pair = MayeDexFactory(FACTORY).getPair(t0, t1);
        require(pair != address(0));
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

        IERC20(tokenA).transferFrom(msg.sender, pair, amtA);
        IERC20(tokenB).transferFrom(msg.sender, pair, amtB);

        MayeDexPair(pair).sync();
        liq = MayeDexPair(pair).mint(to);

        reserveA = IERC20(tokenA).balanceOf(pair);
        reserveB = IERC20(tokenB).balanceOf(pair);
    }
}
