'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../src/store/useAuth'

export default function LoginPage() {
    const router = useRouter()
    const login = useAuth((state) => state.login)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // 1. Tembak API Backend
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                email,
                password
            })

            // 2. Simpan data user ke Global Store (Persist di LocalStorage)
            // Data ini yang nanti dibaca oleh Dashboard & Halaman Create Invoice
            login(res.data.merchant)

            // 3. Redirect ke Dashboard
            router.push('/dashboard')

        } catch (err: any) {
            // Handle Error dari Backend
            const msg = err.response?.data?.error || 'Gagal login. Cek koneksi.'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">LokaPay</h1>
                    <p className="text-gray-500">Masuk untuk mengelola bisnis Anda</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
                        ⚠️ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Merchant</label>
                        <input
                            type="email"
                            required
                            placeholder="contoh: bagus@lokapay.com"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-md"
                    >
                        {loading ? 'Memuat...' : 'Masuk Dashboard'}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-400">
                    Belum punya akun? <span className="text-blue-500 cursor-pointer hover:underline">Hubungi Admin</span>
                </div>
            </div>
        </div>
    )
}