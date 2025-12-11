import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { successResponse } from './utils/response'
import type { AppInstance, Variables } from './types'
import { registerAuthRoutes } from './routes/authRoute'
import { registerMerchantRoutes } from './routes/merchantRoute'
import { registerTransactionRoutes } from './routes/transactionRoute'
import { registerPayoutRoutes } from './routes/payoutRoute'

const app: AppInstance = new Hono<{ Variables: Variables }>()

app.use('*', logger())
app.use('*', cors())

app.get('/', (c) => {
    return successResponse(c, { status: 'running', version: '1.0.0', network: process.env.NETWORK, uptime: process.uptime() }, 'LokaPay API is Running! 🚀', 200)
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