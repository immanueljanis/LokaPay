import { prisma } from '@lokapay/database'

export const merchantRepository = {
    findByEmail: (email: string) => {
        return prisma.merchant.findUnique({ where: { email } })
    },

    create: (data: { name: string; email: string; passwordHash: string; bankName?: string | null; bankAccount?: string | null }) => {
        return prisma.merchant.create({
            data,
        })
    },

    findByIdSelect: (id: string) => {
        return prisma.merchant.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                balanceIDR: true,
                bankName: true,
                bankAccount: true,
                createdAt: true,
                updatedAt: true,
            },
        })
    },

    findByIdWithTransactions: (id: string) => {
        return prisma.merchant.findUnique({
            where: { id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
            },
        })
    },
}

