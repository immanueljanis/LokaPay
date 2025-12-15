import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocales } from './i18n'

const protectedRoutes = ['/dashboard', '/account', '/invoice']

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale: 'en',
    localePrefix: 'always'
})

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Extract locale from pathname
    const pathnameWithoutLocale = pathname.replace(/^\/(en|id|zh)/, '') || '/'
    const localeMatch = pathname.match(/^\/(en|id|zh)/)
    const currentLocale = localeMatch ? localeMatch[1] : null

    // Determine default locale based on route
    let defaultLocale = 'en'

    // Special case: invoice detail should default to English
    if (pathnameWithoutLocale.startsWith('/invoice/')) {
        defaultLocale = 'en'
    } else {
        for (const [path, loc] of Object.entries(defaultLocales)) {
            if (pathnameWithoutLocale.startsWith(path)) {
                defaultLocale = loc
                break
            }
        }
    }

    // If no locale in pathname, redirect to default locale for that route
    if (!currentLocale) {
        const newPath = `/${defaultLocale}${pathnameWithoutLocale === '/' ? '' : pathnameWithoutLocale}`
        return NextResponse.redirect(new URL(newPath, request.url))
    }

    // Check protected routes (without locale prefix)
    const isProtectedRoute = protectedRoutes.some(route => pathnameWithoutLocale.startsWith(route))
    if (isProtectedRoute) {
        const token = request.cookies.get('lokapay-token')

        if (!token) {
            const loginUrl = new URL(`/${currentLocale}/login`, request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    // Redirect logged-in users away from login page
    if (pathnameWithoutLocale === '/login') {
        const token = request.cookies.get('lokapay-token')
        if (token) {
            const dashboardUrl = new URL(`/${currentLocale}/dashboard`, request.url)
            return NextResponse.redirect(dashboardUrl)
        }
    }

    // Apply next-intl middleware
    return intlMiddleware(request)
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|audio|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)',
    ],
}

