import type { Metadata } from 'next'
import { LandingHeader } from '@/components/landing/landing-header'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { SecuritySection } from '@/components/landing/security-section'
import { FaqSection } from '@/components/landing/faq-section'
import { FinalCtaSection } from '@/components/landing/final-cta-section'
import { LandingFooter } from '@/components/landing/landing-footer'

export const metadata: Metadata = {
  title: 'جمینای — اشتراک اختصاصی ۱۸ ماهه هوش مصنوعی گوگل',
  description:
    'اشتراک پیشرفته جمینای را روی حساب گوگل شخصی خودتان فعال کنید. دسترسی ۱۸ ماهه، تحویل فوری پس از پرداخت، کاملاً امن و بدون نیاز به رمز عبور.',
}

// Fetch product price from API (server component)
async function getProductPrice(): Promise<string> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/products`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json()
    const plan = data?.plans?.[0]
    if (plan?.price) {
      return new Intl.NumberFormat('fa-IR').format(plan.price) + ' تومان'
    }
  } catch {
    // fallback price
  }
  return '۳۹۰،۰۰۰ تومان'
}

export default async function LandingPage() {
  const price = await getProductPrice()

  return (
    <div className='flex min-h-svh flex-col'>
      <LandingHeader />
      <main className='flex-1'>
        <HeroSection price={price} />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection price={price} />
        <SecuritySection />
        <FaqSection />
        <FinalCtaSection price={price} />
      </main>
      <LandingFooter />
    </div>
  )
}
