// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
contract LokaVault {
    address public immutable COLD_WALLET;
    address public immutable OWNER;

    event Swept(address indexed token, uint256 amount);

    constructor(address _owner, address _coldWallet) {
        OWNER = _owner;
        COLD_WALLET = _coldWallet;
    }

    modifier onlyOwner() {
        require(msg.sender == OWNER, "LokaPay: Not Owner");
        _;
    }

    function sweep(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "LokaPay: Zero Balance");
        
        require(token.transfer(COLD_WALLET, balance), "LokaPay: Transfer Failed");
        emit Swept(_token, balance);
    }
}