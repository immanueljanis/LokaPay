import { ethers } from 'ethers'
import { SPREAD_VALUE, TRANSACTION_FEE } from '../constants/value'
import { getFactoryContract, relayerSigner } from '../constants/contracts'
import { getRealExchangeRate, roundUpTo } from '../utils/rate'
import { transactionRepository } from '../repositories/transactionRepository'
import { generateShortCode } from '../utils/shortCode'

export const transactionService = {
    createTransaction: async (data: { merchantId: string; amountIDR: number }) => {
        const rate = await getRealExchangeRate()
        if (!rate) {
            return { error: 'Failed to get exchange rate' }
        }

        const amountInvoice = data.amountIDR
        const rawUSDT = amountInvoice / rate
        const spreadUSDT = rawUSDT * SPREAD_VALUE
        const calculatedUSDT = rawUSDT + spreadUSDT
        const finalUSDT = roundUpTo(calculatedUSDT, 3)
        const feeApp = amountInvoice * TRANSACTION_FEE

        const invoiceUUID = crypto.randomUUID()
        const salt = ethers.id(invoiceUUID)

        const factory = getFactoryContract()
        const predictedAddress = await (factory.getVaultAddress as (salt: string, owner: string) => Promise<string>)(salt, relayerSigner.address)

        let shortCode = generateShortCode()
        let attempts = 0
        const maxAttempts = 10
        while (attempts < maxAttempts) {
            const existing = await transactionRepository.findByShortCode(shortCode)
            if (!existing) break
            shortCode = generateShortCode()
            attempts++
        }

        const transaction = await transactionRepository.create({
            merchantId: data.merchantId,
            amountInvoice: amountInvoice,
            amountUSDT: finalUSDT,
            exchangeRate: rate,
            amountReceivedUSDT: 0,
            amountReceivedIdr: 0,
            tipIdr: 0,
            feeApp: feeApp,
            network: "MANTLE",
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
            amountUSDT: finalUSDT,
            exchangeRate: rate,
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

