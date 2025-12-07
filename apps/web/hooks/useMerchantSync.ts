'use client'

import { useEffect } from 'react'
import { useAuth } from '../src/store/useAuth'

/**
 * Hook untuk auto-sync merchant data dari API ke localStorage
 * Fetch setiap 30 detik untuk update data merchant (balance, dll)
 */
export function useMerchantSync() {
    const { user, token, fetchMerchantData } = useAuth()

    useEffect(() => {
        if (!user || !token) return

        // Fetch immediately on mount
        fetchMerchantData()

        // Setup polling setiap 30 detik
        const interval = setInterval(() => {
            // Hanya fetch jika window focused (user aktif di tab)
            if (document.hasFocus()) {
                fetchMerchantData()
            }
        }, 30000) // 30 detik

        // Cleanup interval on unmount
        return () => clearInterval(interval)
    }, [user?.id, token, fetchMerchantData])

    // Fetch saat window focus kembali (user kembali ke tab)
    useEffect(() => {
        if (!user || !token) return

        const handleFocus = () => {
            fetchMerchantData()
        }

        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [user?.id, token, fetchMerchantData])
}

