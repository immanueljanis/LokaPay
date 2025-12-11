'use client'

import { useState } from 'react'
import Image from 'next/image'
import { api } from '../../lib/axios.instance'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../src/store/useAuth'
import { useTranslations } from 'next-intl'
import { BANK_OPTIONS } from '../../src/constants/value'
import { FormInput, FormSelect } from '../../components/input/FormField'
import { showToast } from '../../lib/toast'
import { registerSchema, type RegisterFormData } from '../../lib/validation'

export const dynamic = 'force-dynamic'

export default function RegisterPage() {
    const router = useRouter()
    const login = useAuth((state) => state.login)
    const t = useTranslations('auth')
    const tc = useTranslations('common')

    const [formData, setFormData] = useState<RegisterFormData>({
        name: '',
        email: '',
        password: '',
        bankName: '',
        bankAccount: ''
    })
    const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})
    const [loading, setLoading] = useState(false)

    const handleChange = (field: keyof RegisterFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const value = e.target.value
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const validateForm = (): boolean => {
        try {
            registerSchema.parse(formData)
            setErrors({})
            return true
        } catch (error: any) {
            if (error.errors) {
                const newErrors: Partial<Record<keyof RegisterFormData, string>> = {}
                error.errors.forEach((err: any) => {
                    const field = err.path[0] as keyof RegisterFormData
                    newErrors[field] = err.message
                })
                setErrors(newErrors)
            }
            return false
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Validate form
        if (!validateForm()) {
            setLoading(false)
            showToast.error(t('registerFailed'))
            return
        }

        try {
            const responseData = await api.post<{ merchant: any }>('/auth/register', formData)

            const merchant = responseData?.merchant

            if (merchant) {
                showToast.success(t('registrationSuccess'))
                // After successful registration, redirect to login
                setTimeout(() => {
                    router.push('/login')
                }, 1000)
            } else {
                showToast.error(t('invalidResponse'))
            }

        } catch (err: any) {
            // Error format: { success: false, message: string, data: null }
            const msg = err.response?.data?.message || err.message || t('registerFailed')
            showToast.error(msg)
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
                                className="object-contain scale-150 md:scale-[1]"
                                priority
                            />
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-2">{t('signUpToStart')}</h2>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleRegister} className="space-y-5">
                        <FormInput
                            label={t('name')}
                            type="text"
                            required
                            placeholder="contoh: Nasi Goreng Pak Bagus"
                            value={formData.name}
                            onChange={handleChange('name')}
                            error={errors.name}
                        />

                        <FormInput
                            label={t('email')}
                            type="email"
                            required
                            placeholder="contoh: bagus@lokapay.com"
                            value={formData.email}
                            onChange={handleChange('email')}
                            error={errors.email}
                        />

                        <FormInput
                            label={t('password')}
                            type="password"
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange('password')}
                            error={errors.password}
                        />

                        <FormSelect
                            label={t('bankName')}
                            required
                            placeholder={t('selectBank')}
                            options={BANK_OPTIONS.map(bank => ({ value: bank.value, label: bank.name }))}
                            value={formData.bankName}
                            onChange={handleChange('bankName')}
                            error={errors.bankName}
                        />

                        <FormInput
                            label={t('bankAccount')}
                            type="text"
                            required
                            placeholder="contoh: 88889999"
                            value={formData.bankAccount}
                            onChange={handleChange('bankAccount')}
                            error={errors.bankAccount}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {loading ? tc('loading') : t('register')}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        {t('alreadyHaveAccount')} <a href="/login" className="text-primary font-medium cursor-pointer hover:underline transition-colors">{t('signIn')}</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

