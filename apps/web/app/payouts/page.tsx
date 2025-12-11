'use client'

import { useEffect, useState, ChangeEvent } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { DashboardLayout } from '../../components/DashboardLayout'
import { api } from '../../lib/axios.instance'
import { useTranslations } from 'next-intl'
import { showToast } from '../../lib/toast'
import { SimpleTable } from '../../components/admin/SimpleTable'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

type PayoutAdmin = {
    id: string
    merchantId: string
    merchantName?: string | null
    merchantEmail?: string | null
    amountRequested: string | number
    feeAdmin: string | number
    amountFinal: string | number
    status: 'REQUESTED' | 'COMPLETED' | 'REJECTED'
    toBankName?: string | null
    toBankAccount?: string | null
    toBankHolder?: string | null
    referenceNo?: string | null
    rejectionReason?: string | null
    createdAt: string
}

export default function PayoutsPage() {
    const t = useTranslations('payouts')
    const ta = useTranslations('account')
    const [data, setData] = useState<PayoutAdmin[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [approveOpen, setApproveOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [referenceNo, setReferenceNo] = useState('')
    const [rejectReason, setRejectReason] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const fetchData = async () => {
        try {
            const res = await api.get<PayoutAdmin[]>('/admin/payouts')
            setData(res || [])
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || t('requestFailed'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const openApprove = (id: string) => {
        setSelectedId(id)
        setReferenceNo('')
        setApproveOpen(true)
    }

    const openReject = (id: string) => {
        setSelectedId(id)
        setRejectReason('')
        setRejectOpen(true)
    }

    const submitApprove = async () => {
        if (!selectedId) return
        setSubmitting(true)
        try {
            await api.post('/payout/complete', {
                payoutId: selectedId,
                proofImage: 'https://example.com/proof.png',
                referenceNo: referenceNo || `REF-${Date.now()}`,
            })
            showToast.success(t('completedSuccess'))
            setApproveOpen(false)
            fetchData()
        } catch (e: any) {
            showToast.error(e?.response?.data?.message || e?.message || t('requestFailed'))
        } finally {
            setSubmitting(false)
        }
    }

    const submitReject = async () => {
        if (!selectedId) return
        if (!rejectReason.trim()) {
            showToast.error(t('confirmReject'))
            return
        }
        setSubmitting(true)
        try {
            await api.post('/payout/reject', { payoutId: selectedId, reason: rejectReason })
            showToast.success(t('rejectedSuccess'))
            setRejectOpen(false)
            fetchData()
        } catch (e: any) {
            showToast.error(e?.response?.data?.message || e?.message || t('requestFailed'))
        } finally {
            setSubmitting(false)
        }
    }

    const columns = [
        {
            key: 'merchant',
            header: t('merchant'),
            render: (row: PayoutAdmin) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-card-foreground">{row.merchantName || '-'}</span>
                    <span className="text-xs text-muted-foreground">{row.merchantEmail || ''}</span>
                </div>
            ),
        },
        {
            key: 'amount',
            header: t('amount'),
            render: (row: PayoutAdmin) => `Rp ${Number(row.amountRequested).toLocaleString('id-ID')}`,
        },
        {
            key: 'final',
            header: t('final'),
            render: (row: PayoutAdmin) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-card-foreground">
                        Rp {Number(row.amountFinal).toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {ta('payoutFee')}: Rp {Number(row.feeAdmin).toLocaleString('id-ID')}
                    </span>
                </div>
            ),
        },
        {
            key: 'status',
            header: t('status'),
            render: (row: PayoutAdmin) => {
                const badgeClass =
                    row.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : row.status === 'REQUESTED'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                return <span className={`px-2 py-1 rounded-full text-xs font-bold ${badgeClass}`}>{row.status}</span>
            },
        },
        {
            key: 'bank',
            header: t('bank'),
            render: (row: PayoutAdmin) => (row.toBankName ? `${row.toBankName} - ${row.toBankAccount}` : '-'),
        },
        {
            key: 'createdAt',
            header: t('created'),
            render: (row: PayoutAdmin) => new Date(row.createdAt).toLocaleString(),
        },
        {
            key: 'reference',
            header: t('reference'),
            render: (row: PayoutAdmin) => row.referenceNo || row.rejectionReason || '-',
        },
        {
            key: 'action',
            header: t('action'),
            render: (row: PayoutAdmin) =>
                row.status === 'REQUESTED' ? (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 h-auto"
                            onClick={() => openApprove(row.id)}
                        >
                            {t('complete')}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs px-3 py-1 h-auto"
                            onClick={() => openReject(row.id)}
                        >
                            {t('reject')}
                        </Button>
                    </div>
                ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                ),
        },
    ]

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="p-6 space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
                        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
                    </div>

                    {loading ? (
                        <p className="text-muted-foreground text-sm">{t('loading')}</p>
                    ) : error ? (
                        <p className="text-destructive text-sm">{error}</p>
                    ) : (
                        <SimpleTable columns={columns} data={data} emptyText={t('empty')} />
                    )}
                </div>
            </DashboardLayout>

            {/* Approve Modal */}
            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('confirmComplete')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-1">Reference No (optional)</label>
                            <Input
                                value={referenceNo}
                                onChange={(e) => setReferenceNo(e.target.value)}
                                placeholder={`REF-${Date.now()}`}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4 flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={submitApprove} disabled={submitting} className="bg-green-600 hover:bg-green-700">
                            {submitting ? t('loading') : t('complete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('confirmReject')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-card-foreground mb-1">Remark</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                                rows={3}
                                placeholder="Reason..."
                                className="w-full p-3.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground hover:border-primary/50"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-4 flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={submitReject} disabled={submitting} className="bg-red-600 hover:bg-red-700">
                            {submitting ? t('loading') : t('reject')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ProtectedRoute>
    )
}

