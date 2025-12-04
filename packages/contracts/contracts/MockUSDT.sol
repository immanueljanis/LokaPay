// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "mUSDT") {
        // Cetak 1 Juta Token untuk Deployer
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    // Fungsi biar turis bisa minta token gratis (Faucet)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}