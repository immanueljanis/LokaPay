import type { Context } from 'hono'
import { verifyToken } from '../utils/jwt'
import { errorResponse } from '../utils/response'

export async function authMiddleware(c: Context, next: () => Promise<void>) {
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

        const merchantIdFromRoute = c.req.param('id')
        if (merchantIdFromRoute && payload.merchantId !== merchantIdFromRoute) {
            return errorResponse(c, 'Forbidden: You can only access your own data', 403)
        }

        await next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return errorResponse(c, 'Unauthorized: Authentication failed', 401)
    }
}

