import { prisma } from '@lokapay/database'

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lokapay.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@lokapay.com'

    const existing = await prisma.merchant.findUnique({ where: { email: adminEmail } })
    if (existing) {
        console.log('Admin already exists:', adminEmail)
        return
    }

    const passwordHash = await Bun.password.hash(adminPassword)
    const admin = await prisma.merchant.create({
        data: {
            name: 'Admin',
            email: adminEmail,
            passwordHash,
            role: 'ADMIN',
            bankName: 'BCA',
            bankAccount: '0000000000',
            bankHolder: 'Admin',
        },
    })

    console.log('Admin created:', adminEmail)
}

main().then(() => process.exit(0)).catch((e) => {
    console.error(e)
    process.exit(1)
})

