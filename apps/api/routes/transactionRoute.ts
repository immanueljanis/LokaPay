import type { AppInstance } from '../types'
import { authMiddleware } from '../middleware/auth'
import { adminMiddleware } from '../middleware/admin'
import { createTransactionController, getTransactionController, listTransactionsController } from '../controllers/transactionController'
import { limiter } from '../index'

export const registerTransactionRoutes = (app: AppInstance) => {
    app.post('/transaction/create', limiter, authMiddleware, createTransactionController)
    app.get('/transaction/:id', authMiddleware, getTransactionController)
    app.get('/admin/transactions', authMiddleware, adminMiddleware, listTransactionsController)
}

