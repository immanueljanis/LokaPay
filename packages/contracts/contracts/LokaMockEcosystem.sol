// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1000000 * 10 ** decimals()); 
    }
    function decimals() public view virtual override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract MockIDRX is ERC20 {
    constructor() ERC20("Mock IDRX", "mIDRX") {
        _mint(msg.sender, 100000000000 * 10 ** decimals()); 
    }
    function decimals() public view virtual override returns (uint8) { return 18; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract MockOracle is Ownable {
    int256 private _price;
    uint8 private _decimals = 8;

    constructor(int256 initialPrice) Ownable(msg.sender) {
        _price = initialPrice; // Contoh: 1600000000000 (16.000 IDR)
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (0, _price, 0, block.timestamp, 0);
    }
    
    function setPrice(int256 newPrice) external onlyOwner {
        _price = newPrice;
    }
}

contract SimpleSwapRouter {
    IERC20 public usdc;
    IERC20 public idrx;
    MockOracle public oracle;

    constructor(address _usdc, address _idrx, address _oracle) {
        usdc = IERC20(_usdc);
        idrx = IERC20(_idrx);
        oracle = MockOracle(_oracle);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external returns (uint256[] memory amounts) {
        (, int256 price, , , ) = oracle.latestRoundData();
        uint256 amountOut = (amountIn * uint256(price)) * 10000;

        require(amountOut >= amountOutMin, "Slippage too high");

        require(usdc.transferFrom(msg.sender, address(this), amountIn), "Transfer USDC Failed");

        require(idrx.balanceOf(address(this)) >= amountOut, "Router Low Liquidity");
        require(idrx.transfer(to, amountOut), "Transfer IDRX Failed");

        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOut;
        return amounts;
    }
}