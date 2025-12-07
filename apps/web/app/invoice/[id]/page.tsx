'use client'

import { useEffect, useState, use } from 'react' // Import 'use' untuk params di Next 15/14
import { api } from '../../../lib/axios.instance'
import QRCode from 'react-qr-code'

// Tipe Data Transaksi
type Transaction = {
    id: string
    amountIDR: string
    amountReceived: string
    paymentMethod: string
    paymentReference: string
    status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID' | 'FAILED'
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)

    const [tx, setTx] = useState<Transaction | null>(null)
    const [loading, setLoading] = useState(true)

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

    if (loading && !tx) return <div className="p-10 text-center">Loading Invoice...</div>

    if (!tx) return <div className="p-10 text-center text-red-500">Invoice Tidak Ditemukan</div>

    // Logic Tampilan Status
    const isPaid = tx.status === 'PAID'
    const isOverpaid = tx.status === 'OVERPAID' // Status Khusus
    const isPartial = tx.status === 'PARTIALLY_PAID'

    // Hitung kelebihan untuk ditampilkan
    const amountPaid = parseFloat(tx.amountReceived || '0')
    const billAmount = parseFloat(tx.amountIDR)
    const tipAmount = (amountPaid - billAmount).toFixed(0)

    return (
        <div className="min-h-screen bg-primary text-primary-foreground flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-card text-card-foreground rounded-2xl shadow-2xl overflow-hidden">

                {/* Header Dinamis */}
                <div className={`p-6 text-center ${isPaid || isOverpaid ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground'}`}>
                    <h2 className="text-lg font-medium opacity-90">Total Tagihan</h2>
                    <div className="text-3xl font-bold mt-1">Rp {parseInt(tx.amountIDR).toLocaleString('id-ID')}</div>
                </div>

                <div className="p-8 flex flex-col items-center">

                    {/* TAMPILAN JIKA OVERPAID (LEBIH BAYAR) */}
                    {isOverpaid ? (
                        <div className="py-6 text-center animate-bounce-short">
                            <div className="text-6xl mb-4">🤩</div>
                            <h3 className="text-2xl font-bold text-green-600">LUNAS + TIP!</h3>
                            <p className="text-muted-foreground mt-2">Pembayaran diterima melebihi tagihan.</p>

                            <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded-lg">
                                <p className="text-sm text-green-800 font-semibold">
                                    Kamu membayar lebih: <br />
                                    <span className="text-lg text-green-600">+Rp {parseInt(tipAmount).toLocaleString('id-ID')}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Kelebihan ini masuk ke saldo merchant.</p>
                            </div>
                        </div>
                    ) : isPaid ? (
                        /* TAMPILAN JIKA PAID (PAS) */
                        <div className="py-10 text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h3 className="text-2xl font-bold text-green-600">PEMBAYARAN SUKSES!</h3>
                            <p className="text-muted-foreground mt-2">Terima kasih sudah berbelanja.</p>
                        </div>
                    ) : (
                        /* TAMPILAN JIKA BELUM LUNAS / PARTIAL */
                        <>
                            <div className="bg-card p-4 rounded-xl border-2 border-border shadow-inner">
                                <QRCode value={tx.paymentReference || ''} size={200} />
                            </div>

                            <div className="mt-6 text-center w-full">
                                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                                    {tx.paymentMethod || 'Virtual Account'}:
                                </p>
                                <div className="bg-muted p-3 rounded-lg flex items-center justify-between font-mono text-xs break-all border border-border">
                                    <span>{tx.paymentReference || 'Menunggu...'}</span>
                                </div>
                            </div>

                            {isPartial && (
                                <div className="mt-4 bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm text-center w-full font-bold">
                                    ⚠️ KURANG BAYAR! <br />
                                    Masuk: Rp {parseInt(amountPaid.toString()).toLocaleString('id-ID')} <br />
                                    Kurang: Rp {parseInt((billAmount - amountPaid).toString()).toLocaleString('id-ID')}
                                </div>
                            )}

                            {/* Loading indicator di bawah... */}
                            <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-muted-foreground animate-pulse">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Menunggu pembayaran masuk...</span>
                            </div>
                        </>
                    )}

                </div>

                <div className="bg-muted p-4 text-center text-xs text-muted-foreground border-t border-border">
                    Invoice ID: {tx.id.slice(0, 8)}...
                </div>
            </div>
        </div>
    )
}