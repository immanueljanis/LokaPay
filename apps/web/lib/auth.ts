import { cookies } from './cookies'

// Helper untuk check apakah user sudah login
export function isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    const token = cookies.get('lokapay-token')
    return !!token
}

// Helper untuk get token
export function getToken(): string | null {
    if (typeof window === 'undefined') return null
    return cookies.get('lokapay-token')
}

