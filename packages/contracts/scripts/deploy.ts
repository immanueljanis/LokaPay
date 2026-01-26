const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying to Network:", hre.network.name);
  console.log("👮 Deployer:", deployer.address);

  // 1. Mock USDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ Mock USDC:", usdcAddress);

  const coldWallet = deployer.address;

  // 2. Deploy LokaFactory
  const LokaFactory = await ethers.getContractFactory("LokaFactory");
  const factory = await LokaFactory.deploy(coldWallet);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("✅ LokaFactory:", factoryAddress);

  console.log("\n--- SIMPAN DI .ENV BACKEND ---");
  console.log(`FACTORY_ADDRESS="${factoryAddress}"`);
  console.log(`USDC_ADDRESS="${usdcAddress}"`);
  console.log(`COLD_WALLET_ADDRESS="${coldWallet}"`);
  console.log(`RELAYER_PRIVATE_KEY="Isi dengan private key ${deployer.address}"`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});