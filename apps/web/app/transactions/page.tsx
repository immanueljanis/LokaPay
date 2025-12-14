'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { DashboardLayout } from '../../components/DashboardLayout'
import { api } from '../../lib/axios.instance'
import { useTranslations, useLocale } from 'next-intl'
import { ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

type TransactionAdmin = {
    id: string
    merchantId: string
    merchant?: {
        id: string
        name: string
        email: string
    }
    amountInvoice: string | number
    amountUSDT: string | number
    amountReceivedUSDT: string | number
    amountReceivedIdr: string | number
    exchangeRate: string | number
    tipIdr: string | number
    feeApp: string | number
    status: string
    network: string
    txHash: string | null
    paymentAddress: string
    createdAt: string
    confirmedAt: string | null
    expiresAt: string
}

const getBlockExplorerUrl = (network: string, txHash: string | null): string | null => {
    if (!txHash) return null

    const networkLower = network.toLowerCase()
    if (networkLower === 'mantle' || networkLower.includes('mantle')) {
        return `https://explorer.sepolia.mantle.xyz/tx/${txHash}`
    }
    return null
}

export default function TransactionsPage() {
    const t = useTranslations('transactions')
    const locale = useLocale()
    const [data, setData] = useState<TransactionAdmin[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await api.get<TransactionAdmin[]>('/admin/transactions')
                setData(res || [])
            } catch (e: any) {
                setError(e?.response?.data?.message || e?.message || t('requestFailed'))
            } finally {
                setLoading(false)
            }
        }
        fetchTransactions()
    }, [t])

    const formatRp = (amount: string | number) => `Rp ${Number(amount).toLocaleString(locale)}`
    const formatUSDT = (amount: string | number) => `${Number(amount).toFixed(3)} USDT`

    const renderStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase()
        let badgeClass = 'bg-gray-100 text-gray-700'

        if (statusLower === 'paid' || statusLower === 'confirmed') {
            badgeClass = 'bg-green-100 text-green-700'
        } else if (statusLower === 'overpaid') {
            badgeClass = 'bg-blue-100 text-blue-700'
        } else if (statusLower === 'partially_paid' || statusLower === 'partially paid') {
            badgeClass = 'bg-yellow-100 text-yellow-700'
        } else if (statusLower === 'pending' || statusLower === 'detected') {
            badgeClass = 'bg-orange-100 text-orange-700'
        } else if (statusLower === 'expired' || statusLower === 'failed' || statusLower === 'refunded') {
            badgeClass = 'bg-red-100 text-red-700'
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${badgeClass}`}>
                {t(`status${status}`, { defaultValue: status })}
            </span>
        )
    }

    const renderTxHash = (txHash: string | null, network: string) => {
        if (!txHash) {
            return <span className="text-muted-foreground text-xs">-</span>
        }

        const explorerUrl = getBlockExplorerUrl(network, txHash)
        const shortHash = `${txHash.slice(0, 6)}...${txHash.slice(-4)}`

        if (explorerUrl) {
            return (
                <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1 text-xs font-mono"
                >
                    {shortHash}
                    <ExternalLink className="w-3 h-3" />
                </a>
            )
        }

        return (
            <span className="text-muted-foreground text-xs font-mono">
                {shortHash}
            </span>
        )
    }

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="px-3 sm:px-6 py-6 space-y-4 max-w-full overflow-x-hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
                    </div>

                    {loading ? (
                        <p className="text-muted-foreground text-sm">{t('loading')}</p>
                    ) : error ? (
                        <p className="text-destructive text-sm">{error}</p>
                    ) : data.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('empty')}</p>
                    ) : (
                        <div className="overflow-x-auto bg-card border border-border rounded-lg -mx-2 sm:mx-0 px-2 sm:px-0">
                            <table className="w-full text-sm text-left min-w-[800px]">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">{t('id')}</th>
                                        <th className="px-4 py-3">{t('merchant')}</th>
                                        <th className="px-4 py-3">{t('invoice')}</th>
                                        <th className="px-4 py-3">{t('received')}</th>
                                        <th className="px-4 py-3">{t('status')}</th>
                                        <th className="px-4 py-3">{t('network')}</th>
                                        <th className="px-4 py-3">{t('txHash')}</th>
                                        <th className="px-4 py-3">{t('created')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((tx) => (
                                        <tr key={tx.id} className="border-b last:border-0">
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                                {tx.id.slice(0, 8)}...
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-card-foreground">
                                                        {tx.merchant?.name || '-'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {tx.merchant?.email || ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-card-foreground">
                                                        {formatRp(tx.amountInvoice)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatUSDT(tx.amountUSDT)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-card-foreground">
                                                        {formatRp(tx.amountReceivedIdr)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatUSDT(tx.amountReceivedUSDT)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {renderStatusBadge(tx.status)}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <span className="px-2 py-1 rounded bg-muted text-xs">
                                                    {tx.network || 'MANTLE'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {renderTxHash(tx.txHash, tx.network)}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(tx.createdAt).toLocaleString(locale)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}

