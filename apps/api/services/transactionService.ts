import { ethers } from 'ethers'
import { TRANSACTION_FEE } from '../constants/value'
import { getFactoryContract, relayerSigner } from '../constants/contracts'
import { pricingService } from '../utils/rate'
import { roundUpTo } from '../utils/rate'
import { transactionRepository } from '../repositories/transactionRepository'
import { generateShortCode } from '../utils/shortCode'

export const transactionService = {
    createTransaction: async (data: { merchantId: string; amountIDR: number }) => {
        const rateData = await pricingService.getRateWithSpread(data.amountIDR) as { marketRate: number; finalUSD: number };
        if (!rateData) {
            return { error: 'Failed to get exchange rate from IDRX' };
        }
        const { marketRate, finalUSD } = rateData;
        const amountInvoice = data.amountIDR
        const feeApp = amountInvoice * TRANSACTION_FEE;
        const invoiceUUID = crypto.randomUUID();
        const salt = ethers.id(invoiceUUID);

        const factory = getFactoryContract();
        const predictedAddress = await (factory.getVaultAddress as (salt: string, owner: string) => Promise<string>)(salt, relayerSigner.address);

        let shortCode = generateShortCode();
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            const existing = await transactionRepository.findByShortCode(shortCode);
            if (!existing) break;
            shortCode = generateShortCode();
            attempts++;
        }

        const transaction = await transactionRepository.create({
            merchantId: data.merchantId,
            amountInvoice: amountInvoice,
            amountUSD: finalUSD,
            exchangeRate: marketRate,
            amountReceivedUSD: 0,
            amountReceivedIdr: 0,
            tipIdr: 0,
            feeApp: feeApp,
            network: process.env.CHAIN_NETWORK as string,
            paymentAddress: predictedAddress,
            salt: salt,
            shortCode: shortCode,
            isDeployed: false,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        })

        return {
            invoiceId: transaction.id,
            shortCode: (transaction as any).shortCode || null,
            amountInvoice: amountInvoice,
            amountUSD: finalUSD,
            exchangeRate: marketRate,
            feeApp: feeApp,
            paymentAddress: predictedAddress,
            expiresIn: '5 minutes',
        }
    },

    getById: async (id: string) => {
        return transactionRepository.findById(id)
    },

    getByShortCode: async (shortCode: string) => {
        return transactionRepository.findByShortCode(shortCode)
    },

    listAll: async () => {
        return transactionRepository.findAllWithMerchant()
    },
}

