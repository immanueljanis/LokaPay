import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { cookies } from './cookies'

export interface ApiResponse<T = any> {
    success: boolean
    message: string
    data: T
}

export interface ApiError {
    success: boolean
    message: string
    data: null
}

const axiosInstance: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = cookies.get('lokapay-token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error: AxiosError) => {
        return Promise.reject(error)
    }
)

axiosInstance.interceptors.response.use(
    (response) => {
        return response
    },
    async (error: AxiosError<ApiError>) => {
        if (error.response) {
            const status = error.response.status
            const errorData = error.response.data

            switch (status) {
                case 401:
                    if (typeof window !== 'undefined') {
                        cookies.remove('lokapay-token')
                        localStorage.removeItem('lokapay-session')
                        window.location.href = '/login'
                    }
                    break

                case 403:
                    console.error('Access forbidden:', errorData?.message || 'Forbidden')
                    break

                case 404:
                    console.error('Resource not found:', errorData?.message || 'Not Found')
                    break

                case 500:
                    console.error('Server error:', errorData?.message || 'Internal Server Error')
                    break

                default:
                    console.error('API Error:', errorData?.message || error.message)
            }
        } else if (error.request) {
            console.error('Network error: No response received')
        } else {
            console.error('Request setup error:', error.message)
        }
        return Promise.reject(error)
    }
)

export default axiosInstance
export const api = {
    get: <T = any>(url: string, config?: any) =>
        axiosInstance.get<ApiResponse<T>>(url, config).then((res) => {
            const response = res.data
            if (!response.success) {
                throw new Error(response.message)
            }
            return response.data
        }),

    post: <T = any>(url: string, data?: any, config?: any) =>
        axiosInstance.post<ApiResponse<T>>(url, data, config).then((res) => {
            const response = res.data
            if (!response.success) {
                throw new Error(response.message)
            }
            return response.data
        }),

    put: <T = any>(url: string, data?: any, config?: any) =>
        axiosInstance.put<ApiResponse<T>>(url, data, config).then((res) => {
            const response = res.data
            if (!response.success) {
                throw new Error(response.message)
            }
            return response.data
        }),

    patch: <T = any>(url: string, data?: any, config?: any) =>
        axiosInstance.patch<ApiResponse<T>>(url, data, config).then((res) => {
            const response = res.data
            if (!response.success) {
                throw new Error(response.message)
            }
            return response.data
        }),

    delete: <T = any>(url: string, config?: any) =>
        axiosInstance.delete<ApiResponse<T>>(url, config).then((res) => {
            const response = res.data
            if (!response.success) {
                throw new Error(response.message)
            }
            return response.data
        }),
}

