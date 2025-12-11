import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { successResponse } from './utils/response'
import type { AppInstance, Variables } from './types'
import { registerAuthRoutes } from './routes/authRoute'
import { registerMerchantRoutes } from './routes/merchantRoute'
import { registerTransactionRoutes } from './routes/transactionRoute'
import { registerPayoutRoutes } from './routes/payoutRoute'
import { rateLimiter } from 'hono-rate-limiter'

const app: AppInstance = new Hono<{ Variables: Variables }>()

app.use('*', logger())
app.use('/*', cors({
    origin: process.env.FRONTEND_URL as string,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
    credentials: true,
    maxAge: 600
}))

export const limiter = rateLimiter({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-6',
    keyGenerator: (c) => {
        const forwarded = c.req.header('x-forwarded-for')
        const realIp = c.req.header('x-real-ip')
        const cfIp = c.req.header('cf-connecting-ip')
        return forwarded?.split(',')[0]?.trim() || realIp || cfIp || 'unknown'
    },
    handler: (c) => {
        return c.json(
            {
                success: false,
                message: 'Too many requests. Please try again later.',
            },
            429
        )
    },
})

app.get('/', (c) => {
    return successResponse(
        c,
        { status: 'running', version: '1.0.0', network: process.env.NETWORK, uptime: process.uptime() },
        'LokaPay API is Running! 🚀',
        200
    )
})

registerAuthRoutes(app)
registerMerchantRoutes(app)
registerTransactionRoutes(app)
registerPayoutRoutes(app)

console.log('🚀 API Server starting on port 3001...')
export default {
    port: 3001,
    fetch: app.fetch,
}

