import type { Context } from 'hono'
import { payoutService } from '../services/payoutService'
import { z } from 'zod'
import { successResponse, errorResponse } from '../utils/response'

const requestPayoutSchema = z.object({
    amount: z.number().min(10000, 'Minimum withdrawal is 10,000'),
})

const completePayoutSchema = z.object({
    payoutId: z.string(),
    proofImage: z.string().url(),
    referenceNo: z.string(),
})

const rejectPayoutSchema = z.object({
    payoutId: z.string(),
    reason: z.string(),
})

export const payoutController = {
    request: async (c: Context) => {
        try {
            const merchant = c.get('merchant')
            const body = await c.req.json()
            const { amount } = requestPayoutSchema.parse(body)

            const result = await payoutService.requestPayout(merchant.merchantId, amount)

            return successResponse(c, result, 'Payout requested successfully', 201)
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                return errorResponse(c, e.issues[0]?.message || 'Validation error', 400)
            }
            return errorResponse(c, e.message || 'Payout request failed', 400)
        }
    },

    complete: async (c: Context) => {
        try {
            const body = await c.req.json()
            const { payoutId, proofImage, referenceNo } = completePayoutSchema.parse(body)

            const result = await payoutService.completePayout(payoutId, proofImage, referenceNo)

            return successResponse(c, result, 'Payout completed')
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                return errorResponse(c, e.issues[0]?.message || 'Validation error', 400)
            }
            return errorResponse(c, e.message || 'Payout complete failed', 400)
        }
    },

    reject: async (c: Context) => {
        try {
            const body = await c.req.json()
            const { payoutId, reason } = rejectPayoutSchema.parse(body)

            const result = await payoutService.rejectPayout(payoutId, reason)

            return successResponse(c, result, 'Payout rejected and refunded')
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                return errorResponse(c, e.issues[0]?.message || 'Validation error', 400)
            }
            return errorResponse(c, e.message || 'Payout reject failed', 400)
        }
    },

    list: async (c: Context) => {
        try {
            const merchant = c.get('merchant')
            if (!merchant) {
                return errorResponse(c, 'Unauthorized', 401)
            }
            const payouts = await payoutService.listPayouts(merchant.merchantId)
            return successResponse(c, payouts, 'Payout list retrieved')
        } catch (e: any) {
            return errorResponse(c, e.message || 'Failed to fetch payouts', 400)
        }
    },
}