import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Tipe data User (sesuai balasan dari API Login)
interface User {
    id: string
    name: string
    email: string
    balanceIDR: string
}

// Tipe data Store (Isi gudang)
interface AuthState {
    user: User | null
    token: string | null
    login: (user: User) => void
    logout: () => void
}

// Bikin Store dengan fitur 'persist' (agar data tidak hilang saat refresh page)
export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,

            // Aksi Login: Simpan data user ke state
            login: (user) => set({ user }),

            // Aksi Logout: Kosongkan state
            logout: () => set({ user: null, token: null }),
        }),
        {
            name: 'lokapay-session', // Nama key di localStorage browser
            storage: createJSONStorage(() => localStorage), // Simpan di LocalStorage
        }
    )
)