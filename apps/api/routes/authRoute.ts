import type { AppInstance } from '../types'
import { registerController, loginController } from '../controllers/authController'
import { limiter } from '../index'

export const registerAuthRoutes = (app: AppInstance) => {
    app.post('/auth/register', limiter, registerController)
    app.post('/auth/login', limiter, loginController)
}

