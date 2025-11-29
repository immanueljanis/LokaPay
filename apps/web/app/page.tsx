'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function MerchantDashboard() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const MERCHANT_ID = "705547ea-2797-4a4b-aca3-22737f92bf89" // <--- GANTI INI DENGAN ID DARI DB KAMU

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const numericAmount = parseFloat(amount)

      // Tembak API Backend
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/transaction/create`, {
        merchantId: MERCHANT_ID,
        amountIDR: numericAmount
      })

      // Jika sukses, kita lempar ke halaman Invoice (nanti kita buat)
      const invoiceId = response.data.data.invoiceId
      router.push(`/invoice/${invoiceId}`)

    } catch (error) {
      console.error(error)
      alert('Gagal membuat tagihan. Pastikan Backend nyala!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">LokaPay POS</h1>
          <p className="text-gray-500">Buat tagihan baru untuk turis</p>
        </div>

        <form onSubmit={handleCreateInvoice} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nominal Rupiah (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 font-bold">Rp</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                placeholder="0"
                required
                min="10000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Memproses...' : 'Buat QR Code'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Powered by LokaPay &bull; Rate Realtime
          </p>
        </div>
      </div>
    </div>
  )
}