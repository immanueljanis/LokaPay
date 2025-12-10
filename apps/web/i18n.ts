import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'id', 'zh'] as const;
export type Locale = (typeof locales)[number];
export const defaultTimeZone = 'Asia/Jakarta';

export const defaultLocales: Record<string, Locale> = {
    '/dashboard': 'id',
    '/account': 'id',
    '/login': 'id',
    '/invoice': 'id',
    '/': 'id'
};

export default getRequestConfig(async ({ requestLocale }) => {
    const resolvedLocale = await requestLocale;
    const locale: Locale = locales.includes((resolvedLocale as Locale)) ? (resolvedLocale as Locale) : 'en';

    if (!locales.includes(locale as Locale)) {
        notFound();
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default,
        timeZone: defaultTimeZone
    };
});

