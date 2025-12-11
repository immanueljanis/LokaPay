'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../src/store/useAuth'
import { useTranslations } from 'next-intl'

export const dynamic = 'force-dynamic'

export default function RootRedirect() {
  const router = useRouter()
  const { user } = useAuth()
  const tc = useTranslations('common')

  useEffect(() => {
    if (!user) {
      router.replace('/login')
      return
    }
    if (user.role === 'ADMIN') {
      router.replace('/merchants')
    } else {
      router.replace('/dashboard')
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground text-sm">{tc('loading')}</div>
    </div>
  )
}