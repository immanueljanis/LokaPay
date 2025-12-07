import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { cookies } from '../../lib/cookies'
interface User {
    id: string
    name: string
    email: string
    balanceIDR: string
}
interface AuthState {
    user: User | null
    token: string | null
    login: (user: User, token: string) => void
    logout: () => void
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,

            login: (user, token) => {
                cookies.set('lokapay-token', token, 1 / 3)
                set({ user, token })
            },

            logout: () => {
                cookies.remove('lokapay-token')
                set({ user: null, token: null })
            },
        }),
        {
            name: 'lokapay-session',
            storage: createJSONStorage(() => localStorage),
        }
    )
)