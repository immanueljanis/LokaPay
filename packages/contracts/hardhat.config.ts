require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.26",
    networks: {
        [process.env.CHAIN_NETWORK as string]: {
            url: process.env.RPC_URL,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            chainId: process.env.CHAIN_ID,
        },
    },
    etherscan: {
        apiKey: {
            [process.env.CHAIN_NETWORK as string]: "abc",
        },
        customChains: [
            {
                network: process.env.CHAIN_NETWORK,
                chainId: process.env.CHAIN_ID,
                urls: {
                    apiURL: `${process.env.BLOCK_EXPLORER}/api`,
                    browserURL: process.env.BLOCK_EXPLORER,
                },
            },
        ],
    },
};