import { ethers } from "ethers";
import { getIDRXRate } from "../libs/idrx";

const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.WORKER_PRIVATE_KEY;
const ORACLE_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS;

if (!RPC_URL || !PRIVATE_KEY || !ORACLE_ADDRESS) {
    throw new Error("Missing required environment variables: RPC_URL, WORKER_PRIVATE_KEY, or ORACLE_CONTRACT_ADDRESS");
}

const ORACLE_ABI = [
    "function setPrice(int256 newPrice) external"
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const oracleContract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, wallet);

async function updateOraclePrice() {
    try {
        console.log("Fetching IDRX Rate...");
        const liveRate = await getIDRXRate(1);

        if (liveRate === null) {
            console.error("❌ Failed to fetch rate from IDRX API");
            return;
        }
        console.log(`Live Rate from IDRX API: Rp ${liveRate.toFixed(2)} per USD`);

        const chainlinkFormat = Math.floor(liveRate * 100000000);
        console.log(`Pushing price ${chainlinkFormat} to Base Sepolia...`);

        if (!oracleContract.setPrice) {
            throw new Error("setPrice function not found on oracle contract");
        }

        const tx = await oracleContract.setPrice(chainlinkFormat);
        console.log(`Tx Sent: ${tx.hash}`);

        await tx.wait();
        console.log("✅ Oracle Updated On-Chain!");

    } catch (error) {
        console.error("❌ Failed to update oracle:", error);
    }
}

console.log("🚀 Starting LokaPay Oracle Feeder...");
setInterval(updateOraclePrice, 60000);
updateOraclePrice();