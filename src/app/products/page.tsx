import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Sparkles, ShieldCheck, Zap, Headphones } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingFooter } from '@/components/landing/landing-footer'
import { ProductsCatalog, type CatalogProduct } from '@/components/products/products-catalog'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'محصولات و اشتراک‌های هوش مصنوعی | آریوچت',
  description:
    'خرید مستقیم و قانونی انواع اشتراک‌های هوش مصنوعی بین‌المللی شامل جمینای (Google AI Pro)، چت‌جی‌پی‌تی (ChatGPT Plus)، کلود (Claude Pro) با فعال‌سازی روی اکانت شخصی و تحویل آنی.',
  openGraph: {
    title: 'محصولات و اشتراک‌های هوش مصنوعی | آریوچت',
    description:
      'آرشیو کامل اشتراک‌های هوش مصنوعی با فعال‌سازی قانونی، تحویل ۱۰۰٪ خودکار و گارانتی اصالت.',
    type: 'website',
  },
}

async function getProducts(): Promise<CatalogProduct[]> {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        plans: {
          where: { active: true },
          orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
        },
      },
    })

    const metricsMap = await FulfillmentService.batchGetProductsStockAndPurchases(products)

    const enriched: CatalogProduct[] = products.map((prod) => {
      const metrics = metricsMap.get(prod.id)
      const stock = metrics?.stock ?? 0
      const purchaseCount = metrics?.purchaseCount ?? 0
      const activePlans = prod.plans || []
      const minPrice =
        activePlans.length > 0
          ? Math.min(...activePlans.map((p) => p.price))
          : prod.price
      const firstPlan = activePlans[0]

      return {
        id: prod.id,
        title: prod.title,
        slug: prod.slug,
        shortDescription: prod.shortDescription,
        description: prod.description,
        price: prod.price,
        minPrice,
        hasMultiplePlans: activePlans.length > 1,
        image: prod.image,
        stock,
        purchaseCount,
        fulfillmentType: firstPlan?.fulfillmentType || 'ACTIVATION_LINK',
        features: prod.features as string[] | null,
        plans: activePlans.map((p) => ({
          id: p.id,
          name: p.name,
          duration: p.duration,
          price: p.price,
          fulfillmentType: p.fulfillmentType,
          stock: metrics?.planStocks[p.id] ?? 0,
        })),
      }
    })

    return enriched
  } catch (error) {
    console.error('Error fetching catalog products:', error)
    return []
  }
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className='flex min-h-svh flex-col bg-background text-foreground' dir='rtl'>
      <LandingHeader />

      <main className='flex-1 py-6 md:py-10'>
        <div className='container mx-auto px-4 sm:px-6 max-w-6xl'>
          {/* Breadcrumb: خانه / محصولات */}
          <nav
            aria-label='مسیر جاری'
            className='mb-6 flex items-center gap-1.5 text-xs text-muted-foreground font-sans'
          >
            <Link href='/' className='hover:text-foreground transition-colors'>
              خانه
            </Link>
            <ChevronLeft className='size-3 shrink-0' />
            <span className='text-foreground font-medium'>محصولات</span>
          </nav>

          {/* Page Hero Header */}
          <div className='mb-8 sm:mb-10 text-center max-w-2xl mx-auto'>
            <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold mb-3'>
              <Sparkles className='size-3.5' />
              <span>فروشگاه تخصصی سرویس‌های هوش مصنوعی</span>
            </div>
            <h1 className='text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight'>
              آرشیو کامل محصولات و اشتراک‌ها
            </h1>
            <p className='text-xs sm:text-sm text-muted-foreground mt-2.5 leading-relaxed'>
              دسترسی قانونی و مستقیم به برترین هوش‌های مصنوعی جهان؛ فعال‌سازی فوری، تضمین اصالت و بدون نیاز به اطلاعات حساس حساب کاربری.
            </p>

            {/* Quick feature highlights */}
            <div className='mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs text-muted-foreground'>
              <div className='flex items-center gap-1.5'>
                <Zap className='size-3.5 text-primary shrink-0' />
                <span>تحویل ۱۰۰٪ آنی</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <ShieldCheck className='size-3.5 text-primary shrink-0' />
                <span>ضمانت اصالت و گارانتی</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <Headphones className='size-3.5 text-primary shrink-0' />
                <span>پشتیبانی همیشگی</span>
              </div>
            </div>
          </div>

          {/* Catalog with Search, Filters, Grid & Pagination */}
          <ProductsCatalog initialProducts={products} />
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
