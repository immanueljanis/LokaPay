'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import { DashboardLayout } from '../../components/DashboardLayout'

export default function InvoicePage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4 text-foreground">Invoice</h1>
                    <p className="text-muted-foreground">Halaman invoice akan segera tersedia.</p>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}

