'use client'

import { useState, useEffect } from 'react'
import { api } from '../lib/axios.instance'
import { useRouter } from 'next/navigation'
import { useAuth } from '../src/store/useAuth'

export default function MerchantDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) return null

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const responseData = await api.post<{ invoiceId: string }>('/transaction/create', {
        merchantId: user.id,
        amountIDR: parseFloat(amount)
      })

      const invoiceId = responseData.invoiceId
      router.push(`/invoice/${invoiceId}`)

    } catch (error) {
      console.error(error)
      alert('Gagal membuat tagihan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <button onClick={() => router.push('/dashboard')} className="text-primary hover:underline">
          &larr; Kembali ke Dashboard
        </button>
      </div>

      <div className="max-w-md w-full bg-card rounded-xl shadow-lg p-8">
        <form onSubmit={handleCreateInvoice} className="space-y-6">
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-muted-foreground font-bold">Rp</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring text-lg font-semibold bg-background text-foreground"
              placeholder="0"
              required
              min="10000"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground font-bold py-4 rounded-lg transition-colors disabled:bg-muted disabled:text-muted-foreground"
          >
            {loading ? 'Memproses...' : 'Buat QR Code'}
          </button>
        </form>
      </div>
    </div>
  )
}