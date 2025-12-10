'use client'

import { useEffect, useState, use } from 'react' // Import 'use' untuk params di Next 15/14
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/axios.instance'
import QRCode from 'react-qr-code'
import { Button } from '@/components/ui/button'
import { TipBadge } from '@/components/common/TipBadge'
import { Copy, Check } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

// Tipe Data Transaksi
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
    paymentMethod?: string
    paymentAddress?: string
    paymentReference?: string
    network?: string
    status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID' | 'FAILED'
    expiresAt?: string
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const t = useTranslations('invoice')
    const tc = useTranslations('common')
    const locale = useLocale()

    const [tx, setTx] = useState<Transaction | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    console.log(tx)
    const fetchStatus = async () => {
        try {
            const transaction = await api.get<Transaction>(`/transaction/${id}`)
            setTx(transaction)
        } catch (err) {
            console.error("Error polling:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
        // Polling hanya jika status masih PENDING atau PARTIALLY_PAID
        const interval = setInterval(() => {
            fetchStatus()
        }, 5000) // Check setiap 5 detik
        return () => clearInterval(interval) // Cleanup
    }, [id])

    if (loading && !tx) return <div className="p-10 text-center">{t('loading')}</div>

    if (!tx) return <div className="p-10 text-center text-red-500">{t('notFound')}</div>

    // Logic Tampilan Status
    const isPaid = tx.status === 'PAID'
    const isOverpaid = tx.status === 'OVERPAID' // Status Khusus
    const isPartial = tx.status === 'PARTIALLY_PAID'

    // Hitung kelebihan untuk ditampilkan
    const amountInvoice = parseFloat((tx.amountInvoice || '0').toString())
    const amountUSDT = parseFloat((tx.amountUSDT || '0').toString())
    const exchangeRate = parseFloat((tx.exchangeRate || '0').toString())
    const amountReceivedIdr = parseFloat((tx.amountReceivedIdr || '0').toString())
    const amountReceivedUSDT = parseFloat((tx.amountReceivedUSDT || '0').toString())
    const tipIdr = parseFloat((tx.tipIdr || '0').toString())
    const tipAmount = tipIdr > 0 ? tipIdr.toFixed(0) : '0'

    // Format tanggal expiry
    const expiresAt = tx.expiresAt ? new Date(tx.expiresAt) : null
    const expiresAtFormatted = expiresAt ? expiresAt.toLocaleString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : null

    return (
        <div className="min-h-screen bg-primary text-primary-foreground flex flex-col items-center justify-center p-3">
            <div className="w-full max-w-md sm:max-w-lg bg-card text-card-foreground rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[95vh] border border-border">

                {/* Header Dinamis */}
                <div className={`p-4 text-center ${isPaid || isOverpaid ? 'bg-primary text-primary-foreground' : 'bg-primary text-primary-foreground'}`}>
                    <h2 className="text-sm font-medium opacity-90">{t('totalInvoice')}</h2>
                    <div className="text-2xl font-bold mt-0.5">Rp {Math.floor(amountInvoice).toLocaleString(locale)}</div>
                    {exchangeRate > 0 && (
                        <div className="mt-1 text-xs opacity-80">
                            ≈ {amountUSDT.toFixed(3)} USDT
                        </div>
                    )}
                </div>

                <div className="p-4 flex flex-col items-center flex-1 overflow-y-auto">

                    {/* OVERPAID */}
                    {isOverpaid ? (
                        <div className="py-3 text-center w-full">
                            <div className="w-16 h-16 mx-auto mb-2 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-3xl text-primary-foreground">✓</span>
                            </div>
                            <h3 className="text-lg font-bold text-card-foreground">{t('paymentSuccessTip')}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{t('exceedsAmount')}</p>

                            <div className="mt-3 bg-accent/30 border border-accent/50 p-2 rounded-lg">
                                <p className="text-xs text-card-foreground font-semibold">
                                    {t('paidExtra')} <br />
                                    <span className="text-sm text-primary">+Rp {Math.floor(tipIdr).toLocaleString(locale)}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">{t('excessToMerchant')}</p>
                            </div>

                            {/* Payment Summary */}
                            <div className="mt-3 bg-muted/50 p-2 rounded-lg text-left space-y-1 text-xs w-full">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('paid')}</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold">Rp {Math.floor(amountReceivedIdr).toLocaleString(locale)}</span>
                                        <TipBadge tipIdr={tipIdr} />
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('paidUsdt')}</span>
                                    <span className="font-semibold">{amountReceivedUSDT.toFixed(3)} USDT</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('invoiceIdr')}</span>
                                    <span className="font-semibold">Rp {Math.floor(amountInvoice).toLocaleString(locale)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('invoiceUsdt')}</span>
                                    <span className="font-semibold">{amountUSDT.toFixed(3)} USDT</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => router.back()}
                                className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {tc('back')}
                            </Button>
                        </div>
                    ) : isPaid ? (
                        /* PAID */
                        <div className="py-3 text-center w-full">
                            <div className="w-16 h-16 mx-auto mb-2 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-3xl text-primary-foreground">✓</span>
                            </div>
                            <h3 className="text-lg font-bold text-primary">{t('paymentSuccess')}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{t('thankYou')}</p>

                            {/* Payment Summary */}
                            <div className="mt-3 bg-muted/50 p-2 rounded-lg text-left space-y-1 text-xs w-full">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('paid')}</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold">Rp {Math.floor(amountInvoice).toLocaleString(locale)}</span>
                                        <TipBadge tipIdr={tipIdr} />
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('paidUsdt')}</span>
                                    <span className="font-semibold">{amountReceivedUSDT.toFixed(3)} USDT</span>
                                </div>
                            </div>

                            <Button
                                onClick={() => router.back()}
                                className="mt-3 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {tc('back')}
                            </Button>
                        </div>
                    ) : (
                        /* PENDING / PARTIAL */
                        <>
                            {/* Payment Amount Info */}
                            <div className="w-full mb-2 bg-muted/50 p-2 rounded-lg space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('amountToPay')}</span>
                                    <div className="text-right">
                                        <div className="font-bold text-sm">{amountUSDT.toFixed(3)} USDT</div>
                                        <div className="text-xs text-muted-foreground">≈ Rp {Math.floor(amountInvoice).toLocaleString(locale)}</div>
                                    </div>
                                </div>
                                {exchangeRate > 0 && (
                                    <div className="flex justify-between text-xs pt-1 border-t border-border">
                                        <span className="text-muted-foreground">{t('rate')}</span>
                                        <span>1 USDT = Rp {exchangeRate.toLocaleString(locale)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Partial Payment Warning - Dipindahkan ke atas agar lebih terlihat */}
                            {isPartial && (
                                <div className="w-full mb-3 bg-accent/20 border border-accent/50 p-2 rounded-lg text-xs text-center font-semibold text-accent-foreground">
                                    ⚠️ {t('partialPayment')} <br />
                                    {t('received')} Rp {Math.floor(amountReceivedIdr).toLocaleString(locale)} ({amountReceivedUSDT.toFixed(3)} USDT) <br />
                                    {t('remaining')} Rp {Math.floor(amountInvoice - amountReceivedIdr).toLocaleString(locale)} ({(amountUSDT - amountReceivedUSDT).toFixed(3)} USDT)
                                </div>
                            )}

                            {/* Tip Information Note */}
                            <div className="w-full mb-3 bg-primary/10 border border-primary/20 p-2.5 rounded-lg text-xs">
                                <p className="text-card-foreground text-center leading-relaxed">
                                    💝 <span className="font-semibold">{t('tipNote')}</span><br />
                                    {t('tipDescription')}
                                </p>
                            </div>

                            <div className="bg-card p-2 rounded-lg border border-border">
                                <QRCode value={tx.paymentAddress || tx.paymentReference || ''} size={150} />
                            </div>

                            <div className="mt-2 text-center w-full space-y-2">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">
                                        {t('paymentAddress')}
                                    </p>
                                    <div className="bg-muted p-2 rounded-lg font-mono text-xs break-all border border-border flex items-center justify-between gap-2">
                                        <span className="flex-1 text-left">{tx.paymentAddress || tx.paymentReference || t('waiting')}</span>
                                        {(tx.paymentAddress || tx.paymentReference) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 flex-shrink-0 hover:bg-primary/10"
                                                onClick={async () => {
                                                    const address = tx.paymentAddress || tx.paymentReference || ''
                                                    try {
                                                        await navigator.clipboard.writeText(address)
                                                        setCopied(true)
                                                        setTimeout(() => setCopied(false), 2000)
                                                    } catch (err) {
                                                        console.error('Failed to copy:', err)
                                                    }
                                                }}
                                                title={t('copyAddress')}
                                            >
                                                {copied ? (
                                                    <Check className="h-3 w-3 text-green-500" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {tx.network && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">
                                            {t('network')}
                                        </p>
                                        <div className="bg-muted p-1.5 rounded-lg text-xs font-semibold border border-border">
                                            {tx.network}
                                        </div>
                                    </div>
                                )}

                                {expiresAtFormatted && (
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">
                                            {t('expiresAt')}
                                        </p>
                                        <div className="text-xs font-semibold text-accent">
                                            {expiresAtFormatted}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Loading indicator di bawah... */}
                            <div className="mt-2 flex items-center justify-center space-x-2 text-xs text-muted-foreground animate-pulse">
                                <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                                <span>{t('waitingForPayment')}</span>
                            </div>
                        </>
                    )}

                </div>

                <div className="bg-muted p-2 text-center text-xs text-muted-foreground border-t border-border">
                    {t('invoiceId')} {tx.id.slice(0, 8)}...
                </div>
            </div>
        </div>
    )
}