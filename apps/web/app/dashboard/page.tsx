'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/axios.instance'
import { useAuth } from '../../src/store/useAuth'
import ProtectedRoute from '../../components/ProtectedRoute'
import { DashboardLayout } from '../../components/DashboardLayout'

// Tipe Data untuk TypeScript
type Transaction = {
    id: string
    amountIDR: string
    amountReceived: string
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
    const router = useRouter()
    const { user, logout, updateBalance } = useAuth() // Ambil user dari session login

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
                console.error("Gagal ambil data dashboard", err)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        fetchData()
        // Refresh data tiap 30 detik (Polling untuk update transaksi)
        const interval = setInterval(fetchData, 30000)

        return () => {
            mounted = false
            clearInterval(interval)
        }
    }, [user?.id]) // Hanya depend pada user.id, bukan seluruh user object

    return (
        <ProtectedRoute>
            <DashboardLayout>
                {loading ? (
                    <div className="flex h-full items-center justify-center p-6">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Memuat Dashboard...</p>
                        </div>
                    </div>
                ) : !data ? (
                    <div className="flex h-full items-center justify-center p-6">
                        <p className="text-muted-foreground">Gagal memuat data</p>
                    </div>
                ) : (
                    <div className="min-h-full bg-background p-6">
                        <div className="max-w-4xl mx-auto space-y-6">

                            {/* CARD SALDO */}
                            <div className="bg-primary rounded-2xl p-8 text-primary-foreground shadow-lg">
                                <p className="text-primary-foreground/80 text-sm font-medium mb-1">Total Pendapatan (IDR)</p>
                                <h2 className="text-4xl font-bold">
                                    Rp {parseInt(data.balanceIDR).toLocaleString('id-ID')}
                                </h2>
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => router.push('/')}
                                        className="bg-background text-primary px-6 py-2 rounded-lg font-bold hover:bg-secondary transition shadow"
                                    >
                                        + Buat Tagihan Baru
                                    </button>
                                    <button className="bg-accent text-accent-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition border border-accent">
                                        Tarik Saldo
                                    </button>
                                </div>
                            </div>

                            {/* TABEL TRANSAKSI */}
                            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                                <div className="px-6 py-4 border-b border-border">
                                    <h3 className="font-bold text-card-foreground">Riwayat Transaksi Terakhir</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground">
                                            <tr>
                                                <th className="px-6 py-3">Waktu</th>
                                                <th className="px-6 py-3">Tagihan (IDR)</th>
                                                <th className="px-6 py-3">Terima (IDR)</th>
                                                <th className="px-6 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                                        Belum ada transaksi. Ayo mulai jualan!
                                                    </td>
                                                </tr>
                                            ) : (
                                                data.transactions.map((tx) => (
                                                    <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/50">
                                                        <td className="px-6 py-4 text-muted-foreground">
                                                            {new Date(tx.createdAt).toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-card-foreground">
                                                            Rp {parseInt(tx.amountIDR).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-card-foreground">
                                                            Rp {parseInt(tx.amountReceived || '0').toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${tx.status === 'PAID' || tx.status === 'OVERPAID'
                                                                ? 'bg-green-100 text-green-700'
                                                                : tx.status === 'PENDING'
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {tx.status}
                                                            </span>
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