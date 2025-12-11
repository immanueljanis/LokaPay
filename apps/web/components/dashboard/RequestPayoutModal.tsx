'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { api } from '../../lib/axios.instance'
import { showToast } from '../../lib/toast'

interface RequestPayoutModalProps {
    trigger: React.ReactNode
}

export function RequestPayoutModal({ trigger }: RequestPayoutModalProps) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const t = useTranslations('dashboard')

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        const num = Number(amount)
        if (Number.isNaN(num) || num < 10000) {
            showToast.error(t('payoutMinError'))
            return
        }
        setLoading(true)
        try {
            await api.post('/payout/request', { amount: num })
            showToast.success(t('payoutSuccess'))
            setOpen(false)
            setAmount('')
        } catch (err: any) {
            const raw = err?.response?.data?.message || err?.message || t('payoutRequestFailed')
            const lowered = (raw || '').toLowerCase()
            if (lowered.includes('insufficient balance')) {
                showToast.error(t('payoutInsufficient'))
            } else if (lowered.includes('minimum')) {
                showToast.error(t('payoutMinError'))
            } else {
                showToast.error(raw || t('payoutRequestFailed'))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('payoutTitle')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-card-foreground mb-2">{t('payoutAmountLabel')}</label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold z-10">Rp</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={amount ? Number(amount.replace(/\D/g, '') || '0').toLocaleString('id-ID') : ''}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '')
                                    setAmount(raw)
                                }}
                                className="w-full pl-12 p-3.5 border border-input rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground hover:border-primary/50"
                                placeholder={t('payoutAmountPlaceholder')}
                                required
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{t('payoutAdminNote')}</p>
                    </div>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                        {loading ? t('payoutProcessing') : t('payoutSubmit')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

