'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '../../src/store/useAuth'

// Tipe Data untuk TypeScript
type Transaction = {
    id: string
    amountIDR: string
    amountUSDT: string
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
    const { user, logout } = useAuth() // Ambil user dari session login

    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    // 1. Cek Login & Fetch Data
    useEffect(() => {
        if (!user) {
            router.push('/login') // Kalau belum login, tendang keluar
            return
        }

        const fetchData = async () => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/merchant/${user.id}/dashboard`)
                setData(res.data.data)
            } catch (err) {
                console.error("Gagal ambil data dashboard", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        // Refresh data tiap 10 detik (Polling sederhana agar saldo live)
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [user, router])

    if (loading) return <div className="p-10 text-center">Memuat Dashboard...</div>
    if (!data) return null

    return (
        <div className="min-h-screen bg-gray-50">

            {/* NAVBAR */}
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600">LokaPay</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Halo, {data.name}</span>
                    <button
                        onClick={() => { logout(); router.push('/login') }}
                        className="text-sm text-red-500 hover:underline"
                    >
                        Keluar
                    </button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6 space-y-6">

                {/* CARD SALDO */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-8 text-white shadow-lg">
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Pendapatan (IDR)</p>
                    <h2 className="text-4xl font-bold">
                        Rp {parseInt(data.balanceIDR).toLocaleString('id-ID')}
                    </h2>
                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={() => router.push('/')} // Asumsi halaman "/" adalah halaman buat invoice
                            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow"
                        >
                            + Buat Tagihan Baru
                        </button>
                        <button className="bg-blue-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition border border-blue-400">
                            Tarik Saldo
                        </button>
                    </div>
                </div>

                {/* TABEL TRANSAKSI */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">Riwayat Transaksi Terakhir</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3">Waktu</th>
                                    <th className="px-6 py-3">Tagihan (IDR)</th>
                                    <th className="px-6 py-3">Terima (USDT)</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                                            Belum ada transaksi. Ayo mulai jualan!
                                        </td>
                                    </tr>
                                ) : (
                                    data.transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(tx.createdAt).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                Rp {parseInt(tx.amountIDR).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-mono">
                                                {parseFloat(tx.amountUSDT).toFixed(2)} USDT
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

            </main>
        </div>
    )
}