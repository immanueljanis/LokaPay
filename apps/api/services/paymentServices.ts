import { prisma } from '@lokapay/database'

export async function processIncomingPayment(address: string, amount: number, txHash: string = "DETECTED_BY_POLLING") {
    console.log(`🔍 Checking payment for: ${address}, Amount found: ${amount}`)

    const transaction = await prisma.transaction.findFirst({
        where: {
            paymentAddress: address,
            status: { in: ['PENDING', 'PARTIALLY_PAID'] }
        }
    })

    if (!transaction) return

    const now = new Date()
    const isExpired = now > transaction.expiresAt
    let expectedUSDT = parseFloat(transaction.amountUSDT.toString())
    let finalRate = parseFloat(transaction.exchangeRate.toString())
    let isRateUpdated = false

    if (isExpired) {
        console.log(`⚠️ Late Payment! ID: ${transaction.id}`)
    }

    const currentReceivedUSDT = parseFloat(transaction.amountReceivedUSDT.toString())
    const totalReceivedUSDT = currentReceivedUSDT + amount

    let newStatus = transaction.status

    if (totalReceivedUSDT < (expectedUSDT - 0.0001)) {
        newStatus = 'PARTIALLY_PAID'
        console.log(`🟡 Partial Payment`)
    } else if (totalReceivedUSDT > (expectedUSDT + 0.1)) {
        newStatus = 'OVERPAID'
        console.log(`🟢 Overpaid (Tip)`)
    } else {
        newStatus = 'PAID'
        console.log(`✅ Paid Lunas`)
    }

    const amountReceivedIdr = Math.floor(totalReceivedUSDT * finalRate)
    const amountInvoice = parseFloat(transaction.amountInvoice.toString())
    const feeApp = amountInvoice * 0.015

    let tipIdr = 0
    if (newStatus === 'OVERPAID') {
        const excessUSDT = totalReceivedUSDT - expectedUSDT
        tipIdr = Math.floor(excessUSDT * finalRate)
    }

    if (totalReceivedUSDT > currentReceivedUSDT) {
        await prisma.$transaction(async (tx) => {
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: newStatus,
                    amountReceivedUSDT: totalReceivedUSDT,
                    amountReceivedIdr: amountReceivedIdr,
                    tipIdr: tipIdr,
                    feeApp: feeApp,
                    amountUSDT: isRateUpdated ? expectedUSDT : undefined,
                    exchangeRate: isRateUpdated ? finalRate : undefined,
                    txHash: txHash,
                    confirmedAt: (newStatus === 'PAID' || newStatus === 'OVERPAID') ? new Date() : undefined,
                }
            })

            const isFinal = newStatus === 'PAID' || newStatus === 'OVERPAID'
            const wasNotFinal = transaction.status !== 'PAID' && transaction.status !== 'OVERPAID'

            if (isFinal && wasNotFinal) {
                let creditIDR = amountInvoice + tipIdr

                await tx.merchant.update({
                    where: { id: transaction.merchantId },
                    data: { balanceIDR: { increment: creditIDR } }
                })
                console.log(`💰 Merchant Credited: Rp ${creditIDR} (Invoice: ${amountInvoice} + Tip: ${tipIdr})`)
            }
        })
    }
}