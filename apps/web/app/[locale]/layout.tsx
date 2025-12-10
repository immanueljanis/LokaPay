import { notFound } from 'next/navigation'
import { locales } from '@/i18n'
import { LocaleProviders } from '../../components/common/LocaleProviders'
import { FloatingLanguageSwitcher } from '../../components/common/FloatingLanguageSwitcher'

export const dynamic = 'force-dynamic'

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params

    if (!locales.includes(locale as (typeof locales)[number])) {
        notFound()
    }

    const messages = (await import(`../../messages/${locale}.json`)).default

    return (
        <LocaleProviders locale={locale} messages={messages}>
            {children}
            <FloatingLanguageSwitcher />
        </LocaleProviders>
    )
}

