'use client'

import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { useAuth } from '../src/store/useAuth'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const router = useRouter()
    const { user } = useAuth()

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-1">
                <div className="flex h-full flex-col">
                    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-4">
                        <SidebarTrigger />
                        <div className="flex-1"></div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <span className="text-sm font-medium text-muted-foreground">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>
                    </header>
                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                </div>
            </main>
        </SidebarProvider>
    )
}

