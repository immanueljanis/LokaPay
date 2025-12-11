'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import { DashboardLayout } from '../../components/DashboardLayout'
import { useAuth } from '../../src/store/useAuth'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { api } from '../../lib/axios.instance'

export const dynamic = 'force-dynamic'

type Payout = {
    id: string
    amountRequested: string | number
    feeAdmin: string | number
    amountFinal: string | number
    status: 'REQUESTED' | 'COMPLETED' | 'REJECTED'
    referenceNo?: string | null
    rejectionReason?: string | null
    createdAt: string
    toBankName?: string | null
    toBankAccount?: string | null
}

export default function AccountPage() {
    const { user } = useAuth()
    const t = useTranslations('account')
    const locale = useLocale()
    const [payouts, setPayouts] = useState<Payout[]>([])
    const [loadingPayouts, setLoadingPayouts] = useState(true)

    useEffect(() => {
        const fetchPayouts = async () => {
            try {
                const res = await api.get<Payout[]>('/payout/my')
                setPayouts(res || [])
            } catch (err) {
                console.error('Failed to fetch payouts', err)
            } finally {
                setLoadingPayouts(false)
            }
        }
        fetchPayouts()
    }, [])

    const formatRp = (val: string | number) => {
        const num = typeof val === 'string' ? parseFloat(val) : val
        if (Number.isNaN(num)) return '-'
        return `Rp ${Math.floor(num).toLocaleString(locale)}`
    }

    const renderStatusBadge = (status: Payout['status']) => {
        const labelMap: Record<Payout['status'], string> = {
            REQUESTED: t('payoutRequested'),
            COMPLETED: t('payoutCompleted'),
            REJECTED: t('payoutRejected'),
        }
        const badgeClass =
            status === 'COMPLETED'
                ? 'bg-green-100 text-green-700'
                : status === 'REQUESTED'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                {labelMap[status] || status}
            </span>
        )
    }

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

                    {/* Payout Requests */}
                    <div className="mt-8 bg-card rounded-lg shadow-sm border border-border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-card-foreground">{t('payoutSectionTitle')}</h2>
                                <p className="text-sm text-muted-foreground">{t('payoutSectionSubtitle')}</p>
                            </div>
                        </div>

                        {loadingPayouts ? (
                            <p className="text-muted-foreground text-sm">{t('loadingData')}</p>
                        ) : payouts.length === 0 ? (
                            <p className="text-muted-foreground text-sm">{t('payoutEmpty')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-2">{t('payoutTableDate')}</th>
                                            <th className="px-4 py-2">{t('payoutTableRequested')}</th>
                                            <th className="px-4 py-2">{t('payoutTableFinal')}</th>
                                            <th className="px-4 py-2">{t('payoutTableStatus')}</th>
                                            <th className="px-4 py-2">{t('payoutTableReference')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payouts.map((payout) => (
                                            <tr key={payout.id} className="border-b last:border-0">
                                                <td className="px-4 py-2 text-muted-foreground">
                                                    {new Date(payout.createdAt).toLocaleString(locale)}
                                                </td>
                                                <td className="px-4 py-2 text-card-foreground font-medium">
                                                    {formatRp(payout.amountRequested)}
                                                </td>
                                                <td className="px-4 py-2 text-card-foreground">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{formatRp(payout.amountFinal)}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {t('payoutFee')} {formatRp(payout.feeAdmin)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2">
                                                    {renderStatusBadge(payout.status)}
                                                </td>
                                                <td className="px-4 py-2 text-muted-foreground">
                                                    {payout.referenceNo || payout.rejectionReason || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}

