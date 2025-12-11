import { prisma } from '@lokapay/database'

type Tx = Pick<typeof prisma, 'merchant' | 'payout'>
type PayoutCreateData = Parameters<Tx['payout']['create']>[0]['data']

export const payoutRepository = {
    findMerchantById: async (merchantId: string, tx: Tx = prisma) => {
        return tx.merchant.findUnique({
            where: { id: merchantId },
        })
    },

    decrementMerchantBalance: async (merchantId: string, amount: number, tx: Tx = prisma) => {
        return tx.merchant.update({
            where: { id: merchantId },
            data: {
                balanceIDR: { decrement: amount },
            },
        })
    },

    incrementMerchantBalance: async (merchantId: string, amount: number, tx: Tx = prisma) => {
        return tx.merchant.update({
            where: { id: merchantId },
            data: {
                balanceIDR: { increment: amount },
            },
        })
    },

    createPayout: async (data: PayoutCreateData, tx: Tx = prisma) => {
        return tx.payout.create({ data })
    },

    findPayoutById: async (payoutId: string, tx: Tx = prisma) => {
        return tx.payout.findUnique({
            where: { id: payoutId },
        })
    },

    findPayoutsByMerchant: async (merchantId: string, tx: Tx = prisma) => {
        return tx.payout.findMany({
            where: { merchantId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        })
    },

    updatePayoutStatus: async (
        payoutId: string,
        status: 'COMPLETED' | 'REJECTED',
        extraData: Record<string, any> = {},
        tx: Tx = prisma
    ) => {
        return tx.payout.update({
            where: { id: payoutId },
            data: {
                status,
                ...extraData,
                updatedAt: new Date(),
            },
        })
    },
}