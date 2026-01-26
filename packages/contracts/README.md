# 📜 LokaPay Smart Contracts

This package contains the smart contracts for the LokaPay payment infrastructure, built with Hardhat and Solidity.

## 📋 Contracts Overview

### 1. **LokaFactory** (`LokaFactory.sol`)
Factory contract that deploys individual vault contracts using CREATE2 for deterministic addresses.

**Key Features:**
- Deploys `LokaVault` contracts with deterministic addresses (CREATE2)
- Predicts vault addresses before deployment
- Stores immutable `coldWallet` address for all vaults

**Constructor:**
- `_coldWallet` (address): The cold wallet address that will receive swept funds

**Functions:**
- `deployVault(bytes32 _salt, address _owner)`: Deploys a new vault with deterministic address
- `getVaultAddress(bytes32 _salt, address _owner)`: Predicts vault address before deployment

### 2. **LokaVault** (`LokaVault.sol`)
Individual vault contract deployed per transaction. Each vault holds USDC payments temporarily before being swept to the cold wallet.

**Key Features:**
- Immutable owner (relayer address)
- Immutable cold wallet address
- `sweep()` function to transfer all tokens to cold wallet (owner-only)

**Constructor:**
- `_owner` (address): The relayer address that can call `sweep()`
- `_coldWallet` (address): The cold wallet that receives swept funds

**Important Note:** `LokaVault` is **NOT** a single contract address. Each transaction gets its own vault instance deployed via CREATE2. You don't verify "a" LokaVault contract, but individual vault instances if needed.

### 3. **MockUSDC** (`MockUSDC.sol`)
Mock ERC20 token for testing purposes on testnets.

**Key Features:**
- Standard ERC20 token implementation
- Faucet function for testnet token distribution
- 6 decimal places (like real USDC)

## 🚀 Installation

```bash
cd packages/contracts
bun install
```

## ⚙️ Configuration

Create a `.env` file in `packages/contracts/`:

```env
# Deployment Configuration
DEPLOYER_PRIVATE_KEY=your_deployer_private_key_here
CHAIN_ID=4202
CHAIN_NETWORK=LISK
CHAIN_EXPLORER=https://sepolia-blockscout.lisk.com
RPC_URL=https://rpc.sepolia-api.lisk.com

# Verification (Optional - only needed for contract verification)
ETHERSCAN_API_KEY=your_block_explorer_api_key_here
BLOCK_EXPLORER_API_KEY=your_block_explorer_api_key_here
```

## 📝 Compilation

Compile the contracts:

```bash
bun run compile
```

This will generate:
- ABI files in `artifacts/`
- TypeScript types in `typechain-types/`

## 🚢 Deployment

Deploy contracts to the network:

```bash
bun run deploy --network LISK
```

Or use bunx directly:

```bash
bunx hardhat run scripts/deploy.ts --network LISK
```

**Deployment Order:**
1. MockUSDC (no constructor arguments)
2. LokaFactory (requires `coldWallet` address - uses deployer address by default)

After deployment, the script will output the contract addresses. **Save these addresses** to your `.env` files:
- `FACTORY_ADDRESS` - Used by API and Worker
- `USDC_ADDRESS` - Used by API, Worker, and Web
- `COLD_WALLET_ADDRESS` - Used by API and Worker

## ✅ Verification

Verify deployed contracts on the block explorer:

### Option 1: Using Environment Variables

Set in `packages/contracts/.env`:
```env
FACTORY_ADDRESS=0xE6BFC88940da7E0f424aD033F304363BB30dbe25
USDC_ADDRESS=0x4F4AE7FB677004521f0D92C0aF43cA8f749034c0
COLD_WALLET_ADDRESS=0x762154693351a54AD292D03efCEF2920387443De
```

Then run:
```bash
bunx hardhat run scripts/verify.ts --network LISK
```

### Option 2: Using Command Line Arguments

```bash
bunx hardhat run scripts/verify.ts --network LISK -- <factoryAddress> <usdcAddress> <coldWalletAddress>
```

**Example:**
```bash
bunx hardhat run scripts/verify.ts --network LISK -- 0xE6BFC88940da7E0f424aD033F304363BB30dbe25 0x4F4AE7FB677004521f0D92C0aF43cA8f749034c0 0x762154693351a54AD292D03efCEF2920387443De
```

### Option 3: Verify Individual Contracts

**Verify MockUSDC:**
```bash
bunx hardhat verify --network LISK <mockUSDCAddress>
```

**Verify LokaFactory:**
```bash
bunx hardhat verify --network LISK <factoryAddress> <coldWalletAddress>
```

**Verify Individual LokaVault Instance** (if needed):
```bash
bunx hardhat verify --network LISK <vaultAddress> <ownerAddress> <coldWalletAddress>
```

**Note:** You typically don't need to verify individual LokaVault instances since they all use the same bytecode. Verifying the factory is sufficient.

## 🔍 Testing

Run tests (if available):

```bash
bun run test
```

## 📚 Contract Architecture

### Deployment Flow

1. **Factory Deployment**: `LokaFactory` is deployed once with a `coldWallet` address
2. **Vault Prediction**: For each transaction, the API calls `getVaultAddress()` to predict the vault address
3. **Vault Deployment**: When payment is detected, the worker deploys the vault using `deployVault()` with CREATE2
4. **Fund Sweeping**: After payment confirmation, the worker calls `sweep()` to transfer USDC to the cold wallet

### CREATE2 Deterministic Addresses

Each vault gets a deterministic address based on:
- Factory contract address
- Salt (generated from transaction UUID)
- Owner address (relayer)
- Cold wallet address
- Vault bytecode

This allows predicting vault addresses before deployment, which is crucial for payment flow.

## 🔐 Security Considerations

1. **Cold Wallet**: The `coldWallet` address is immutable and set during factory deployment
2. **Owner-Only Sweep**: Only the owner (relayer) can sweep funds from vaults
3. **Deterministic Deployment**: CREATE2 ensures vault addresses can be predicted, preventing front-running
4. **No Upgrade Mechanism**: Contracts are immutable for maximum security

## 📖 Documentation

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [CREATE2 Deterministic Addresses](https://eips.ethereum.org/EIPS/eip-1014)

## 🛠️ Troubleshooting

### Error: "Cannot find module"
- Make sure you've run `bun install` in `packages/contracts/`

### Error: "Your project is an ESM project"
- The `hardhat.config.ts` uses CommonJS syntax which is compatible with `"type": "module"` in package.json

### Verification Fails
- Make sure contracts are deployed and have enough confirmations (wait ~30 seconds after deployment)
- Check that constructor arguments match exactly
- Verify API key is correct for the block explorer

### Network Connection Issues
- Verify `RPC_URL` is correct and accessible
- Check network name matches the configured network
- Ensure you have sufficient balance for gas fees

## 📄 License

MIT License - Same as main project
