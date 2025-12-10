'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { api } from '../../lib/axios.instance'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../src/store/useAuth'
import { useTranslations } from 'next-intl'
import { showToast } from '../../lib/toast'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const login = useAuth((state) => state.login)
    const t = useTranslations('auth')
    const tc = useTranslations('common')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (searchParams.get('registered') === 'true') {
            showToast.success(t('registrationSuccess'))
            // Clear the query parameter
            router.replace('/login', { scroll: false })
        }
    }, [searchParams, router, t])

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
                showToast.success(t('loginSuccess') || 'Login successful!')
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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="max-w-md w-full relative z-10">
                <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8 md:p-10">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="relative w-full max-w-xs md:max-w-sm aspect-[4/1]">
                            <Image
                                src="/logo/logoWithTextTransparent.png"
                                alt="LokaPay Logo"
                                fill
                                className="object-contain scale-150 md:scale-[1.75]"
                                priority
                            />
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-2">{t('signInToManage')}</h2>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg mb-6 text-sm text-center backdrop-blur-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">{t('email')}</label>
                            <input
                                type="email"
                                required
                                placeholder="contoh: bagus@lokapay.com"
                                className="w-full p-3.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground hover:border-primary/50"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">{t('password')}</label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full p-3.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground hover:border-primary/50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {loading ? tc('loading') : t('signIn')}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        {t('noAccount')} <a href="/register" className="text-primary font-medium cursor-pointer hover:underline transition-colors">{t('register')}</a>
                    </div>
                </div>
            </div>
        </div>
    )
}