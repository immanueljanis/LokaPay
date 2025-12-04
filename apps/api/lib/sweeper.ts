import { ethers } from 'ethers'
import { prisma } from '@lokapay/database'
import { relayerSigner, getFactoryContract, getVaultContract, USDT_ADDRESS, provider } from '../constants/contracts'

async function runManualRelayer() {
    console.log('🤖 Self-Hosted Relayer running on Mantle...')
    console.log(`👮 Relayer Address: ${relayerSigner.address}`)

    // Cek saldo Relayer dulu
    const balance = await provider.getBalance(relayerSigner.address)
    console.log(`⛽ Relayer Balance: ${ethers.formatEther(balance)} MNT`)

    if (balance === 0n) {
        console.error("❌ SALDO RELAYER KOSONG! Isi MNT dulu ke alamat di atas.")
        return
    }

    // 1. Cari Transaksi PAID yang belum disapu
    const targets = await prisma.transaction.findMany({
        where: {
            status: { in: ['PAID', 'OVERPAID'] },
            sweptAt: null,
            salt: { not: null }
        },
        take: 5
    })

    console.log(`🔎 Found ${targets.length} vaults to sweep.`)

    for (const tx of targets) {
        try {
            console.log(`\n--- Processing ${tx.paymentAddress} ---`)

            const factory = getFactoryContract().connect(relayerSigner) as ethers.Contract

            // STEP A: Deploy Vault (Jika belum)
            // Kita cek apakah kontrak sudah ada di alamat tersebut
            const code = await provider.getCode(tx.paymentAddress)
            const isDeployedOnChain = code !== '0x'

            if (!isDeployedOnChain) {
                console.log(`🏗️ Vault belum ada. Relayer deploying...`)

                // Relayer memanggil factory untuk deploy
                const deployTx = await factory.deployVault(tx.salt!, relayerSigner.address)
                console.log(`⏳ Waiting for deploy... (Tx: ${deployTx.hash})`)
                await deployTx.wait()

                await prisma.transaction.update({ where: { id: tx.id }, data: { isDeployed: true } })
                console.log(`✅ Vault Deployed!`)
            } else {
                console.log(`ℹ️ Vault sudah ada on-chain.`)
            }

            // STEP B: Sweep Manual
            // Karena 'relayerSigner' adalah OWNER dari vault (diset saat create transaction),
            // maka relayerSigner BISA memanggil fungsi sweep() secara langsung.
            console.log(`🧹 Sweeping tokens...`)

            // Hubungkan kontrak vault dengan signer (agar bisa kirim transaksi)
            const vault = getVaultContract(tx.paymentAddress).connect(relayerSigner) as ethers.Contract

            // Panggil fungsi
            const sweepTx = await vault.sweep(USDT_ADDRESS)
            console.log(`⏳ Waiting for sweep... (Tx: ${sweepTx.hash})`)
            await sweepTx.wait()

            console.log(`✅ Swept Successfully!`)

            // Update DB
            await prisma.transaction.update({
                where: { id: tx.id },
                data: {
                    sweptAt: new Date(),
                    gelatoTaskId: "SELF-HOSTED" // Tandai ini manual
                }
            })

        } catch (e) {
            console.error("❌ Error:", e)
        }
    }
}

runManualRelayer()
    .catch(console.error)
    .finally(() => prisma.$disconnect())