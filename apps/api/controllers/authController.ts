import { z } from 'zod'
import { loginSchema, registerSchema } from '../schema'
import { authService } from '../services/authService'
import { successResponse, errorResponse } from '../utils/response'

export const registerController = async (c: any) => {
    try {
        const body = await c.req.json()
        const data = registerSchema.parse(body)

        const result = await authService.register(data)
        if ('error' in result) {
            return errorResponse(c, result.error, 400)
        }

        return successResponse(
            c,
            { merchant: result.merchant },
            'Registration successful',
            201
        )
    } catch (e) {
        if (e instanceof z.ZodError) {
            return errorResponse(c, e.issues[0]?.message || 'Validation error', 400)
        }
        console.error(e)
        return errorResponse(c, 'Internal Server Error', 500)
    }
}

export const loginController = async (c: any) => {
    try {
        const body = await c.req.json()
        const data = loginSchema.parse(body)

        const result = await authService.login(data)
        if ('error' in result) {
            return errorResponse(c, result.error, 401)
        }

        return successResponse(
            c,
            { merchant: result.merchant, token: result.token },
            'Login successful'
        )
    } catch (e) {
        if (e instanceof z.ZodError) {
            return errorResponse(c, e.issues[0]?.message || 'Validation error', 400)
        }
        console.error(e)
        return errorResponse(c, 'Internal Server Error', 500)
    }
}

