'use client'

import { NextIntlClientProvider } from 'next-intl'
import { MerchantSyncProvider } from '../MerchantSyncProvider'

type LocaleProvidersProps = {
    locale: string
    messages: any
    children: React.ReactNode
}

export function LocaleProviders({ locale, messages, children }: LocaleProvidersProps) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <MerchantSyncProvider>{children}</MerchantSyncProvider>
        </NextIntlClientProvider>
    )
}

