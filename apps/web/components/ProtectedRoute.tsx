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
    const { user, hydrate } = useAuth()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        hydrate()

        const token = cookies.get('lokapay-token')
        if (!token || !user) {
            router.push('/login')
            return
        }

        setIsLoading(false)
    }, [user, router, hydrate])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <>{children}</>
}

