import type { AppInstance } from '../types'
import { authMiddleware } from '../middleware/auth'
import { createTransactionController, getTransactionController } from '../controllers/transactionController'

export const registerTransactionRoutes = (app: AppInstance) => {
    app.post('/transaction/create', authMiddleware, createTransactionController)
    app.get('/transaction/:id', authMiddleware, getTransactionController)
}

