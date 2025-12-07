'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../src/store/useAuth'
import { cookies } from '../lib/cookies'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const router = useRouter()
    const { user, hydrate, fetchMerchantData } = useAuth()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const initializeAuth = async () => {
            hydrate()

            const token = cookies.get('lokapay-token')
            if (!token) {
                router.push('/login')
                return
            }

            try {
                await fetchMerchantData()
            } catch (err) {
                console.error('Failed to fetch merchant data:', err)
                const currentUser = useAuth.getState().user
                if (!currentUser) {
                    router.push('/login')
                    return
                }
            }

            setIsLoading(false)
        }

        initializeAuth()
    }, [router, hydrate, fetchMerchantData])

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login')
        }
    }, [isLoading, user, router])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Memuat...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}

