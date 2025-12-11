import { prisma } from '@lokapay/database'

export const transactionRepository = {
    create: (data: {
        merchantId: string
        amountInvoice: number
        amountUSDT: number
        exchangeRate: number
        amountReceivedUSDT: number
        amountReceivedIdr: number
        tipIdr: number
        feeApp: number
        network: string
        paymentAddress: string
        salt: string
        isDeployed: boolean
        expiresAt: Date
    }) => {
        return prisma.transaction.create({ data })
    },

    findById: (id: string) => {
        return prisma.transaction.findUnique({ where: { id } })
    },
}

