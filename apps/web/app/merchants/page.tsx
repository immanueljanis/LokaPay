'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import { DashboardLayout } from '../../components/DashboardLayout'

export const dynamic = 'force-dynamic'

export default function MerchantsPage() {
    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-foreground">Hello World</h1>
                    <p className="text-muted-foreground mt-2">This is the merchants admin page.</p>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}

