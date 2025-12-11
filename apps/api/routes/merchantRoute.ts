import type { AppInstance } from '../types'
import { meController, dashboardController, listMerchantsController } from '../controllers/merchantController'
import { authMiddleware } from '../middleware/auth'
import { adminMiddleware } from '../middleware/admin'

export const registerMerchantRoutes = (app: AppInstance) => {
    app.get('/merchant/me', authMiddleware, meController)
    app.get('/merchant/:id/dashboard', authMiddleware, dashboardController)
    app.get('/admin/merchants', authMiddleware, adminMiddleware, listMerchantsController)
}

