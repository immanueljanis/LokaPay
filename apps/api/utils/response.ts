import type { Context } from 'hono'

export interface ApiResponse<T = any> {
    success: boolean
    message: string
    data: T
}

export const successResponse = <T = any>(
    c: Context,
    data: T,
    message: string = 'Success',
    status: 200 | 201 | 204 = 200
) => {
    return c.json<ApiResponse<T>>(
        {
            success: true,
            message,
            data,
        },
        status as any
    )
}

export const errorResponse = (
    c: Context,
    message: string = 'An error occurred',
    status: 400 | 401 | 403 | 404 | 410 | 500 = 400
) => {
    return c.json<ApiResponse<null>>(
        {
            success: false,
            message,
            data: null,
        },
        status as any
    )
}

