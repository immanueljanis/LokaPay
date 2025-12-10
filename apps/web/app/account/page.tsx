'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import { DashboardLayout } from '../../components/DashboardLayout'
import { useAuth } from '../../src/store/useAuth'
import { useTranslations, useLocale } from 'next-intl'

export const dynamic = 'force-dynamic'

export default function AccountPage() {
    const { user } = useAuth()
    const t = useTranslations('account')
    const locale = useLocale()
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4 text-foreground">{t('title')}</h1>
                    {user ? (
                        <div className="bg-card rounded-lg shadow-sm border border-border p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">{t('name')}</label>
                                <p className="text-lg font-semibold text-card-foreground">{user.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">{t('email')}</label>
                                <p className="text-lg text-card-foreground">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">{t('balance')}</label>
                                <p className="text-lg font-semibold text-green-600">
                                    Rp {parseInt(user.balanceIDR || '0').toLocaleString(locale)}
                                </p>
                            </div>
                            {user.bankName && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">{t('bank')}</label>
                                    <p className="text-lg text-card-foreground">{user.bankName}</p>
                                </div>
                            )}
                            {user.bankAccount && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">{t('accountNumber')}</label>
                                    <p className="text-lg text-card-foreground font-mono">{user.bankAccount}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-8">
                            <p className="text-muted-foreground">{t('loadingData')}</p>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}

