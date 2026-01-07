// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;
import "./LokaVault.sol";
contract LokaFactory {
    address public immutable coldWallet;

    event VaultDeployed(address indexed vaultAddress, address indexed owner, bytes32 salt);

    constructor(address _coldWallet) {
        require(_coldWallet != address(0), "Zero address not allowed");
        coldWallet = _coldWallet;
    }

    function deployVault(bytes32 _salt, address _owner) external returns (address) {
        LokaVault vault = new LokaVault{salt: _salt}(_owner, coldWallet);
        
        emit VaultDeployed(address(vault), _owner, _salt);
        return address(vault);
    }

    function getVaultAddress(bytes32 _salt, address _owner) public view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(LokaVault).creationCode,
            abi.encode(_owner, coldWallet)
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