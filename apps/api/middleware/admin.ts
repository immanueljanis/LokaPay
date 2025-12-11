import type { Context } from 'hono'
import { errorResponse } from '../utils/response'

type Variables = {
    merchant: { merchantId: string; email: string; role?: string }
}

export async function adminMiddleware(c: Context<{ Variables: Variables }>, next: () => Promise<void>) {
    const merchant = c.get('merchant')
    if (!merchant || merchant.role !== 'ADMIN') {
        return errorResponse(c, 'Forbidden: Admin only', 403)
    }
    await next()
}

