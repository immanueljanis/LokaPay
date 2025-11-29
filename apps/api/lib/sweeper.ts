import { ethers } from 'ethers'
import { prisma } from '@lokapay/database'

// Config
const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL)
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider)
const COLD_WALLET = process.env.COLD_WALLET_ADDRESS!

const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'
const ERC20_ABI = [
    "function transfer(address to, uint amount) returns (bool)",
    "function balanceOf(address owner) view returns (uint)"
]

async function runSweeper() {
    console.log('🧹 Mulai menyapu wallet deposit...')
    console.log(`👮 Admin Wallet: ${adminWallet.address}`) // Cek apakah ini alamat Admin yang benar?

    const unsweptTx = await prisma.transaction.findMany({
        where: {
            status: { in: ['PAID', 'OVERPAID'] },
            sweptAt: null,
            privateKey: { not: null }
        },
        take: 5
    })

    console.log(`🔎 Ditemukan ${unsweptTx.length} wallet untuk dikuras.`)

    for (const tx of unsweptTx) {
        try {
            console.log(`\n--- Memproses Invoice ID: ${tx.id.slice(0, 8)} ---`)

            if (!tx.privateKey) continue

            const depositWallet = new ethers.Wallet(tx.privateKey, provider)

            // SAFETY CHECK: Jangan sampai Admin menyapu dirinya sendiri
            if (depositWallet.address === adminWallet.address) {
                console.log(depositWallet.address, adminWallet.address)
                console.error('❌ FATAL: Admin Wallet sama dengan Deposit Wallet! Cek .env Anda.')
                continue
            }

            const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, depositWallet) as ethers.Contract & {
                balanceOf: (address: string) => Promise<bigint>
                transfer: (to: string, amount: bigint, overrides?: ethers.Overrides) => Promise<ethers.ContractTransactionResponse>
            }
            const balance = await usdtContract.balanceOf(depositWallet.address)

            if (balance == 0n) {
                console.log('⚠️ Saldo USDT Kosong. Skip.')
                // Opsional: Tandai swept agar tidak dicek lagi
                continue
            }

            console.log(`💰 Saldo terdeteksi: ${ethers.formatUnits(balance, 18)} USDT`)

            // --- TAHAP 1: KIRIM BENSIN (BNB) ---
            // PERBAIKAN: Hardcode Gas Price BSC (3 Gwei) agar pasti cukup
            const GAS_PRICE = ethers.parseUnits('3', 'gwei')
            const GAS_LIMIT_TOKEN = 100000n // Estimasi aman transfer token

            // Biaya Bensin = 3 Gwei * 100.000 = 0.0003 BNB
            const costBNB = GAS_PRICE * GAS_LIMIT_TOKEN

            console.log(`⛽ Mengirim bensin ${ethers.formatEther(costBNB)} BNB ke ${depositWallet.address}...`)

            // Cek Saldo Admin Dulu
            const adminBalance = await provider.getBalance(adminWallet.address)
            if (adminBalance < costBNB) {
                console.error('❌ Saldo Admin sekarat! Isi ulang BNB di Admin Wallet.')
                break // Stop loop
            }

            const txGas = await adminWallet.sendTransaction({
                to: depositWallet.address,
                value: costBNB,
                gasPrice: GAS_PRICE // Paksa pakai harga ini
            })

            console.log(`⏳ Menunggu bensin masuk... (Hash: ${txGas.hash})`)
            await txGas.wait()
            console.log('✅ Bensin sampai!')

            // --- TAHAP 2: SAPU TOKEN (USDT) ---
            console.log(`💸 Mengirim seluruh USDT ke Cold Wallet...`)

            // Gunakan gas price & limit yang sama biar gak gagal
            const txSweep = await usdtContract.transfer(COLD_WALLET, balance, {
                gasPrice: GAS_PRICE,
                gasLimit: GAS_LIMIT_TOKEN
            })

            console.log(`⏳ Menunggu konfirmasi sweep...`)
            await txSweep.wait()

            console.log(`✅ Sukses disapu! Hash: ${txSweep.hash}`)

            // --- TAHAP 3: SAPU SISA BENSIN (BNB) ---
            // Kita cek, apakah sisa remahannya layak diambil?
            const remainingBNB = await provider.getBalance(depositWallet.address)

            // Biaya transfer standar BNB (21,000 gas)
            const gasLimitBNB = 21000n
            const feeBNB = GAS_PRICE * gasLimitBNB

            // Syarat: Sisa BNB harus lebih besar dari biaya kirim (biar gak rugi)
            if (remainingBNB > feeBNB) {
                console.log(`🧹 Menyapu remahan BNB: ${ethers.formatEther(remainingBNB)} BNB`)

                // Rumus: Kirim Semua - Biaya Kirim
                const amountToSweep = remainingBNB - feeBNB

                const txSweepBNB = await depositWallet.sendTransaction({
                    to: COLD_WALLET, // Kembalikan ke Admin/Cold Wallet
                    value: amountToSweep,
                    gasPrice: GAS_PRICE,
                    gasLimit: gasLimitBNB
                })

                await txSweepBNB.wait()
                console.log(`✅ Remahan BNB diamankan! Sisa di wallet: 0`)
            } else {
                console.log(`💨 Sisa BNB terlalu kecil (${ethers.formatEther(remainingBNB)}). Dibiarkan saja.`)
            }

            // --- TAHAP 4: UPDATE DB ---
            await prisma.transaction.update({
                where: { id: tx.id },
                data: { sweptAt: new Date() }
            })

        } catch (error) {
            console.error(`❌ Gagal menyapu wallet:`, error)
        }
    }

    console.log('\n😴 Selesai.')
}

runSweeper()
    .catch(console.error)
    .finally(() => prisma.$disconnect())