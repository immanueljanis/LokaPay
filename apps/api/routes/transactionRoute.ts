import type { AppInstance } from '../types'
import { authMiddleware } from '../middleware/auth'
import { createTransactionController, getTransactionController } from '../controllers/transactionController'
import { limiter } from '../index'

export const registerTransactionRoutes = (app: AppInstance) => {
    app.post('/transaction/create', limiter, authMiddleware, createTransactionController)
    app.get('/transaction/:id', authMiddleware, getTransactionController)
}

