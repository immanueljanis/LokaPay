import { prisma } from '@lokapay/database'

async function cleanupExpired() {
    console.log('🧹 Cleaning up expired transactions...')

    const now = new Date()

    const result = await prisma.transaction.updateMany({
        where: {
            status: 'PENDING',
            expiresAt: {
                lt: new Date(now.getTime() - 60 * 60 * 1000)
            }
        },
        data: {
            status: 'EXPIRED'
        }
    })

    console.log(`✅ Expired ${result.count} old transactions.`)
}

cleanupExpired()
    .catch(console.error)
    .finally(() => prisma.$disconnect())