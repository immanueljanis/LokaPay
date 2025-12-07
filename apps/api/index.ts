import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { prisma } from '@lokapay/database'
import { getRealExchangeRate } from './utils/rate'
import { getFactoryContract, relayerSigner } from './constants/contracts'
import { ethers } from 'ethers'
import { createHmac } from 'crypto'
import { successResponse, errorResponse } from './utils/response'
import { generateToken } from './utils/jwt'
import { authMiddleware } from './middleware/auth'

// Define Hono context variables type
type Variables = {
    merchant: { merchantId: string; email: string }
}

const app = new Hono<{ Variables: Variables }>()

// 1. Middleware Global
app.use('*', logger()) // Agar log request muncul di terminal
app.use('*', cors())   // Agar frontend (Next.js) bisa akses API ini

// 2. Schema Validasi Input (Zod)
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

const registerSchema = z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    bankName: z.string().optional(),
    bankAccount: z.string().optional(),
})

const createTransactionSchema = z.object({
    merchantId: z.string().uuid(),
    amountIDR: z.number().min(10000), // Minimal bayar Rp 10.000
})

// 3. Endpoint Hello World (Cek Server)
app.get('/', (c) => {
    return successResponse(c, { status: 'running' }, 'LokaPay API is Running! 🚀')
})

// 4. Endpoint Register Merchant
app.post('/auth/register', async (c) => {
    try {
        // Ambil data dari body request
        const body = await c.req.json()

        // Validasi data
        const data = registerSchema.parse(body)

        // Cek apakah email sudah terdaftar
        const existingUser = await prisma.merchant.findUnique({
            where: { email: data.email }
        })

        if (existingUser) {
            return errorResponse(c, 'Email already registered', 400)
        }

        // Hash Password (Native Bun - Aman & Cepat)
        const passwordHash = await Bun.password.hash(data.password)

        // Simpan ke Database
        const newMerchant = await prisma.merchant.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: passwordHash,
                bankName: data.bankName,
                bankAccount: data.bankAccount
            }
        })

        // Return sukses (tanpa passwordHash)
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
        // Handle Error Validasi Zod
        if (e instanceof z.ZodError) {
            return errorResponse(c, e.issues[0]?.message || 'Validation error', 400)
        }
        // Handle Error Lainnya
        console.error(e)
        return errorResponse(c, 'Internal Server Error', 500)
    }
})

// Endpoint Login Merchant
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

        // Generate JWT token dengan expiry 8 jam
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
        // Get merchant from context (set by authMiddleware)
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

// Endpoint Create Transaction (Protected - requires auth)
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
        const spreadUSDT = rawUSDT * 0.015
        const finalUSDT = rawUSDT + spreadUSDT
        const feeApp = amountInvoice * 0.015 // Fee aplikasi 1.5% dari invoice

        // B. Generate Salt & Address
        const invoiceUUID = crypto.randomUUID()
        const salt = ethers.id(invoiceUUID) // Convert string ke bytes32

        // Kita tanya ke Factory: "Kalau salt-nya ini, alamatnya nanti apa?"
        // Owner vault adalah 'relayerSigner' kita (agar nanti backend bisa perintah sweep)
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
                amountUSDT: finalUSDT.toFixed(4),
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

// 4. Endpoint Webhook (Dihubungi oleh Tatum)
app.post('/webhook/tatum', async (c) => {
    try {
        const body = await c.req.json()
        const rawBody = JSON.stringify(body)

        // --- SECURITY: HMAC Verification (Aktifkan di Production) ---
        const computedHash = createHmac('sha512', process.env.TATUM_API_KEY!)
            .update(rawBody)
            .digest('base64')
        const signature = c.req.header('x-payload-hash')

        // Di Testnet Tatum kadang tidak kirim header ini, jadi log saja dulu
        if (signature && signature !== computedHash) {
            console.error("⛔ Fake Webhook Detected! Hash Mismatch")
            // return c.text('Forbidden', 403) // Uncomment di Production
        }
        // -------------------------------------------------------------

        const incomingAddress = body.address
        const incomingAmount = parseFloat(body.amount)
        const txHash = body.txId

        const transaction = await prisma.transaction.findFirst({
            where: {
                paymentAddress: incomingAddress,
                status: { in: ['PENDING', 'PARTIALLY_PAID'] }
            }
        })

        if (!transaction) {
            console.log(`⚠️ Transaction not found or already paid: ${incomingAddress}`)
            return c.text('OK')
        }

        // --- LOGIC LATE PAYMENT ---
        const now = new Date()
        const isExpired = now > transaction.expiresAt

        // Ambil data invoice
        const invoiceAmount = parseFloat(transaction.amountInvoice.toString())
        let expectedUSDT = parseFloat(transaction.amountUSDT.toString())
        let finalRate = parseFloat(transaction.exchangeRate.toString())
        let isRateUpdated = false

        if (isExpired) {
            console.log(`⚠️ Late Payment Detected! ID: ${transaction.id}`)
            const currentRate = await getRealExchangeRate()

            if (currentRate) {
                // Hitung ulang kebutuhan USDT dengan rate baru + spread 1.5%
                const newCalculatedUSDT = (invoiceAmount / currentRate) * 1.015

                // Hanya update jika rate turun (butuh lebih banyak USDT)
                // Jika rate naik (USDT menguat), merchant untung spread lebih, biarkan tagihan lama.
                if (newCalculatedUSDT > expectedUSDT) {
                    console.log(`📉 Rate Drop! Adjusting Bill: ${expectedUSDT} -> ${newCalculatedUSDT}`)
                    expectedUSDT = newCalculatedUSDT
                    finalRate = currentRate
                    isRateUpdated = true
                }
            }
        }

        // --- LOGIC AKUMULASI ---
        const currentReceivedUSDT = parseFloat(transaction.amountReceivedUSDT.toString())
        const totalReceivedUSDT = currentReceivedUSDT + incomingAmount

        let newStatus = transaction.status

        if (totalReceivedUSDT < (expectedUSDT - 0.0001)) {
            newStatus = 'PARTIALLY_PAID'
        } else if (totalReceivedUSDT > (expectedUSDT + 0.1)) {
            newStatus = 'OVERPAID'
        } else {
            newStatus = 'PAID'
        }

        // Hitung semua nilai yang diperlukan
        const amountReceivedIdr = Math.floor(totalReceivedUSDT * finalRate)

        // Hitung feeApp (1.5% dari invoice) - tetap sama meskipun rate berubah
        const feeApp = invoiceAmount * 0.015

        // Hitung tip jika overpaid
        let tipIdr = 0
        if (newStatus === 'OVERPAID') {
            const excessUSDT = totalReceivedUSDT - expectedUSDT
            tipIdr = Math.floor(excessUSDT * finalRate)
        }

        // --- UPDATE DATABASE ATOMIC ---
        await prisma.$transaction(async (tx) => {
            // Update Transaction dengan semua field yang sudah dihitung
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: newStatus,
                    // Field Payment Received
                    amountReceivedUSDT: totalReceivedUSDT,
                    amountReceivedIdr: amountReceivedIdr,
                    // Field Breakdown
                    tipIdr: tipIdr,
                    feeApp: feeApp, // Fee tetap 1.5% dari invoice
                    // Jika ada penyesuaian rate karena telat, update juga
                    amountUSDT: isRateUpdated ? expectedUSDT : undefined,
                    exchangeRate: isRateUpdated ? finalRate : undefined,
                    // Blockchain
                    txHash: (newStatus === 'PAID' || newStatus === 'OVERPAID') ? txHash : undefined,
                    confirmedAt: (newStatus === 'PAID' || newStatus === 'OVERPAID') ? new Date() : undefined,
                }
            })

            // Update Merchant Balance (Hanya jika Status Baru = Lunas, dan sebelumnya belum Lunas)
            const isFinal = newStatus === 'PAID' || newStatus === 'OVERPAID'
            const wasNotFinal = transaction.status !== 'PAID' && transaction.status !== 'OVERPAID'

            if (isFinal && wasNotFinal) {
                // Merchant menerima invoiceAmount (tagihan asli) + tip jika ada
                const invoiceValue = parseFloat(transaction.amountInvoice.toString())
                let creditIDR = invoiceValue + tipIdr

                await tx.merchant.update({
                    where: { id: transaction.merchantId },
                    data: { balanceIDR: { increment: creditIDR } }
                })
                console.log(`💰 Merchant Credited: Rp ${creditIDR} (Invoice: ${invoiceValue} + Tip: ${tipIdr})`)
            }
        })

        return c.text('OK')
    } catch (e) {
        console.error('Webhook Error:', e)
        return c.text('Error handled', 200)
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

// Export untuk Bun
console.log('🚀 API Server starting on port 3001...')
export default {
    port: 3001,
    fetch: app.fetch,
}