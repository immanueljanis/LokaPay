'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import { DashboardLayout } from '../../components/DashboardLayout'
import { useTranslations } from 'next-intl'

export default function InvoicePage() {
    const t = useTranslations('invoice')
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4 text-foreground">{t('title', { default: 'Invoice' })}</h1>
                    <p className="text-muted-foreground">{t('comingSoon', { default: 'Invoice page will be available soon.' })}</p>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}

