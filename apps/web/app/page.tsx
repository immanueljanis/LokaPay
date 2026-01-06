'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Globe, Wallet, ArrowRightLeft, Shield, Zap, Store, Users, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { FloatingLanguageSwitcher } from '@/components/common/FloatingLanguageSwitcher'

export const dynamic = 'force-dynamic'

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const t = useTranslations('landing')

  useEffect(() => {
    setIsVisible(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo/logoCircle.png"
              alt="LokaPay"
              width={36}
              height={36}
              className="rounded-full"
            />
            <span className="font-bold text-xl tracking-tight text-primary">LokaPay</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                {t('nav.signIn')}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {t('nav.getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center py-32 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23002731' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              transform: `translateY(${scrollY * 0.1}px)`
            }}
          />
          {/* Gradient Orbs */}
          <div
            className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl"
            style={{ transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.02}px)` }}
          />
          <div
            className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-accent/20 to-transparent blur-3xl"
            style={{ transform: `translate(-${scrollY * 0.03}px, -${scrollY * 0.02}px)` }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-primary/80">{t('hero.badge')}</span>
          </div>

          {/* Main Headline */}
          <h1
            className={`text-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-primary mb-6 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            {t('hero.title1')} <span className="text-accent">{t('hero.title2')}</span>,<br />
            {t('hero.title3')} <span className="text-accent">{t('hero.title4')}</span>
          </h1>

          {/* Subheadline */}
          <p
            className={`text-body text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            dangerouslySetInnerHTML={{ __html: t.raw('hero.subtitle') }}
          />

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <Link href="/register">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-base font-semibold group">
                {t('hero.cta1')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base font-semibold">
                {t('hero.cta2')}
              </Button>
            </Link>
          </div>

          {/* Visual Flow Diagram */}
          <div
            className={`relative transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 p-6 md:p-8 bg-card rounded-2xl border border-border shadow-xl">
              {/* Tourist Side */}
              <div className="flex items-center gap-4 px-6 py-4 bg-primary/5 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('hero.touristPays')}</p>
                  <p className="text-xl font-bold text-primary">$50 USDT</p>
                </div>
              </div>

              {/* Arrow / LokaPay Processing */}
              <div className="flex flex-col items-center gap-2 py-4 md:py-0">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent">
                  <ArrowRightLeft className="w-6 h-6 text-accent-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">LokaPay</span>
              </div>

              {/* Merchant Side */}
              <div className="flex items-center gap-4 px-6 py-4 bg-green-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Store className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('hero.merchantReceives')}</p>
                  <p className="text-xl font-bold text-green-600">Rp 815,000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="animate-bounce">
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }} />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-center mb-6">
            {t('problem.title')}
          </h2>
          <p className="text-body text-lg text-primary-foreground/80 text-center max-w-3xl mx-auto mb-16">
            {t('problem.subtitle')}
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Tourist Pain Points */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-heading text-xl mb-4">{t('problem.forTourists')}</h3>
              <ul className="space-y-3 text-primary-foreground/80">
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✕</span>
                  <span>{t('problem.touristPain1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✕</span>
                  <span>{t('problem.touristPain2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✕</span>
                  <span>{t('problem.touristPain3')}</span>
                </li>
              </ul>
            </div>

            {/* Merchant Pain Points */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <Store className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-heading text-xl mb-4">{t('problem.forMerchants')}</h3>
              <ul className="space-y-3 text-primary-foreground/80">
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✕</span>
                  <span>{t('problem.merchantPain1')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✕</span>
                  <span>{t('problem.merchantPain2')}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-destructive mt-1">✕</span>
                  <span>{t('problem.merchantPain3')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-primary mb-4">
              {t('howItWorks.title')}
            </h2>
            <p className="text-body text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center shadow-lg">
                1
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm h-full group-hover:shadow-lg group-hover:border-primary/20 transition-all">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <Wallet className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-heading text-xl text-primary mb-3">{t('howItWorks.step1Title')}</h3>
                <p className="text-body text-muted-foreground">
                  {t('howItWorks.step1Desc')}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center shadow-lg">
                2
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm h-full group-hover:shadow-lg group-hover:border-primary/20 transition-all">
                <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                  <ArrowRightLeft className="w-7 h-7 text-accent-foreground" />
                </div>
                <h3 className="text-heading text-xl text-primary mb-3">{t('howItWorks.step2Title')}</h3>
                <p className="text-body text-muted-foreground">
                  {t('howItWorks.step2Desc')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center shadow-lg">
                3
              </div>
              <div className="bg-card rounded-2xl p-8 border border-border shadow-sm h-full group-hover:shadow-lg group-hover:border-primary/20 transition-all">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6">
                  <Zap className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-heading text-xl text-primary mb-3">{t('howItWorks.step3Title')}</h3>
                <p className="text-body text-muted-foreground">
                  {t('howItWorks.step3Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-primary mb-4">
              {t('features.title')}
            </h2>
            <p className="text-body text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield className="w-6 h-6" />,
                title: t('features.feature1Title'),
                description: t('features.feature1Desc')
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: t('features.feature2Title'),
                description: t('features.feature2Desc')
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: t('features.feature3Title'),
                description: t('features.feature3Desc')
              },
              {
                icon: <ArrowRightLeft className="w-6 h-6" />,
                title: t('features.feature4Title'),
                description: t('features.feature4Desc')
              },
              {
                icon: <Store className="w-6 h-6" />,
                title: t('features.feature5Title'),
                description: t('features.feature5Desc')
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: t('features.feature6Title'),
                description: t('features.feature6Desc')
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/20 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-heading text-lg text-primary mb-2">{feature.title}</h3>
                <p className="text-body text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-display text-4xl md:text-5xl text-accent mb-2">{t('stats.stat1Value')}</p>
              <p className="text-body text-primary-foreground/80">{t('stats.stat1Label')}</p>
            </div>
            <div>
              <p className="text-display text-4xl md:text-5xl text-accent mb-2">{t('stats.stat2Value')}</p>
              <p className="text-body text-primary-foreground/80">{t('stats.stat2Label')}</p>
            </div>
            <div>
              <p className="text-display text-4xl md:text-5xl text-accent mb-2">{t('stats.stat3Value')}</p>
              <p className="text-body text-primary-foreground/80">{t('stats.stat3Label')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-primary mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-body text-lg text-muted-foreground mb-10">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-base font-semibold group">
                {t('cta.registerMerchant')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="h-14 px-8 text-base font-semibold">
                {t('cta.signInDashboard')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/logo/logoCircle.png"
                alt="LokaPay"
                width={32}
                height={32}
                className="rounded-full opacity-90"
              />
              <span className="font-bold text-lg tracking-tight">LokaPay</span>
            </div>
            <p className="text-sm text-primary-foreground/60">
              &copy; {new Date().getFullYear()} {t('footer.copyright')}
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Language Switcher */}
      <FloatingLanguageSwitcher />
    </div>
  )
}
