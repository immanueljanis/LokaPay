'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/axios.instance'
import { useAuth } from '../../src/store/useAuth'
import { useTranslations } from 'next-intl'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreateInvoiceModalProps {
    trigger: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function CreateInvoiceModal({
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
}: CreateInvoiceModalProps) {
    const router = useRouter()
    const { user } = useAuth()
    const t = useTranslations('invoice')
    const tc = useTranslations('common')
    const [amount, setAmount] = useState('')
    const [loading, setLoading] = useState(false)
    const [internalOpen, setInternalOpen] = useState(false)

    // Use controlled or internal state
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setIsOpen = controlledOnOpenChange || setInternalOpen

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)

        try {
            const responseData = await api.post<{ invoiceId: string }>('/transaction/create', {
                merchantId: user.id,
                amountIDR: parseFloat(amount)
            })

            const invoiceId = responseData.invoiceId
            setIsOpen(false)
            setAmount('')
            router.push(`/invoice/${invoiceId}`)
        } catch (error) {
            console.error(error)
            alert(t('createFailed'))
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) {
            // Reset form when closing
            setAmount('')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                        {t('createDescription')}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateInvoice} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">{t('amount')}</Label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">Rp</span>
                            <Input
                                id="amount"
                                type="text"
                                value={amount ? Number(amount.replace(/\D/g, '') || '0').toLocaleString('id-ID') : ''}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, '')
                                    setAmount(raw)
                                }}
                                className="pl-12 text-lg font-semibold h-12"
                                placeholder="0"
                                required
                                inputMode="numeric"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('minimumPayment')}
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={loading}
                            className="flex-1"
                        >
                            {tc('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !amount || parseFloat(amount) < 10000}
                            className="flex-1"
                        >
                            {loading ? t('processing') : t('createButton')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

