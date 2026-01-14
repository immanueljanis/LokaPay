require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const networkName = process.env.CHAIN_NETWORK || "LISK";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.26",
    networks: {
        [networkName]: {
            url: process.env.RPC_URL || "",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            chainId: Number(process.env.CHAIN_ID),
        },
    },
    etherscan: {
        apiKey: {
            [networkName]: process.env.ETHERSCAN_API_KEY || process.env.BLOCK_EXPLORER_API_KEY || "abc",
        },
        customChains: [
            {
                network: networkName,
                chainId: Number(process.env.CHAIN_ID),
                urls: {
                    apiURL: `${process.env.BLOCK_EXPLORER || process.env.CHAIN_EXPLORER || ""}/api`,
                    browserURL: process.env.BLOCK_EXPLORER || process.env.CHAIN_EXPLORER || "",
                },
            },
        ],
    },
}; 