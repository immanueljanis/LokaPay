'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '../../lib/axios.instance'
import { useAuth } from '../../src/store/useAuth'
import ProtectedRoute from '../../components/ProtectedRoute'
import { DashboardLayout } from '../../components/DashboardLayout'
import { CreateInvoiceModal } from '../../components/dashboard/CreateInvoiceModal'
import { RequestPayoutModal } from '../../components/dashboard/RequestPayoutModal'
import { Button } from '@/components/ui/button'
import { TipBadge } from '@/components/common/TipBadge'

export const dynamic = 'force-dynamic'

// Tipe Data untuk Transaction
type Transaction = {
    id: string
    // Field Invoice
    amountInvoice: string | number
    amountUSDT: string | number
    exchangeRate: string | number
    // Field Payment Received
    amountReceivedUSDT: string | number
    amountReceivedIdr: string | number
    // Field Breakdown
    tipIdr: string | number
    feeApp: string | number
    status: string
    createdAt: string
}

type DashboardData = {
    name: string
    email: string
    balanceIDR: string
    transactions: Transaction[]
}

export default function DashboardPage() {
    const { user } = useAuth()
    const t = useTranslations('dashboard')
    const locale = useLocale()

    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) return

        let mounted = true

        const fetchData = async () => {
            try {
                const responseData = await api.get<DashboardData>(`/merchant/${user.id}/dashboard`)
                if (mounted) {
                    setData(responseData)
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data", err)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 30000)

        return () => {
            mounted = false
            clearInterval(interval)
        }
    }, [user?.id])

    return (
        <ProtectedRoute>
            <DashboardLayout>
                {loading ? (
                    <div className="flex h-full items-center justify-center p-6">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">{t('loadingDashboard')}</p>
                        </div>
                    </div>
                ) : !data ? (
                    <div className="flex h-full items-center justify-center p-6">
                        <p className="text-muted-foreground">{t('failedToLoad')}</p>
                    </div>
                ) : (
                    <div className="min-h-full bg-background p-6">
                        <div className="max-w-4xl mx-auto space-y-6">

                            {/* CARD SALDO */}
                            <div className="bg-primary rounded-2xl p-8 text-primary-foreground shadow-lg">
                                <p className="text-primary-foreground/80 text-sm font-medium mb-1">{t('totalRevenue')}</p>
                                <h2 className="text-4xl font-bold">
                                    Rp {parseInt(data.balanceIDR).toLocaleString(locale)}
                                </h2>
                                <div className="mt-6 flex gap-3">
                                    <CreateInvoiceModal
                                        trigger={
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="bg-background text-primary px-6 py-2 rounded-lg font-bold hover:bg-secondary hover:text-primary transition-all shadow-md hover:shadow-lg"
                                            >
                                                + {t('createInvoice')}
                                            </Button>
                                        }
                                    />
                                    <RequestPayoutModal
                                        trigger={
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="bg-accent text-accent-foreground px-6 py-2 rounded-lg font-bold hover:bg-accent/90 hover:text-accent-foreground transition-all border border-accent shadow-md hover:shadow-lg"
                                            >
                                                {t('withdrawBalance')}
                                            </Button>
                                        }
                                    />
                                </div>
                            </div>

                            {/* TABEL TRANSAKSI */}
                            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                                <div className="px-6 py-4 border-b border-border">
                                    <h3 className="font-bold text-card-foreground">{t('transactionHistory')}</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground">
                                            <tr>
                                                <th className="px-6 py-3">{t('id')}</th>
                                                <th className="px-6 py-3">{t('time')}</th>
                                                <th className="px-6 py-3">{t('invoice')}</th>
                                                <th className="px-6 py-3">{t('received')}</th>
                                                <th className="px-6 py-3">{t('status')}</th>
                                                <th className="px-6 py-3 text-center">{t('action')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                                        {t('noTransactions')}
                                                    </td>
                                                </tr>
                                            ) : (
                                                data.transactions.map((tx) => (
                                                    <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/50">
                                                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                                                            {tx.id.slice(0, 8)}...
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground">
                                                            {new Date(tx.createdAt).toLocaleString(locale)}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-card-foreground">
                                                            Rp {Math.floor(parseFloat(tx?.amountInvoice?.toString() || '0')).toLocaleString(locale)}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-card-foreground">
                                                            {(() => {
                                                                let amountReceivedIdr = parseFloat(tx.amountReceivedIdr.toString());
                                                                const tipIdr = parseFloat(tx.tipIdr.toString())

                                                                if (tx.status === 'PAID' || tx.status === 'OVERPAID') {
                                                                    amountReceivedIdr = parseFloat(tx.amountInvoice.toString())
                                                                }

                                                                const merchantReceived = amountReceivedIdr + tipIdr
                                                                return (
                                                                    <div className="flex items-center gap-1">
                                                                        <span>Rp {merchantReceived.toLocaleString(locale)}</span>
                                                                        <TipBadge tipIdr={tipIdr} />
                                                                    </div>
                                                                )
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {(() => {
                                                                const status = tx.status
                                                                const isSuccess = status === 'PAID' || status === 'OVERPAID'
                                                                const isPending = status === 'PENDING' || status === 'PARTIALLY_PAID'

                                                                const labelMap: Record<string, string> = {
                                                                    PENDING: t('statusPending'),
                                                                    OVERPAID: t('statusOverpaid'),
                                                                    PAID: t('statusPaid'),
                                                                    PARTIALLY_PAID: t('statusPartiallyPaid'),
                                                                }

                                                                const badgeClass = isSuccess
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : isPending
                                                                        ? 'bg-yellow-100 text-yellow-700'
                                                                        : 'bg-red-100 text-red-700'

                                                                return (
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                                                                        {labelMap[status]}
                                                                    </span>
                                                                )
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <Link href={`/invoice/${tx.id}`}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                                                                    title={t('viewInvoice')}
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DashboardLayout>
        </ProtectedRoute>
    )
}