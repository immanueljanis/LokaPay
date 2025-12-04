import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { prisma } from '@lokapay/database'
import { getRealExchangeRate, generateDepositWallet } from './lib/tatum'
import { getFactoryContract, relayerSigner } from './constants/contracts'
import { ethers } from 'ethers'

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
        const rawUSDT = data.amountIDR / rate
        const spread = rawUSDT * 0.015
        const finalUSDT = rawUSDT + spread

        // B. Generate Salt & Address (LOGIC BARU V2)
        const invoiceUUID = crypto.randomUUID()
        const salt = ethers.id(invoiceUUID) // Convert string ke bytes32

        // Kita tanya ke Factory: "Kalau salt-nya ini, alamatnya nanti apa?"
        // Owner vault adalah 'relayerSigner' kita (agar nanti backend bisa perintah sweep)
        const factory = getFactoryContract()
        const predictedAddress = await (factory.getVaultAddress as (salt: string, owner: string) => Promise<string>)(salt, relayerSigner.address)

        // C. Simpan ke DB (Update field baru)
        const transaction = await prisma.transaction.create({
            data: {
                merchantId: data.merchantId,
                amountIDR: data.amountIDR,
                amountUSDT: finalUSDT,
                exchangeRate: rate,
                network: "MANTLE", // Ganti jadi MANTLE

                paymentAddress: predictedAddress, // Alamat Smart Vault
                salt: salt,                       // Simpan Salt ini baik-baik!
                isDeployed: false,                // Belum dideploy

                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            } as any // Temporary fix until Prisma client is regenerated
        })

        return c.json({
            message: 'Invoice created',
            data: {
                invoiceId: transaction.id,
                amountIDR: data.amountIDR,
                amountUSDT: finalUSDT.toFixed(4), // Tampilkan 4 desimal
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
        console.log('🔔 WEBHOOK MASUK:', JSON.stringify(body, null, 2))

        const incomingAddress = body.address
        const incomingAmount = parseFloat(body.amount)
        const txHash = body.txId

        // 1. Cari Transaksi
        // Kita cari transaksi yang addressnya cocok DAN statusnya belum LUNAS/GAGAL
        // Kita terima status PENDING ataupun PARTIALLY_PAID
        const transaction = await prisma.transaction.findFirst({
            where: {
                paymentAddress: incomingAddress,
                status: {
                    in: ['PENDING', 'PARTIALLY_PAID']
                }
            }
        })

        if (!transaction) {
            console.log(`⚠️ Transaksi unknown / sudah final: ${incomingAddress}`)
            return c.text('OK')
        }

        // 2. Hitung Akumulasi
        const currentReceived = parseFloat(transaction.amountReceived.toString())
        const totalReceived = currentReceived + incomingAmount
        const expectedAmount = parseFloat(transaction.amountUSDT.toString())

        // Logic Penentuan Status
        let newStatus = transaction.status // Default status lama

        // Cek 1: Apakah Masih Kurang? (Toleransi floating point 0.0001)
        if (totalReceived < (expectedAmount - 0.0001)) {
            console.log(`⚠️ MASIH KURANG! Total: ${totalReceived} / Tagihan: ${expectedAmount}`)
            newStatus = 'PARTIALLY_PAID'
        }
        // Cek 2: Apakah Lebih Bayar Signifikan? (Misal lebih dari $0.1)
        else if (totalReceived > (expectedAmount + 0.1)) {
            console.log(`🤑 LEBIH BAYAR (TIP)! Total: ${totalReceived} / Tagihan: ${expectedAmount}`)
            newStatus = 'OVERPAID'
            // Note: OVERPAID secara operasional dianggap LUNAS oleh Merchant
        }
        // Cek 3: Pas (Lunas)
        else {
            console.log(`✅ LUNAS PAS! Total: ${totalReceived}`)
            newStatus = 'PAID'
        }

        await prisma.$transaction(async (tx) => {

            // A. Update Status Transaksi
            // 1. Update Transaksi dengan INCREMENT
            // Ini aman dari race condition
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: newStatus,
                    amountReceived: { increment: incomingAmount },
                    txHash: (newStatus === 'PAID' || newStatus === 'OVERPAID') ? txHash : undefined,
                    confirmedAt: (newStatus === 'PAID' || newStatus === 'OVERPAID') ? new Date() : undefined,
                }
            })

            // B. Update Saldo Merchant dengan Logic Perhitungan Tip
            const isFinal = newStatus === 'PAID' || newStatus === 'OVERPAID'

            // Pastikan kita update saldo HANYA jika status sebelumnya BELUM final 
            // (Mencegah double credit jika webhook dikirim ulang oleh Tatum)
            const isPreviouslyNotFinal = transaction.status === 'PENDING' || transaction.status === 'PARTIALLY_PAID' || transaction.status === 'DETECTED'

            if (isFinal && isPreviouslyNotFinal) {
                let creditAmountIDR = parseFloat(transaction.amountIDR.toString())

                // LOGIC BARU: Handle Kelebihan Bayar
                if (newStatus === 'OVERPAID') {
                    const rate = parseFloat(transaction.exchangeRate.toString())
                    const excessUSDT = totalReceived - expectedAmount

                    // Konversi sisa USDT ke Rupiah
                    // Math.floor agar tidak ada desimal koma di Rupiah
                    const excessIDR = Math.floor(excessUSDT * rate)

                    creditAmountIDR += excessIDR // Total = Tagihan Asli + Tip

                    console.log(`🤑 OVERPAID! Tagihan: ${transaction.amountIDR} + Tip: ${excessIDR} = Total: ${creditAmountIDR}`)
                } else {
                    console.log(`💰 PAID PAS! Menambahkan Saldo Rp ${creditAmountIDR}`)
                }

                await tx.merchant.update({
                    where: { id: transaction.merchantId },
                    data: {
                        balanceIDR: { increment: creditAmountIDR }
                    }
                })
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

// Export untuk Bun
export default {
    port: 3001,
    fetch: app.fetch,
}