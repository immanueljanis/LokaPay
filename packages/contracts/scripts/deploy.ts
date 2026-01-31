const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();

  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  await usdc.deploymentTransaction()?.wait(1);
  const usdcAddress = await usdc.getAddress();
  console.log(`   ✅ MockUSDC: ${usdcAddress}`);

  console.log("Deploying MockIDRX...");
  const MockIDRX = await ethers.getContractFactory("MockIDRX");
  const idrx = await MockIDRX.deploy();
  await idrx.waitForDeployment();
  await idrx.deploymentTransaction()?.wait(1);
  const idrxAddress = await idrx.getAddress();
  console.log(`   ✅ MockIDRX: ${idrxAddress}`);

  console.log("Deploying MockOracle...");
  const INITIAL_PRICE = 1600000000000n;
  const MockOracle = await ethers.getContractFactory("MockOracle");
  const oracle = await MockOracle.deploy(INITIAL_PRICE);
  await oracle.waitForDeployment();
  await oracle.deploymentTransaction()?.wait(1);
  const oracleAddress = await oracle.getAddress();
  console.log(`   ✅ MockOracle: ${oracleAddress}`);

  console.log("Deploying SimpleSwapRouter...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  const SimpleSwapRouter = await ethers.getContractFactory("SimpleSwapRouter");
  const router = await SimpleSwapRouter.deploy(usdcAddress, idrxAddress, oracleAddress);
  await router.waitForDeployment();
  await router.deploymentTransaction()?.wait(1);
  const routerAddress = await router.getAddress();
  console.log(`   ✅ Router: ${routerAddress}`);

  console.log("💧 Injecting Liquidity to Router...");
  const liquidityAmount = ethers.parseUnits("1000000000", 18);
  const txMint = await idrx.mint(routerAddress, liquidityAmount);
  await txMint.wait(1);
  console.log("   ✅ Liquidity Added!");

  console.log("Deploying LokaFactory...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  const coldWallet = process.env.COLD_WALLET_ADDRESS || deployer.address;
  const LokaFactory = await ethers.getContractFactory("LokaFactory");
  const factory = await LokaFactory.deploy(
    coldWallet,
    routerAddress,
    usdcAddress,
    idrxAddress
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log(`🎉 LokaFactory deployed to: ${factoryAddress}`);

  console.log("\n--- 📋 COPY THESE ADDRESSES TO YOUR .ENV ---");
  console.table({
    NEXT_PUBLIC_USDC_ADDRESS: usdcAddress,
    NEXT_PUBLIC_IDRX_ADDRESS: idrxAddress,
    NEXT_PUBLIC_ORACLE_ADDRESS: oracleAddress,
    NEXT_PUBLIC_FACTORY_ADDRESS: factoryAddress,
    NEXT_PUBLIC_ROUTER_ADDRESS: routerAddress
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});