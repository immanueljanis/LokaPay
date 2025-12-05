import { prisma } from '@lokapay/database'

export async function processIncomingPayment(address: string, amount: number, txHash: string = "DETECTED_BY_POLLING") {
    console.log(`🔍 Checking payment for: ${address}, Amount found: ${amount}`)

    const transaction = await prisma.transaction.findFirst({
        where: {
            paymentAddress: address,
            status: { in: ['PENDING', 'PARTIALLY_PAID'] }
        }
    })

    if (!transaction) return // Skip jika tidak ada tagihan pending

    // --- LOGIC LATE PAYMENT (Sama seperti sebelumnya) ---
    const now = new Date()
    const isExpired = now > transaction.expiresAt
    let expectedUSDT = parseFloat(transaction.amountUSDT.toString())
    let finalRate = parseFloat(transaction.exchangeRate.toString())
    let isRateUpdated = false

    if (isExpired) {
        console.log(`⚠️ Late Payment! ID: ${transaction.id}`)
        // (Masukkan logic recalculate rate disini jika mau, atau skip untuk MVP)
    }

    // --- LOGIC AKUMULASI ---
    const currentReceived = parseFloat(transaction.amountReceived.toString())
    const totalReceived = currentReceived + amount

    let newStatus = transaction.status

    // Toleransi floating point
    if (totalReceived < (expectedUSDT - 0.0001)) {
        newStatus = 'PARTIALLY_PAID'
        console.log(`🟡 Partial Payment`)
    } else if (totalReceived > (expectedUSDT + 0.1)) {
        newStatus = 'OVERPAID'
        console.log(`🟢 Overpaid (Tip)`)
    } else {
        newStatus = 'PAID'
        console.log(`✅ Paid Lunas`)
    }

    // --- UPDATE DB (Hanya update jika ada progress) ---
    if (totalReceived > currentReceived) {
        await prisma.$transaction(async (tx) => {
            // Update Transaction
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: newStatus,
                    amountReceived: { increment: amount }, // Tambah saldo baru
                    amountUSDT: isRateUpdated ? expectedUSDT : undefined,
                    exchangeRate: isRateUpdated ? finalRate : undefined,
                    // Kalau polling, kita mungkin gak punya txHash akurat per transfer, 
                    // tapi gak masalah untuk MVP.
                    txHash: txHash,
                    confirmedAt: (newStatus === 'PAID' || newStatus === 'OVERPAID') ? new Date() : undefined,
                }
            })

            // Update Merchant Balance
            const isFinal = newStatus === 'PAID' || newStatus === 'OVERPAID'
            const wasNotFinal = transaction.status !== 'PAID' && transaction.status !== 'OVERPAID'

            if (isFinal && wasNotFinal) {
                let creditIDR = parseFloat(transaction.amountIDR.toString())
                if (newStatus === 'OVERPAID') {
                    const excessUSDT = totalReceived - expectedUSDT
                    const excessIDR = Math.floor(excessUSDT * finalRate)
                    creditIDR += excessIDR
                }

                await tx.merchant.update({
                    where: { id: transaction.merchantId },
                    data: { balanceIDR: { increment: creditIDR } }
                })
                console.log(`💰 Merchant Credited: Rp ${creditIDR}`)
            }
        })
    }
}