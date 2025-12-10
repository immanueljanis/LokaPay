'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/common/DropdownLanguageMenu'
import { Globe } from 'lucide-react'
import { locales } from '@/i18n'

const languageNames: Record<string, string> = {
    en: 'English',
    id: 'Bahasa Indonesia',
    zh: '中文'
}

export function LanguageSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    const switchLocale = (newLocale: string) => {
        const pathWithoutLocale = pathname.replace(/^\/(en|id|zh)/, '') || '/'
        const newPath = `/${newLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`

        router.push(newPath)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                >
                    <Globe className="h-4 w-4" />
                    <span className="hidden sm:inline">{languageNames[locale] || 'English'}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((loc) => (
                    <DropdownMenuItem
                        key={loc}
                        onClick={() => switchLocale(loc)}
                        className={locale === loc ? 'bg-accent' : ''}
                    >
                        {languageNames[loc]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

