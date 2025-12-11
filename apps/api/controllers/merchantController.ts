import { successResponse, errorResponse } from '../utils/response'
import { merchantService } from '../services/merchantService'

export const meController = async (c: any) => {
    try {
        const merchant = c.get('merchant')
        if (!merchant) {
            return errorResponse(c, 'Unauthorized', 401)
        }

        const merchantData = await merchantService.getMe(merchant.merchantId)
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
                role: (merchantData as any).role || 'MERCHANT',
            },
            'Merchant data retrieved successfully'
        )
    } catch (e) {
        console.error(e)
        return errorResponse(c, 'Internal Server Error', 500)
    }
}

export const dashboardController = async (c: any) => {
    const id = c.req.param('id')
    const merchant = c.get('merchant')

    const routeMerchantId = String(id)
    const tokenMerchantId = String(merchant.merchantId)

    if (routeMerchantId !== tokenMerchantId) {
        return errorResponse(c, 'Forbidden: You can only access your own data', 403)
    }

    try {
        const merchantData = await merchantService.getDashboard(id)
        if (!merchantData) {
            return errorResponse(c, 'Merchant not found', 404)
        }

        const { passwordHash, ...safeMerchant } = merchantData
        return successResponse(c, safeMerchant, 'Merchant dashboard data retrieved successfully')
    } catch (e) {
        console.error(e)
        return errorResponse(c, 'Server error', 500)
    }
}

export const listMerchantsController = async (c: any) => {
    try {
        const merchants = await merchantService.listAll()
        return successResponse(
            c,
            merchants.map((m: any) => ({
                id: m.id,
                name: m.name,
                email: m.email,
                role: m.role,
                balanceIDR: m.balanceIDR.toString(),
                bankName: m.bankName,
                bankAccount: m.bankAccount,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt,
            })),
            'Merchants retrieved successfully'
        )
    } catch (e) {
        console.error(e)
        return errorResponse(c, 'Server error', 500)
    }
}

