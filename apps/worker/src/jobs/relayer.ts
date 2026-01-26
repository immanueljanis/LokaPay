import { Job } from 'bullmq';
import { ethers } from 'ethers';
import { prisma } from '@lokapay/database';
import {
    relayerSigner,
    getFactoryContract,
    getVaultContract,
    USDC_ADDRESS,
    provider
} from '../constants/contracts';

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];

export async function relayProcessor(job: Job) {
    const { txId, paymentAddress, salt } = job.data;

    console.log(`\n🤖 [RELAYER] Mulai kerja job ID: ${job.id}`);
    console.log(`   Target: ${paymentAddress}`);

    const relayerBalance = await provider.getBalance(relayerSigner.address);
    if (relayerBalance < ethers.parseEther("1.0")) {
        console.warn("⚠️ PERINGATAN: Saldo Gas Relayer Menipis! Segera isi ulang.");
    }
    const relayerBalanceFormatted = parseFloat(ethers.formatEther(relayerBalance));
    const minGasRequired = 0.01;

    console.log(`   Relayer Balance: ${relayerBalanceFormatted} ${process.env.CHAIN_NETWORK as string}`);

    if (relayerBalance < ethers.parseEther(minGasRequired.toString())) {
        console.error(`❌ SALDO RELAYER KRITIS! Balance: ${relayerBalanceFormatted}, Minimum: ${minGasRequired}`);
        console.error(`   ⚠️ Tidak dapat melakukan deploy/sweep. Harap isi gas fee ke relayer address: ${relayerSigner.address}`);
        // Jangan throw error, hanya log dan return (job akan di-retry nanti)
        return;
    }

    const factory = getFactoryContract().connect(relayerSigner) as ethers.Contract;

    try {
        // STEP 1: DEPLOY VAULT
        const code = await provider.getCode(paymentAddress);
        const isDeployed = code !== '0x';

        if (!isDeployed) {
            console.log(`🏗️ Vault belum ada. Deploying...`);

            // Cek gas sebelum deploy
            try {
                if (factory.deployVault && typeof factory.deployVault.estimateGas === 'function') {
                    const estimatedGas = await factory.deployVault.estimateGas(salt, relayerSigner.address);
                    const gasPrice = await provider.getFeeData();
                    const estimatedCost = estimatedGas * (gasPrice.gasPrice || 0n);
                    const estimatedCostFormatted = parseFloat(ethers.formatEther(estimatedCost));

                    console.log(`   Estimated gas cost: ${estimatedCostFormatted} ${process.env.CHAIN_NETWORK as string}`);

                    if (relayerBalance < estimatedCost * 2n) {
                        console.error(`   ❌ Gas tidak cukup untuk deploy! Balance: ${relayerBalanceFormatted}, Estimated: ${estimatedCostFormatted}`);
                        console.error(`   ⚠️ Tidak akan melakukan deploy. Harap isi gas fee.`);
                        return; // Jangan throw, hanya return (job akan di-retry)
                    }
                }
            } catch (estimateError: any) {
                console.warn(`   ⚠️ Gas estimation failed:`, estimateError.message);
            }

            const deployTx = await factory?.deployVault?.(salt, relayerSigner.address);
            console.log(`   Tx Hash Deploy: ${deployTx.hash}`);
            await deployTx.wait();

            await prisma.transaction.update({ where: { id: txId }, data: { isDeployed: true } });
            console.log(`✅ Vault Deployed.`);
        }

        // STEP 2: CEK BALANCE SEBELUM SWEEP
        const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
        const vaultBalance = await usdcContract?.balanceOf?.(paymentAddress);
        const vaultBalanceFormatted = parseFloat(ethers.formatUnits(vaultBalance, 18));

        console.log(`   Vault Balance: ${vaultBalanceFormatted} USDC`);

        if (vaultBalanceFormatted === 0) {
            console.log(`   ⚠️ Vault balance is 0, skipping sweep`);
            // Update DB bahwa sudah di-sweep (meskipun tidak ada yang di-sweep)
            await prisma.transaction.update({
                where: { id: txId },
                data: {
                    sweptAt: new Date(),
                    gelatoTaskId: "AUTO-RELAYER-OP-SKIP"
                }
            });
            console.log(`   ✅ Marked as swept (no balance to sweep)`);
            return;
        }

        // STEP 3: SWEEP TOKENS
        console.log(`🧹 Sweeping ${vaultBalanceFormatted} USDC ke Hot Wallet...`);
        const vault = getVaultContract(paymentAddress).connect(relayerSigner) as ethers.Contract;

        // Cek apakah vault sudah di-deploy dengan benar
        const vaultCode = await provider.getCode(paymentAddress);
        if (vaultCode === '0x') {
            throw new Error(`Vault contract not deployed at ${paymentAddress}`);
        }

        // Cek apakah sweep function tersedia
        if (!vault.sweep || typeof vault.sweep !== 'function') {
            throw new Error(`Sweep function not available on vault contract at ${paymentAddress}`);
        }

        try {
            // Estimate gas untuk melihat apakah transaction akan berhasil
            try {
                if (vault.sweep.estimateGas && typeof vault.sweep.estimateGas === 'function') {
                    await vault.sweep.estimateGas(USDC_ADDRESS);
                }
            } catch (estimateError: any) {
                console.error(`   ⚠️ Gas estimation failed:`, estimateError.message);
                if (estimateError.reason) {
                    console.error(`   Reason:`, estimateError.reason);
                }
                throw new Error(`Sweep will fail: ${estimateError.reason || estimateError.message}`);
            }

            const sweepTx = await vault.sweep(USDC_ADDRESS);
            const sweepTxHash = sweepTx.hash;
            console.log(`   Tx Hash Sweep: ${sweepTxHash}`);
            const receipt = await sweepTx.wait();
            console.log(`   ✅ Sweep confirmed in block ${receipt?.blockNumber || 'unknown'}`);

            // STEP 4: FINALISASI DB dengan txHash
            await prisma.transaction.update({
                where: { id: txId },
                data: {
                    txHash: sweepTxHash, // Update txHash dengan hash dari sweep transaction
                    sweptAt: new Date(),
                    gelatoTaskId: "AUTO-RELAYER-OP"
                }
            });
        } catch (sweepError: any) {
            console.error(`   ❌ Sweep failed:`, sweepError.message);
            if (sweepError.reason) {
                console.error(`   Reason:`, sweepError.reason);
            }
            if (sweepError.data) {
                console.error(`   Error data:`, sweepError.data);
            }
            if (sweepError.code) {
                console.error(`   Error code:`, sweepError.code);
            }
            throw sweepError;
        }

        console.log(`🏁 Tugas Selesai! Uang aman.`);

    } catch (error: any) {
        console.error("⚠️ Relayer Gagal:", error.message);
        throw error;
    }
}