const hre = require("hardhat");

async function main() {
    // Ambil alamat dari hasil deploy atau .env
    const usdtAddress = process.env.USDT_ADDRESS;
    const factoryAddress = process.env.FACTORY_ADDRESS;
    const coldWallet = process.env.COLD_WALLET_ADDRESS;

    console.log("Starting verification...");

    // 1. Verifikasi Mock USDT
    try {
        await hre.run("verify:verify", {
            address: usdtAddress,
            constructorArguments: [],
        });
        console.log("✅ MockUSDT Verified");
    } catch (error: any) {
        console.log("MockUSDT:", error.message);
    }

    // 2. Verifikasi LokaFactory
    try {
        await hre.run("verify:verify", {
            address: factoryAddress,
            constructorArguments: [coldWallet],
        });
        console.log("✅ LokaFactory Verified");
    } catch (error: any) {
        console.log("LokaFactory:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});