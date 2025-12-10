import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { prisma } from '@lokapay/database'
import { getRealExchangeRate, roundUpTo } from './utils/rate'
import { getFactoryContract, relayerSigner } from './constants/contracts'
import { ethers } from 'ethers'
import { successResponse, errorResponse } from './utils/response'
import { generateToken } from './utils/jwt'
import { authMiddleware } from './middleware/auth'
import { SPREAD_VALUE, TRANSACTION_FEE } from './constants/value'
import { loginSchema, registerSchema, createTransactionSchema } from './schema'

// Define Hono context variables type
type Variables = {
    merchant: { merchantId: string; email: string }
}

const app = new Hono<{ Variables: Variables }>()

app.use('*', logger())
app.use('*', cors())

app.get('/', (c) => {
    return successResponse(c, { status: 'running', version: '1.0.0', network: process.env.NETWORK, uptime: process.uptime() }, 'LokaPay API is Running! 🚀', 200)
})

app.post('/auth/register', async (c) => {
    try {
        const body = await c.req.json()
        const data = registerSchema.parse(body)

        const existingUser = await prisma.merchant.findUnique({
            where: { email: data.email }
        })

        if (existingUser) {
            return errorResponse(c, 'Email already registered', 400)
        }
        const passwordHash = await Bun.password.hash(data.password)

        const newMerchant = await prisma.merchant.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: passwordHash,
                bankName: data.bankName,
                bankAccount: data.bankAccount
            }
        })

        return successResponse(
            c,
            {
                merchant: {
                    id: newMerchant.id,
                    name: newMerchant.name,
                    email: newMerchant.email
                }
            },
            'Registration successful',
            201
        )

    } catch (e) {
        if (e instanceof z.ZodError) {
            return errorResponse(c, e.issues[0]?.message || 'Validation error', 400)
        }
        console.error(e)
        return errorResponse(c, 'Internal Server Error', 500)
    }
})

app.post('/auth/login', async (c) => {
    try {
        const body = await c.req.json()
        const data = loginSchema.parse(body)

        const merchant = await prisma.merchant.findUnique({
            where: { email: data.email }
        })

        if (!merchant) {
            return errorResponse(c, 'Email atau password salah', 401)
        }

        const isMatch = await Bun.password.verify(data.password, merchant.passwordHash)

        if (!isMatch) {
            return errorResponse(c, 'Email atau password salah', 401)
        }

        const token = await generateToken({
            merchantId: merchant.id,
            email: merchant.email
        })

        return successResponse(
            c,
            {
                merchant: {
                    id: merchant.id,
                    name: merchant.name,
                    email: merchant.email,
                    balanceIDR: merchant.balanceIDR
                },
                token
            },
            'Login successful'
        )

    } catch (e) {
        if (e instanceof z.ZodError) {
            return errorResponse(c, e.issues[0]?.message || 'Validation error', 400)
        }
        console.error(e)
        return errorResponse(c, 'Internal Server Error', 500)
    }
})

app.get('/merchant/me', authMiddleware, async (c) => {
    try {
        const merchant = c.get('merchant')
        if (!merchant) {
            return errorResponse(c, 'Unauthorized', 401)
        }

        const merchantData = await prisma.merchant.findUnique({
            where: { id: merchant.merchantId },
            select: {
                id: true,
                name: true,
                email: true,
                balanceIDR: true,
                bankName: true,
                bankAccount: true,
                createdAt: true,
                updatedAt: true,
            }
        })

        if (!merchantData) {
            return errorResponse(c, 'Merchant not found', 404)
        }

        return successResponse(
            c,
            {
                id: merchantData.id,
                name: merchantData.name,
                email: merchantData.email,
                balanceIDR: merchantData.balanceIDR.toString(),
                bankName: merchantData.bankName,
                bankAccount: merchantData.bankAccount,
                createdAt: merchantData.createdAt,
                updatedAt: merchantData.updatedAt,
            },
            'Merchant data retrieved successfully'
        )

    } catch (e) {
        console.error(e)
        return errorResponse(c, 'Internal Server Error', 500)
    }
})

app.post('/transaction/create', authMiddleware, async (c) => {
    try {
        const body = await c.req.json()
        const data = createTransactionSchema.parse(body)

        // A. Ambil Rate (Tetap sama)
        const rate = await getRealExchangeRate()
        if (!rate) {
            return errorResponse(c, 'Failed to get exchange rate', 500)
        }

        // Hitung semua nilai yang diperlukan
        const amountInvoice = data.amountIDR
        const rawUSDT = amountInvoice / rate
        const spreadUSDT = rawUSDT * SPREAD_VALUE
        const calculatedUSDT = rawUSDT + spreadUSDT
        const finalUSDT = roundUpTo(calculatedUSDT, 3)
        const feeApp = amountInvoice * TRANSACTION_FEE

        // B. Generate Salt & Address
        const invoiceUUID = crypto.randomUUID()
        const salt = ethers.id(invoiceUUID)

        const factory = getFactoryContract()
        const predictedAddress = await (factory.getVaultAddress as (salt: string, owner: string) => Promise<string>)(salt, relayerSigner.address)

        // C. Simpan ke DB dengan semua field yang sudah dihitung
        const transaction = await prisma.transaction.create({
            data: {
                merchantId: data.merchantId,
                // Field baru
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
                isDeployed: false,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            }
        })

        return successResponse(
            c,
            {
                invoiceId: transaction.id,
                amountInvoice: amountInvoice,
                amountUSDT: finalUSDT,
                exchangeRate: rate,
                feeApp: feeApp,
                paymentAddress: predictedAddress,
                expiresIn: '5 minutes',
            },
            'Invoice created',
            201
        )

    } catch (e) {
        if (e instanceof z.ZodError) {
            return errorResponse(c, e.issues[0]?.message || 'Validation error', 400)
        }
        console.error(e)
        return errorResponse(c, 'Transaction Failed', 500)
    }
})

app.get('/transaction/:id', authMiddleware, async (c) => {
    const id = c.req.param('id')
    const merchant = c.get('merchant')

    const transaction = await prisma.transaction.findUnique({
        where: { id }
    })

    if (!transaction) {
        return errorResponse(c, 'Transaction not found', 404)
    }

    const transactionMerchantId = String(transaction.merchantId)
    const tokenMerchantId = String(merchant.merchantId)

    if (transactionMerchantId !== tokenMerchantId) {
        return errorResponse(c, 'Forbidden: You can only access your own transactions', 403)
    }

    return successResponse(c, transaction, 'Transaction retrieved successfully')
})

app.get('/merchant/:id/dashboard', authMiddleware, async (c) => {
    const id = c.req.param('id')
    const merchant = c.get('merchant')

    const routeMerchantId = String(id)
    const tokenMerchantId = String(merchant.merchantId)

    if (routeMerchantId !== tokenMerchantId) {
        return errorResponse(c, 'Forbidden: You can only access your own data', 403)
    }

    try {
        const merchantData = await prisma.merchant.findUnique({
            where: { id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        })

        if (!merchantData) {
            return errorResponse(c, 'Merchant not found', 404)
        }

        const { passwordHash, ...safeMerchant } = merchantData
        return successResponse(c, safeMerchant, 'Merchant dashboard data retrieved successfully')

    } catch (e) {
        console.error(e)
        return errorResponse(c, 'Server error', 500)
    }
})

console.log('🚀 API Server starting on port 3001...')
export default {
    port: 3001,
    fetch: app.fetch,
}