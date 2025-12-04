const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying to Network:", hre.network.name);
  console.log("👮 Deployer:", deployer.address);

  // 1. Deploy Mock USDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("✅ Mock USDT:", usdtAddress);

  // 2. Config Address
  const coldWallet = deployer.address;

  // ALAMAT GELATO TERBARU (ERC2771 1Balance)
  // Ini alamat standar Gelato di banyak network
  const GELATO_RELAYER = "0xd8253782c45a12053594b9deB72d8e8aB2Fca54c";

  // 3. Deploy Factory dengan Parameter Gelato
  const LokaFactory = await ethers.getContractFactory("LokaFactory");
  const factory = await LokaFactory.deploy(coldWallet, GELATO_RELAYER);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ LokaFactory:", factoryAddress);
  console.log("🍦 Gelato Forwarder:", GELATO_RELAYER);

  console.log("\n--- SIMPAN DI .ENV BACKEND ---");
  console.log(`FACTORY_ADDRESS="${factoryAddress}"`);
  console.log(`USDT_ADDRESS="${usdtAddress}"`);
  console.log(`COLD_WALLET_ADDRESS="${coldWallet}"`);
  // Tidak perlu simpan Gelato address di .env backend karena sudah tertanam di Contract
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});