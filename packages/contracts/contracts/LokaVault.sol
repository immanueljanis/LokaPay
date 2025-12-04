// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@gelatonetwork/relay-context/contracts/vendor/ERC2771Context.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LokaVault is ERC2771Context {
    address public immutable COLD_WALLET;
    address public immutable OWNER; // Admin LokaPay

    event Swept(address indexed token, uint256 amount);

    // Constructor menerima address Gelato Forwarder (Relayer)
    constructor(address _owner, address _coldWallet, address _trustedForwarder) 
        ERC2771Context(_trustedForwarder) 
    {
        OWNER = _owner;
        COLD_WALLET = _coldWallet;
    }

    // Modifier Custom pengganti onlyOwner
    modifier onlyOwner() {
        // _msgSender() adalah fungsi ajaib ERC2771 untuk tahu siapa penyuruh aslinya
        require(_msgSender() == OWNER, "Not Owner");
        _;
    }

    function sweep(address _token) external onlyOwner {
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "Zero Balance");
        token.transfer(COLD_WALLET, balance);
        emit Swept(_token, balance);
    }
}