import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { prisma } from '@lokapay/database'
import { getRealExchangeRate, subscribeToIncomingTxs } from './lib/tatum'
import { getFactoryContract, relayerSigner } from './constants/contracts'
import { ethers } from 'ethers'
import { createHmac } from 'crypto'

const app = new Hono()

// 1. Middleware Global
app.use('*', logger()) // Agar log request muncul di terminal
app.use('*', cors())   // Agar frontend (Next.js) bisa akses API ini

// 2. Schema Validasi Input (Zod)
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
    return c.json({ message: 'LokaPay API is Running! 🚀' })
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
            return c.json({ error: 'Email already registered' }, 400)
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
        return c.json({
            message: 'Registration successful',
            merchant: {
                id: newMerchant.id,
                name: newMerchant.name,
                email: newMerchant.email
            }
        }, 201)

    } catch (e) {
        // Handle Error Validasi Zod
        if (e instanceof z.ZodError) {
            return c.json({ error: e.issues }, 400)
        }
        // Handle Error Lainnya
        console.error(e)
        return c.json({ error: 'Internal Server Error' }, 500)
    }
})

// Endpoint Create Transaction
app.post('/transaction/create', async (c) => {
    try {
        const body = await c.req.json()
        const data = createTransactionSchema.parse(body)

        // A. Ambil Rate (Tetap sama)
        const rate = await getRealExchangeRate()
        if (!rate) {
            return c.json({ error: 'Failed to get exchange rate' }, 500)
        }

        const rawUSDT = data.amountIDR / rate
        const spread = rawUSDT * 0.015
        const finalUSDT = rawUSDT + spread

        // B. Generate Salt & Address
        const invoiceUUID = crypto.randomUUID()
        const salt = ethers.id(invoiceUUID) // Convert string ke bytes32

        // Kita tanya ke Factory: "Kalau salt-nya ini, alamatnya nanti apa?"
        // Owner vault adalah 'relayerSigner' kita (agar nanti backend bisa perintah sweep)
        const factory = getFactoryContract()
        const predictedAddress = await (factory.getVaultAddress as (salt: string, owner: string) => Promise<string>)(salt, relayerSigner.address)
        const webhookBase = process.env.WEBHOOK_BASE_URL

        if (webhookBase) {
            const webhookUrl = `${webhookBase}/webhook/tatum`
            subscribeToIncomingTxs(predictedAddress, webhookUrl)
                .then(id => console.log(`🪝 Hook registered: ${id}`))
                .catch(err => console.error("Hook failed", err))
        } else {
            console.warn("⚠️ WEBHOOK_BASE_URL belum diset! Tatum tidak akan lapor.")
        }

        // C. Simpan ke DB (Update field baru)
        const transaction = await prisma.transaction.create({
            data: {
                merchantId: data.merchantId,
                amountIDR: data.amountIDR,
                amountUSDT: finalUSDT,
                exchangeRate: rate,
                network: "MANTLE",

                paymentAddress: predictedAddress,
                salt: salt,
                isDeployed: false,

                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            }
        })

        return c.json({
            message: 'Invoice created',
            data: {
                invoiceId: transaction.id,
                amountIDR: data.amountIDR,
                amountUSDT: finalUSDT.toFixed(4),
                rateUsed: rate,
                paymentAddress: predictedAddress,
                expiresIn: '5 minutes'
            }
        }, 201)

    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ error: e.issues }, 400)
        console.error(e)
        return c.json({ error: 'Transaction Failed' }, 500)
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

        // Default: Gunakan data lama
        let expectedUSDT = parseFloat(transaction.amountUSDT.toString())
        let finalRate = parseFloat(transaction.exchangeRate.toString())
        let isRateUpdated = false

        if (isExpired) {
            console.log(`⚠️ Late Payment Detected! ID: ${transaction.id}`)
            const currentRate = await getRealExchangeRate()

            if (currentRate) {
                const idrAmount = parseFloat(transaction.amountIDR.toString())
                // Hitung ulang kebutuhan USDT dengan rate baru + spread 1.5%
                const newCalculatedUSDT = (idrAmount / currentRate) * 1.015

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
        const currentReceived = parseFloat(transaction.amountReceived.toString())
        const totalReceived = currentReceived + incomingAmount

        let newStatus = transaction.status

        if (totalReceived < (expectedUSDT - 0.0001)) {
            newStatus = 'PARTIALLY_PAID'
        } else if (totalReceived > (expectedUSDT + 0.1)) {
            newStatus = 'OVERPAID'
        } else {
            newStatus = 'PAID'
        }

        // --- UPDATE DATABASE ATOMIC ---
        await prisma.$transaction(async (tx) => {
            // Update Transaction
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: newStatus,
                    amountReceived: { increment: incomingAmount },
                    // Jika ada penyesuaian rate karena telat, update juga
                    amountUSDT: isRateUpdated ? expectedUSDT : undefined,
                    exchangeRate: isRateUpdated ? finalRate : undefined,

                    txHash: (newStatus === 'PAID' || newStatus === 'OVERPAID') ? txHash : undefined,
                    confirmedAt: (newStatus === 'PAID' || newStatus === 'OVERPAID') ? new Date() : undefined,
                }
            })

            // Update Merchant Balance (Hanya jika Status Baru = Lunas, dan sebelumnya belum Lunas)
            const isFinal = newStatus === 'PAID' || newStatus === 'OVERPAID'
            const wasNotFinal = transaction.status !== 'PAID' && transaction.status !== 'OVERPAID'

            if (isFinal && wasNotFinal) {
                let creditIDR = parseFloat(transaction.amountIDR.toString())

                // Hitung Tip (Overpaid)
                if (newStatus === 'OVERPAID') {
                    // Gunakan rate final (bisa lama atau baru)
                    const excessUSDT = totalReceived - expectedUSDT
                    const excessIDR = Math.floor(excessUSDT * finalRate)
                    creditIDR += excessIDR
                    console.log(`🤑 Tip Detected: ${excessUSDT} USDT -> Rp ${excessIDR}`)
                }

                await tx.merchant.update({
                    where: { id: transaction.merchantId },
                    data: { balanceIDR: { increment: creditIDR } }
                })
                console.log(`💰 Merchant Credited: Rp ${creditIDR}`)
            }
        })

        return c.text('OK')
    } catch (e) {
        console.error('Webhook Error:', e)
        return c.text('Error handled', 200)
    }
})

// 5. Endpoint Get Detail Transaksi
app.get('/transaction/:id', async (c) => {
    const id = c.req.param('id')

    const transaction = await prisma.transaction.findUnique({
        where: { id }
    })

    if (!transaction) return c.json({ error: 'Not found' }, 404)

    return c.json({ data: transaction })
})

// 6. Endpoint Get Merchant Dashboard (Profile + History)
app.get('/merchant/:id/dashboard', async (c) => {
    const id = c.req.param('id')

    try {
        const merchant = await prisma.merchant.findUnique({
            where: { id },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' }, // Urutkan dari yang terbaru
                    take: 20 // Ambil 20 terakhir saja biar ringan
                }
            }
        })

        if (!merchant) return c.json({ error: 'Merchant not found' }, 404)

        // Return data yang aman (hapus passwordHash)
        const { passwordHash, ...safeMerchant } = merchant
        return c.json({ data: safeMerchant })

    } catch (e) {
        console.error(e)
        return c.json({ error: 'Server error' }, 500)
    }
})

// Export untuk Bun
export default {
    port: 3001,
    fetch: app.fetch,
}