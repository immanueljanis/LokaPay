'use client'

import { useEffect, useState, use } from 'react' // Import 'use' untuk params di Next 15/14
import axios from 'axios'
import QRCode from 'react-qr-code'

// Tipe Data Transaksi
type Transaction = {
    id: string
    amountIDR: string
    amountUSDT: string
    paymentAddress: string
    status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID' | 'FAILED'
    amountReceived: string
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)

    const [tx, setTx] = useState<Transaction | null>(null)
    const [loading, setLoading] = useState(true)

    // 1. Fungsi Fetch Data
    const fetchStatus = async () => {
        try {
            // Kita butuh endpoint GET /transaction/:id di backend (Belum ada, nanti kita buat!)
            // Sementara kita pakai endpoint dummy atau perlu buat endpoint detail dulu di API
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transaction/${id}`)
            setTx(res.data.data)
        } catch (err) {
            console.error("Error polling:", err)
        } finally {
            setLoading(false)
        }
    }

    // 2. Polling Effect (Jalan setiap 3 detik)
    useEffect(() => {
        fetchStatus() // Fetch pertama
        const interval = setInterval(fetchStatus, 3000) // Ulangi tiap 3 detik
        return () => clearInterval(interval) // Cleanup
    }, [id])

    if (loading && !tx) return <div className="p-10 text-center">Loading Invoice...</div>

    if (!tx) return <div className="p-10 text-center text-red-500">Invoice Tidak Ditemukan</div>

    // Logic Tampilan Status
    const isPaid = tx.status === 'PAID'
    const isOverpaid = tx.status === 'OVERPAID' // Status Khusus
    const isPartial = tx.status === 'PARTIALLY_PAID'

    // Hitung kelebihan untuk ditampilkan
    const amountPaid = parseFloat(tx.amountReceived)
    const billAmount = parseFloat(tx.amountUSDT)
    const tipAmount = (amountPaid - billAmount).toFixed(4)

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden">

                {/* Header Dinamis */}
                <div className={`p-6 text-center ${isPaid || isOverpaid ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                    <h2 className="text-lg font-medium opacity-90">Total Tagihan</h2>
                    <div className="text-3xl font-bold mt-1">Rp {parseInt(tx.amountIDR).toLocaleString()}</div>
                    <div className="text-sm mt-1 opacity-80">≈ {parseFloat(tx.amountUSDT).toFixed(4)} USDT</div>
                </div>

                <div className="p-8 flex flex-col items-center">

                    {/* TAMPILAN JIKA OVERPAID (LEBIH BAYAR) */}
                    {isOverpaid ? (
                        <div className="py-6 text-center animate-bounce-short">
                            <div className="text-6xl mb-4">🤩</div>
                            <h3 className="text-2xl font-bold text-green-600">LUNAS + TIP!</h3>
                            <p className="text-gray-500 mt-2">Pembayaran diterima melebihi tagihan.</p>

                            <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded-lg">
                                <p className="text-sm text-green-800 font-semibold">
                                    Kamu membayar lebih: <br />
                                    <span className="text-lg text-green-600">+{tipAmount} USDT</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Kelebihan ini masuk ke saldo merchant.</p>
                            </div>
                        </div>
                    ) : isPaid ? (
                        /* TAMPILAN JIKA PAID (PAS) */
                        <div className="py-10 text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h3 className="text-2xl font-bold text-green-600">PEMBAYARAN SUKSES!</h3>
                            <p className="text-gray-500 mt-2">Terima kasih sudah berbelanja.</p>
                        </div>
                    ) : (
                        /* TAMPILAN JIKA BELUM LUNAS / PARTIAL */
                        <>
                            <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-inner">
                                <QRCode value={tx.paymentAddress} size={200} />
                            </div>

                            <div className="mt-6 text-center w-full">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Kirim USDT (BSC/BEP20) ke:</p>
                                <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-between font-mono text-xs break-all border border-gray-200">
                                    <span>{tx.paymentAddress}</span>
                                </div>
                            </div>

                            {isPartial && (
                                <div className="mt-4 bg-yellow-100 text-yellow-800 p-3 rounded-lg text-sm text-center w-full font-bold">
                                    ⚠️ KURANG BAYAR! <br />
                                    Masuk: {amountPaid} USDT <br />
                                    Kurang: {(billAmount - amountPaid).toFixed(4)} USDT
                                </div>
                            )}

                            {/* Loading indicator di bawah... */}
                            <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-400 animate-pulse">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Menunggu pembayaran masuk...</span>
                            </div>
                        </>
                    )}

                </div>

                <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t">
                    Invoice ID: {tx.id.slice(0, 8)}...
                </div>
            </div>
        </div>
    )
}