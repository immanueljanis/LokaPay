// Helper untuk manage cookies di client-side
export const cookies = {
    get: (name: string): string | null => {
        if (typeof document === 'undefined') return null

        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) {
            return parts.pop()?.split(';').shift() || null
        }
        return null
    },

    set: (name: string, value: string, days: number = 7): void => {
        if (typeof document === 'undefined') return

        const expires = new Date()
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)

        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
    },

    remove: (name: string): void => {
        if (typeof document === 'undefined') return

        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
    },
}

