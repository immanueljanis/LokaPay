require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.26", // Pastikan versi ini cocok dengan file .sol Anda (tadi 0.8.20)
    networks: {
        // Mantle Sepolia (Testnet)
        mantleSepolia: {
            url: "https://rpc.sepolia.mantle.xyz",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            chainId: 5003,
        },
        // Mantle Mainnet
        mantle: {
            url: "https://rpc.mantle.xyz",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            chainId: 5000,
        },
    },
    etherscan: {
        apiKey: {
            mantleSepolia: "abc", // Blockscout tidak butuh API Key valid
        },
        customChains: [
            {
                network: "mantleSepolia",
                chainId: 5003,
                urls: {
                    apiURL: "https://explorer.sepolia.mantle.xyz/api",
                    browserURL: "https://explorer.sepolia.mantle.xyz",
                },
            },
        ],
    },
};