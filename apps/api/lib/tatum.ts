import { TatumSDK, Network, Ethereum } from '@tatumio/tatum'
import { Wallet } from 'ethers'

// Inisialisasi Tatum (Khusus untuk koneksi data/network)
const tatum = await TatumSDK.init<Ethereum>({
    network: Network.BINANCE_SMART_CHAIN,
    apiKey: { v4: process.env.TATUM_API_KEY },
    verbose: true,
})

// 1. Fungsi Ambil Rate (Masih pakai logic lama yang sudah benar)
export const getRealExchangeRate = async (): Promise<number> => {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=idr')
        const data = await response.json() as { tether: { idr: number } }

        const rate = data.tether.idr
        return parseFloat(rate.toString())
    } catch (error) {
        console.error('Gagal ambil rate, pakai fallback', error)
        return 15800
    }
}

// 2. Fungsi Generate Wallet Address
// Kita gunakan Ethers.js. Ini lebih aman karena generate key terjadi murni offline di server kamu.
export const generateDepositWallet = async () => {
    // Generate Random Wallet untuk BSC (EVM Compatible)
    const wallet = Wallet.createRandom()

    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase // Ethers v6 menyimpan phrase di property ini
    }
}