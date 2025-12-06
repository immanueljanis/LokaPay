import { Job } from 'bullmq';
import { ethers } from 'ethers';
import { prisma } from '@lokapay/database';
import {
    relayerSigner,
    getFactoryContract,
    getVaultContract,
    USDT_ADDRESS,
    provider
} from '../constants/contracts';

export async function relayProcessor(job: Job) {
    const { txId, paymentAddress, salt } = job.data;

    console.log(`\n🤖 [RELAYER] Mulai kerja job ID: ${job.id}`);
    console.log(`   Target: ${paymentAddress}`);

    const relayerBalance = await provider.getBalance(relayerSigner.address);
    if (relayerBalance < ethers.parseEther("0.01")) {
        throw new Error("❌ SALDO RELAYER KRITIS! Harap isi gas fee.");
    }

    const factory = getFactoryContract().connect(relayerSigner) as ethers.Contract;

    try {
        // STEP 1: DEPLOY VAULT
        const code = await provider.getCode(paymentAddress);
        const isDeployed = code !== '0x';

        if (!isDeployed) {
            console.log(`🏗️ Vault belum ada. Deploying...`);

            // Estimasi gas opsional, tapi langsung tembak juga oke kalau MNT murah
            const deployTx = await factory?.deployVault?.(salt, relayerSigner.address);
            console.log(`   Tx Hash Deploy: ${deployTx.hash}`);
            await deployTx.wait();

            await prisma.transaction.update({ where: { id: txId }, data: { isDeployed: true } });
            console.log(`✅ Vault Deployed.`);
        }

        // STEP 2: SWEEP TOKENS
        console.log(`🧹 Sweeping tokens ke Hot Wallet...`);
        const vault = getVaultContract(paymentAddress).connect(relayerSigner) as ethers.Contract;

        const sweepTx = await vault?.sweep?.(USDT_ADDRESS);
        console.log(`   Tx Hash Sweep: ${sweepTx.hash}`);
        await sweepTx.wait();

        // STEP 3: FINALISASI DB
        await prisma.transaction.update({
            where: { id: txId },
            data: {
                sweptAt: new Date(),
                gelatoTaskId: "AUTO-RELAYER-OP"
            }
        });

        console.log(`🏁 Tugas Selesai! Uang aman.`);

    } catch (error: any) {
        console.error("⚠️ Relayer Gagal:", error.message);
        throw error;
    }
}