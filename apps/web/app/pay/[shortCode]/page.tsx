'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import { useTranslations } from 'next-intl'

export const dynamic = 'force-dynamic'

interface ApiResponse<T = any> {
    success: boolean
    message: string
    data: T
}

export default function PaymentLinkPage() {
    const params = useParams()
    const shortCode = params.shortCode as string
    const router = useRouter()
    const t = useTranslations('invoice')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                const response = await axios.get<ApiResponse<{ id: string }>>(
                    `${apiUrl}/pay/${shortCode}`
                )

                if (response.data.success && response.data.data) {
                    const transaction = response.data.data
                    // Redirect to invoice page with transaction ID
                    router.replace(`/invoice/${transaction.id}`)
                } else {
                    setError(response.data.message || 'Transaction not found')
                    setLoading(false)
                }
            } catch (err: any) {
                if (err.response?.status === 404) {
                    setError('Transaction not found')
                } else {
                    setError('Failed to load payment link')
                }
                setLoading(false)
            }
        }

        if (shortCode) {
            fetchTransaction()
        } else {
            setError('Invalid payment link')
            setLoading(false)
        }
    }, [shortCode, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg font-semibold mb-2">{t('loading')}</div>
                    <div className="text-sm text-muted-foreground">Redirecting to invoice...</div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg font-semibold text-red-500 mb-2">{error}</div>
                    <div className="text-sm text-muted-foreground">
                        Please check the payment link and try again.
                    </div>
                </div>
            </div>
        )
    }

    return null
}

