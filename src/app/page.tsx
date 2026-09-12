import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { LandingHeader } from '@/components/landing/landing-header'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { HowItWorksSection } from '@/components/landing/how-it-works-section'
import { SecuritySection } from '@/components/landing/security-section'
import { FaqSection } from '@/components/landing/faq-section'
import { FinalCtaSection } from '@/components/landing/final-cta-section'
import { LandingFooter } from '@/components/landing/landing-footer'
import { ProductsShowcaseSection } from '@/components/landing/products-showcase-section'

export const metadata: Metadata = {
  title: 'آینوا (AiNova) | فروشگاه رسمی اشتراک‌های هوش مصنوعی و دیجیتال',
  description:
    'خرید مطمئن و قانونی انواع اشتراک‌های هوش مصنوعی بین‌المللی (Google AI Pro، ابزارهای تولید محتوا و فضای ابری) با فعال‌سازی روی حساب شخصی، تحویل آنی و بدون نیاز به رمز عبور.',
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان'
}

async function getProductsData() {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE', active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    const enriched = await Promise.all(
      products.map(async (prod) => {
        const [stock, purchaseCount] = await Promise.all([
          FulfillmentService.getProductStock(prod.id),
          FulfillmentService.getProductPurchaseCount(prod.id),
        ])
        return {
          id: prod.id,
          title: prod.title || prod.name,
          name: prod.name,
          slug: prod.slug,
          shortDescription: prod.shortDescription,
          price: prod.price,
          stock,
          purchaseCount,
          fulfillmentType: prod.fulfillmentType,
        }
      })
    )

    return enriched
  } catch (error) {
    console.error('Error fetching landing products:', error)
    return []
  }
}

export default async function LandingPage() {
  const products = await getProductsData()
  const primaryProduct = products.find((p) => p.slug === 'google-ai-pro') || products[0]
  const formattedPrice = primaryProduct ? formatPrice(primaryProduct.price) : '۳۹۰،۰۰۰ تومان'

  return (
    <div className='flex min-h-svh flex-col' dir='rtl'>
      <LandingHeader />
      <main className='flex-1'>
        <HeroSection price={formattedPrice} />
        {/* Dynamic Products Showcase: displays all active products */}
        <ProductsShowcaseSection products={products} />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection
          price={formattedPrice}
          productTitle={primaryProduct?.title}
          productSlug={primaryProduct?.slug}
        />
        <SecuritySection />
        <FaqSection />
        <FinalCtaSection price={formattedPrice} />
      </main>
      <LandingFooter />
    </div>
  )
}
