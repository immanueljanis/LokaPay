// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "./LokaVault.sol";

contract LokaFactory {
    address public immutable coldWallet;
    address public immutable router;
    address public immutable usdc;
    address public immutable idrx;

    event VaultDeployed(address indexed vaultAddress, address indexed owner, bytes32 salt);

    constructor(address _coldWallet, address _router, address _usdc, address _idrx) {
        require(_coldWallet != address(0), "LokaFactory: coldWallet cannot be zero address");
        require(_router != address(0), "LokaFactory: router cannot be zero address");
        require(_usdc != address(0), "LokaFactory: usdc cannot be zero address");
        require(_idrx != address(0), "LokaFactory: idrx cannot be zero address");
        
        coldWallet = _coldWallet;
        router = _router;
        usdc = _usdc;
        idrx = _idrx;
    }

    function deployVault(bytes32 _salt, address _owner) external returns (address) {
        LokaVault vault = new LokaVault{salt: _salt}(_owner, coldWallet, router, usdc, idrx);
        
        emit VaultDeployed(address(vault), _owner, _salt);
        return address(vault);
    }

    function getVaultAddress(bytes32 _salt, address _owner) public view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(LokaVault).creationCode,
            abi.encode(_owner, coldWallet, router, usdc, idrx) 
        );

        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                _salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }
}