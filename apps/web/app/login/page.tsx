'use client'

import { useState } from 'react'
import { api } from '../../lib/axios.instance'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../src/store/useAuth'
import { useTranslations } from 'next-intl'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
    const router = useRouter()
    const login = useAuth((state) => state.login)
    const t = useTranslations('auth')
    const tc = useTranslations('common')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const responseData = await api.post<{ merchant: any; token: string }>('/auth/login', {
                email,
                password
            })

            const merchant = responseData?.merchant
            const token = responseData?.token || ''

            if (merchant && token) {
                login(merchant, token)
                router.push('/dashboard')
            } else {
                setError(t('invalidResponse'))
            }

        } catch (err: any) {
            // Error format: { success: false, message: string, data: null }
            const msg = err.response?.data?.message || err.message || t('loginFailed')
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary mb-2">LokaPay</h1>
                    <p className="text-muted-foreground">{t('signInToManage')}</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
                        ⚠️ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">{t('email')}</label>
                        <input
                            type="email"
                            required
                            placeholder="contoh: bagus@lokapay.com"
                            className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition bg-background text-foreground"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-1">{t('password')}</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full p-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring outline-none transition bg-background text-foreground"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-lg hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition shadow-md"
                    >
                        {loading ? tc('loading') : t('login')}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-muted-foreground">
                    {t('noAccount')} <span className="text-primary cursor-pointer hover:underline">{t('contactAdmin')}</span>
                </div>
            </div>
        </div>
    )
}