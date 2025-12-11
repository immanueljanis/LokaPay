import type { AppInstance } from '../types'
import { meController, dashboardController } from '../controllers/merchantController'
import { authMiddleware } from '../middleware/auth'

export const registerMerchantRoutes = (app: AppInstance) => {
    app.get('/merchant/me', authMiddleware, meController)
    app.get('/merchant/:id/dashboard', authMiddleware, dashboardController)
}

