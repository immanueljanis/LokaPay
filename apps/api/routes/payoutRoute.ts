import type { AppInstance } from '../types'
import { authMiddleware } from '../middleware/auth'
import { payoutController } from '../controllers/payoutController'
import { adminMiddleware } from '../middleware/admin'

export const registerPayoutRoutes = (app: AppInstance) => {
    app.post('/payout/request', authMiddleware, payoutController.request)
    app.post('/payout/complete', authMiddleware, payoutController.complete)
    app.post('/payout/reject', authMiddleware, payoutController.reject)
    app.get('/payout/my', authMiddleware, payoutController.list)
    app.get('/admin/payouts', authMiddleware, adminMiddleware, payoutController.listAllAdmin)
}

