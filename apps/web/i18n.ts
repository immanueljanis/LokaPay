import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'id', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocales: Record<string, Locale> = {
    '/dashboard': 'id', // merchant area default Indonesian
    '/account': 'id',   // merchant area default Indonesian
    '/login': 'id',     // login default Indonesian
    '/invoice': 'id',   // merchant invoice list default Indonesian
    '/': 'id'           // root default Indonesian
};

export default getRequestConfig(async ({ requestLocale }) => {
    const resolvedLocale = await requestLocale;
    const locale: Locale = locales.includes((resolvedLocale as Locale)) ? (resolvedLocale as Locale) : 'en';

    if (!locales.includes(locale as Locale)) {
        notFound();
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});

