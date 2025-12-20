import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocales } from './i18n'

const protectedRoutes = ['/dashboard', '/account']
const publicRoutes = ['/invoice', '/pay']

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale: 'en',
    localePrefix: 'always'
})

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    const pathnameWithoutLocale = pathname.replace(/^\/(en|id|zh)/, '') || '/'
    const localeMatch = pathname.match(/^\/(en|id|zh)/)
    const currentLocale = localeMatch ? localeMatch[1] : null

    let defaultLocale = 'en'

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

    if (!currentLocale) {
        const newPath = `/${defaultLocale}${pathnameWithoutLocale === '/' ? '' : pathnameWithoutLocale}`
        return NextResponse.redirect(new URL(newPath, request.url))
    }

    const isPublicRoute = publicRoutes.some(route => pathnameWithoutLocale.startsWith(route))

    const isProtectedRoute = protectedRoutes.some(route => pathnameWithoutLocale.startsWith(route))
    if (isProtectedRoute && !isPublicRoute) {
        const token = request.cookies.get('lokapay-token')

        if (!token) {
            const loginUrl = new URL(`/${currentLocale}/login`, request.url)
            loginUrl.searchParams.set('redirect', pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

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

