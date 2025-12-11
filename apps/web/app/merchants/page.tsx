'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '../../components/ProtectedRoute'
import { DashboardLayout } from '../../components/DashboardLayout'
import { api } from '../../lib/axios.instance'
import { useTranslations } from 'next-intl'
import { useAuth } from '../../src/store/useAuth'

export const dynamic = 'force-dynamic'

type MerchantLite = {
    id: string
    name: string
    email: string
    role?: string
    balanceIDR?: string | number
    bankName?: string | null
    bankAccount?: string | null
    createdAt?: string
}

export default function MerchantsPage() {
    const t = useTranslations('sidebar')
    const tm = useTranslations('merchants')
    const { user } = useAuth()
    const [data, setData] = useState<MerchantLite[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchMerchants = async () => {
            try {
                const res = await api.get<MerchantLite[]>('/admin/merchants')
                setData(res || [])
            } catch (e: any) {
                setError(e?.response?.data?.message || e?.message || 'Failed to load merchants')
            } finally {
                setLoading(false)
            }
        }
        fetchMerchants()
    }, [])

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="px-3 sm:px-6 py-6 space-y-4 max-w-full overflow-x-hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{tm('title', { defaultValue: 'Merchants' })}</h1>
                        <p className="text-muted-foreground text-sm">{tm('subtitle', { defaultValue: 'All merchants list' })}</p>
                    </div>

                    {loading ? (
                        <p className="text-muted-foreground text-sm">{tm('loading', { defaultValue: 'Loading...' })}</p>
                    ) : error ? (
                        <p className="text-destructive text-sm">{error}</p>
                    ) : data.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{tm('empty', { defaultValue: 'No merchants found.' })}</p>
                    ) : (
                        <div className="overflow-x-auto bg-card border border-border rounded-lg -mx-2 sm:mx-0 px-2 sm:px-0">
                            <table className="w-full text-sm text-left min-w-[600px]">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">{tm('name', { defaultValue: 'Name' })}</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">{tm('balance', { defaultValue: 'Balance' })}</th>
                                        <th className="px-4 py-3">{tm('bank', { defaultValue: 'Bank' })}</th>
                                        <th className="px-4 py-3">{tm('created', { defaultValue: 'Created' })}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((m) => (
                                        <tr key={m.id} className="border-b last:border-0">
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{m.id.slice(0, 8)}...</td>
                                            <td className="px-4 py-3 text-card-foreground font-medium">{m.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-full bg-muted text-xs font-semibold">
                                                    {m.role || 'MERCHANT'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-card-foreground font-semibold">
                                                {m.balanceIDR !== undefined ? `Rp ${Number(m.balanceIDR).toLocaleString('id-ID')}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {m.bankName ? `${m.bankName} - ${m.bankAccount || ''}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {m.createdAt ? new Date(m.createdAt).toLocaleString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}

