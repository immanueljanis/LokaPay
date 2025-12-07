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
    hydrate: () => void
}

export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
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

            hydrate: () => {
                if (typeof window !== 'undefined') {
                    const tokenFromCookie = cookies.get('lokapay-token')
                    const currentState = get()
                    if (tokenFromCookie && !currentState.token) {
                        set({ token: tokenFromCookie })
                    }
                    else if (!tokenFromCookie && currentState.token) {
                        set({ user: null, token: null })
                    }
                }
            },
        }),
        {
            name: 'lokapay-session',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (state && typeof window !== 'undefined') {
                    const tokenFromCookie = cookies.get('lokapay-token')
                    if (tokenFromCookie) {
                        state.token = tokenFromCookie
                    } else if (state.token) {
                        state.user = null
                        state.token = null
                    }
                }
            },
        }
    )
)