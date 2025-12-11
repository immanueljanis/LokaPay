import { prisma } from '@lokapay/database'
import { payoutRepository } from '../repositories/payoutRepository'
import { ADMIN_TRANSFER_PERCENTAGE } from '../constants/value'

export const payoutService = {
    requestPayout: async (merchantId: string, amountRequested: number) => {
        return prisma.$transaction(async (tx) => {
            const merchant = await payoutRepository.findMerchantById(merchantId, tx)

            if (!merchant) throw new Error('Merchant not found')
            if (!merchant.bankAccount || !merchant.bankName) throw new Error('Incomplete bank details')

            if (Number(merchant.balanceIDR) < amountRequested) {
                throw new Error('Insufficient balance')
            }

            const amountFinal = amountRequested - amountRequested * ADMIN_TRANSFER_PERCENTAGE
            if (amountFinal <= 0) throw new Error('Amount too small (below admin fee)')

            await payoutRepository.decrementMerchantBalance(merchantId, amountRequested, tx)

            const newPayout = await payoutRepository.createPayout(
                {
                    merchant: { connect: { id: merchantId } },
                    amountRequested: amountRequested,
                    feeAdmin: amountRequested * ADMIN_TRANSFER_PERCENTAGE,
                    amountFinal: amountFinal,
                    toBankName: merchant.bankName,
                    toBankAccount: merchant.bankAccount,
                    toBankHolder: (merchant as any).bankHolder || merchant.name,
                    status: 'REQUESTED',
                },
                tx
            )

            return newPayout
        })
    },

    completePayout: async (payoutId: string, proofImage: string, referenceNo: string) => {
        const payout = await payoutRepository.findPayoutById(payoutId)
        if (!payout) throw new Error('Payout not found')
        if (payout.status !== 'REQUESTED') throw new Error('Payout status is not REQUESTED')

        return payoutRepository.updatePayoutStatus(payoutId, 'COMPLETED', {
            proofImage,
            referenceNo,
        })
    },

    rejectPayout: async (payoutId: string, rejectionReason: string) => {
        return prisma.$transaction(async (tx) => {
            const payout = await payoutRepository.findPayoutById(payoutId, tx)

            if (!payout) throw new Error('Payout not found')
            if (payout.status !== 'REQUESTED') throw new Error('Payout status is not REQUESTED')

            const amountToRefund = Number(payout.amountRequested)
            await payoutRepository.incrementMerchantBalance(payout.merchantId, amountToRefund, tx)

            return payoutRepository.updatePayoutStatus(
                payoutId,
                'REJECTED',
                {
                    rejectionReason,
                },
                tx
            )
        })
    },

    listPayouts: async (merchantId: string) => {
        return payoutRepository.findPayoutsByMerchant(merchantId)
    },
}