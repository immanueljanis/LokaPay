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
    let expectedUSD = parseFloat(transaction.amountUSD.toString())
    let finalRate = parseFloat(transaction.exchangeRate.toString())
    let isRateUpdated = false

    if (isExpired) {
        console.log(`⚠️ Late Payment! ID: ${transaction.id}`)
    }

    const currentReceivedUSD = parseFloat(transaction.amountReceivedUSD.toString())
    const totalReceivedUSD = currentReceivedUSD + amount

    let newStatus = transaction.status

    if (totalReceivedUSD < (expectedUSD - 0.0001)) {
        newStatus = 'PARTIALLY_PAID'
        console.log(`🟡 Partial Payment`)
    } else if (totalReceivedUSD > (expectedUSD + 0.1)) {
        newStatus = 'OVERPAID'
        console.log(`🟢 Overpaid (Tip)`)
    } else {
        newStatus = 'PAID'
        console.log(`✅ Paid Lunas`)
    }

    const amountReceivedIdr = Math.floor(totalReceivedUSD * finalRate)
    const amountInvoice = parseFloat(transaction.amountInvoice.toString())
    const feeApp = amountInvoice * 0.015

    let tipIdr = 0
    if (newStatus === 'OVERPAID') {
        const excessUSD = totalReceivedUSD - expectedUSD
        tipIdr = Math.floor(excessUSD * finalRate)
    }

    if (totalReceivedUSD > currentReceivedUSD) {
        await prisma.$transaction(async (tx) => {
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: newStatus,
                    amountReceivedUSD: totalReceivedUSD,
                    amountReceivedIdr: amountReceivedIdr,
                    tipIdr: tipIdr,
                    feeApp: feeApp,
                    amountUSD: isRateUpdated ? expectedUSD : undefined,
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