'use client'

import { useMerchantSync } from '../hooks/useMerchantSync'

export function MerchantSyncProvider({ children }: { children: React.ReactNode }) {
    useMerchantSync()
    return <>{children}</>
}

