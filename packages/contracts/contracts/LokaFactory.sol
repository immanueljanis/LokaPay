// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./LokaVault.sol";

contract LokaFactory {
    event VaultDeployed(address indexed vaultAddress, bytes32 salt);

    address public immutable coldWallet;
    address public immutable gelatoForwarder; // Tidak di-hardcode lagi

    constructor(address _coldWallet, address _gelatoForwarder) {
        coldWallet = _coldWallet;
        gelatoForwarder = _gelatoForwarder;
    }

    function deployVault(bytes32 _salt, address _owner) external returns (address) {
        // Oper alamat forwarder yang disimpan di factory ke vault baru
        LokaVault vault = new LokaVault{salt: _salt}(_owner, coldWallet, gelatoForwarder);
        emit VaultDeployed(address(vault), _salt);
        return address(vault);
    }

    function getVaultAddress(bytes32 _salt, address _owner) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(LokaVault).creationCode,
            abi.encode(_owner, coldWallet, gelatoForwarder)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode))
        );
        return address(uint160(uint256(hash)));
    }
}