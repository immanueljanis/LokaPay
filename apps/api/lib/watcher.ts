import { ethers } from 'ethers'
import { prisma } from '@lokapay/database'
import { provider, USDT_ADDRESS } from '../constants/contracts'
import { processIncomingPayment } from '../services/paymentServices'

// ABI Minimal untuk cek saldo ERC20
const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"]
const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider)

async function runWatcher() {
    console.log('👀 Internal Watcher Started on Mantle Sepolia...')

    while (true) {
        try {
            // 1. Ambil semua transaksi yang masih PENDING atau PARTIAL
            // Kita hanya perlu cek yang belum lunas.
            const pendingTx = await prisma.transaction.findMany({
                where: {
                    status: { in: ['PENDING', 'PARTIALLY_PAID'] },
                    // Optimasi: Hanya cek yang expirednya belum lewat jauh (misal 1 hari)
                    // Agar tidak cek ribuan transaksi sampah selamanya.
                }
            })

            if (pendingTx.length > 0) {
                // console.log(`Checking ${pendingTx.length} pending addresses...`)
            }

            // 2. Loop cek saldo satu per satu
            for (const tx of pendingTx) {
                // Cek saldo aktual di Blockchain
                const balanceBN = await usdtContract?.balanceOf?.(tx.paymentAddress)
                const balance = parseFloat(ethers.formatUnits(balanceBN, 18)) // Asumsi 18 decimals

                // Ambil saldo yang sudah tercatat di DB
                const recordedBalance = parseFloat(tx.amountReceived.toString())

                // 3. JIKA ADA SELISIH (Uang Baru Masuk)
                if (balance > recordedBalance) {
                    const newMoney = balance - recordedBalance
                    console.log(`💸 New Fund Detected on ${tx.paymentAddress}: +${newMoney}`)

                    // Panggil Logic Update
                    await processIncomingPayment(tx.paymentAddress, newMoney)
                }
            }

        } catch (e) {
            console.error("Watcher Error:", e)
        }

        // Tunggu 5 detik sebelum putaran berikutnya (Biar gak kena Rate Limit RPC)
        await new Promise(resolve => setTimeout(resolve, 5000))
    }
}

runWatcher()