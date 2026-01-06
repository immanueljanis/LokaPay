'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { locales } from '@/i18n'

const languageNames: Record<string, string> = {
    en: 'English',
    id: 'Bahasa',
    zh: '中文',
}

export function FloatingLanguageSwitcher() {
    const [mounted, setMounted] = useState(false)
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        setMounted(true)
    }, [])

    const switchLocale = (newLocale: string) => {
        const pathWithoutLocale = pathname.replace(/^\/(en|id|zh)/, '') || '/'
        const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
        router.replace(newPath)
    }

    // Prevent hydration mismatch by only rendering on client
    if (!mounted) {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="default"
                        size="lg"
                        className="rounded-full shadow-lg bg-primary text-primary-foreground gap-2 px-4 py-2 backdrop-blur hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        <Globe className="h-4 w-4" />
                        <span className="font-semibold text-xs sm:text-sm">{languageNames[locale] || 'Language'}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem] shadow-lg">
                    {locales.map((loc) => (
                        <DropdownMenuItem
                            key={loc}
                            onClick={() => switchLocale(loc)}
                            className={`rounded-md px-3 py-2 text-sm transition-colors ${locale === loc ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'}`}
                        >
                            {languageNames[loc]}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

