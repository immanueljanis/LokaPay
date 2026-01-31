// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract LokaVault {
    address public immutable COLD_WALLET;
    address public immutable OWNER;
    address public immutable ROUTER;
    address public immutable USDC;
    address public immutable IDRX;

    constructor(address _owner, address _coldWallet, address _router, address _usdc, address _idrx) {
        OWNER = _owner;
        COLD_WALLET = _coldWallet;
        ROUTER = _router;
        USDC = _usdc;
        IDRX = _idrx;
    }

    function sweep() external {
        IERC20 token = IERC20(USDC);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "Zero Balance");

        token.approve(ROUTER, balance);

        address[] memory path = new address[](2);
        path[0] = USDC;
        path[1] = IDRX;

        // 3. Swap!
        IRouter(ROUTER).swapExactTokensForTokens(
            balance,
            0,
            path,
            COLD_WALLET,
            block.timestamp
        );
    }
}