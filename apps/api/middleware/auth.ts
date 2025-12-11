import type { Context } from 'hono'
import { verifyToken } from '../utils/jwt'
import { errorResponse } from '../utils/response'

type Variables = {
    merchant: { merchantId: string; email: string; role?: string }
}

export async function authMiddleware(c: Context<{ Variables: Variables }>, next: () => Promise<void>) {
    try {
        const authHeader = c.req.header('Authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(c, 'Unauthorized: No token provided', 401)
        }

        const token = authHeader.substring(7)
        const payload = await verifyToken(token)

        if (!payload) {
            return errorResponse(c, 'Unauthorized: Invalid or expired token', 401)
        }
        c.set('merchant', payload)

        await next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return errorResponse(c, 'Unauthorized: Authentication failed', 401)
    }
}

