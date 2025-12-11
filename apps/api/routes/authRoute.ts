import { AppInstance } from '../types'
import { registerController, loginController } from '../controllers/authController'

export const registerAuthRoutes = (app: AppInstance) => {
    app.post('/auth/register', registerController)
    app.post('/auth/login', loginController)
}

