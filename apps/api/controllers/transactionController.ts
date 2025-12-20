import { z } from 'zod'
import { createTransactionSchema } from '../schema'
import { transactionService } from '../services/transactionService'
import { successResponse, errorResponse } from '../utils/response'

export const createTransactionController = async (c: any) => {
    try {
        const body = await c.req.json()
        const data = createTransactionSchema.parse(body)

        const result = await transactionService.createTransaction(data)
        if ('error' in result) {
            return errorResponse(c, result.error, 500)
        }

        return successResponse(
            c,
            result,
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
}

export const getTransactionController = async (c: any) => {
    const id = c.req.param('id')
    const merchant = c.get('merchant')

    const transaction = await transactionService.getById(id)
    if (!transaction) {
        return errorResponse(c, 'Transaction not found', 404)
    }

    const transactionMerchantId = String(transaction.merchantId)
    const tokenMerchantId = String(merchant.merchantId)

    if (transactionMerchantId !== tokenMerchantId) {
        return errorResponse(c, 'Forbidden: You can only access your own transactions', 403)
    }

    return successResponse(c, transaction, 'Transaction retrieved successfully')
}

export const getTransactionByShortCodeController = async (c: any) => {
    try {
        const shortCode = c.req.param('shortCode')

        if (!shortCode || shortCode.length !== 6) {
            return errorResponse(c, 'Invalid short code', 400)
        }

        const transaction = await transactionService.getByShortCode(shortCode)
        if (!transaction) {
            return errorResponse(c, 'Transaction not found', 404)
        }

        return successResponse(c, transaction, 'Transaction retrieved successfully')
    } catch (e: any) {
        return errorResponse(c, e.message || 'Failed to retrieve transaction', 500)
    }
}

export const getTransactionPublicController = async (c: any) => {
    try {
        const id = c.req.param('id')
        const transaction = await transactionService.getById(id)

        if (!transaction) {
            return errorResponse(c, 'Transaction not found', 404)
        }

        return successResponse(c, transaction, 'Transaction retrieved successfully')
    } catch (e: any) {
        return errorResponse(c, e.message || 'Failed to retrieve transaction', 500)
    }
}

export const listTransactionsController = async (c: any) => {
    try {
        const transactions = await transactionService.listAll()
        return successResponse(c, transactions, 'Transactions retrieved successfully')
    } catch (e: any) {
        return errorResponse(c, e.message || 'Failed to retrieve transactions', 400)
    }
}

