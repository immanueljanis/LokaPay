'use client'

import { LayoutDashboard, FileText, User, Users, ReceiptText, WalletMinimal, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '../src/store/useAuth'
import { MENU_DASHBOARD } from '../src/constants/value'
import { useTranslations } from 'next-intl'

export function AppSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()
    const t = useTranslations('sidebar')

    const iconMap: Record<string, any> = {
        dashboard: LayoutDashboard,
        invoice: FileText,
        account: User,
        merchants: Users,
        transactions: ReceiptText,
        payouts: WalletMinimal,
        settings: Settings,
    }

    const isAdmin = user?.role === 'ADMIN'
    const menuMerchant = MENU_DASHBOARD.merchant
    const menuAdmin = MENU_DASHBOARD.admin

    return (
        <Sidebar>
            <SidebarHeader className="border-b border-sidebar-border px-4 py-6">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-petrol text-petrol-foreground">
                        <span className="text-lg font-bold">LP</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-sidebar-foreground">LokaPay</h2>
                        <p className="text-xs text-muted-foreground">Payment Without Borders</p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {isAdmin ? (
                    <SidebarGroup>
                        <SidebarGroupLabel>{t('admin')}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {menuAdmin?.map((item) => {
                                    const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                                    const Icon = iconMap[item.i18nKey] || LayoutDashboard
                                    return (
                                        <SidebarMenuItem key={item.url}>
                                            <SidebarMenuButton asChild isActive={isActive}>
                                                <Link href={item.url}>
                                                    <Icon />
                                                    <span>{t(item.i18nKey)}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ) : (
                    <SidebarGroup>
                        <SidebarGroupLabel>{t('menu')}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {menuMerchant.map((item) => {
                                    const isActive = pathname === item.url || pathname?.startsWith(item.url + '/')
                                    const Icon = iconMap[item.i18nKey] || LayoutDashboard
                                    return (
                                        <SidebarMenuItem key={item.url}>
                                            <SidebarMenuButton asChild isActive={isActive}>
                                                <Link href={item.url}>
                                                    <Icon />
                                                    <span>{t(item.i18nKey)}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
                                <span className="text-xs font-medium text-sidebar-accent-foreground">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-sidebar-foreground truncate">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user?.email || ''}
                                </p>
                            </div>
                        </div>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => {
                                logout()
                                router.push('/login')
                            }}
                            className="text-destructive hover:text-destructive"
                        >
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

