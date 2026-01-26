import { ethers } from 'ethers'

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL)
const relayerSigner = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, provider)

const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS!
export const USDC_ADDRESS = process.env.USDC_ADDRESS! // Export biar bisa dipakai di sweeper

// ABI Factory (Fungsi deploy & prediksi alamat)
const FACTORY_ABI = [
    "function getVaultAddress(bytes32 salt, address owner) view returns (address)",
    "function deployVault(bytes32 salt, address owner) returns (address)"
]

// ABI Vault (Fungsi sweep)
const VAULT_ABI = [
    "function sweep(address token) external"
]

export const getFactoryContract = () => new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider)
export const getVaultContract = (address: string) => new ethers.Contract(address, VAULT_ABI, provider)
export const getVaultInterface = () => new ethers.Interface(VAULT_ABI)

export { provider, relayerSigner, FACTORY_ADDRESS }