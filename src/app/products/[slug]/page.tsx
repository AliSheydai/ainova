import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingFooter } from '@/components/landing/landing-footer'
import { ProductBuyCard } from '@/components/product/product-buy-card'
import { ProductDetailVisual } from '@/components/product/product-detail-visual'
import { MarkdownView } from '@/components/ui/markdown-view'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronLeft, ShieldCheck, Zap, Clock } from 'lucide-react'
import { StickyMobileCta } from '@/components/product/sticky-mobile-cta'

export const revalidate = 60

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

const getProductBySlug = cache(async (rawSlug: string) => {
  if (!rawSlug) return null
  const decodedSlug = decodeURIComponent(rawSlug)
  return await prisma.product.findFirst({
    where: {
      OR: [{ slug: rawSlug }, { slug: decodedSlug }],
    },
    include: {
      plans: {
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
      },
    },
  })
})

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const params = await props.params
  const product = await getProductBySlug(params.slug)

  if (!product || product.status === 'ARCHIVED') {
    return { title: 'محصول یافت نشد' }
  }

  const title = `${product.title} — خرید با تحویل فوری`
  const description =
    product.shortDescription ||
    product.description?.slice(0, 160) ||
    'خرید اشتراک اختصاصی و رسمی با فعال‌سازی آنی و پشتیبانی ۲۴ ساعته.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: product.image ? [product.image] : undefined,
    },
  }
}

export default async function ProductDetailPage(props: ProductPageProps) {
  const params = await props.params
  const slug = params.slug

  const product = await getProductBySlug(slug)

  if (!product || product.status === 'ARCHIVED') {
    notFound()
  }

  const metricsMap = await FulfillmentService.batchGetProductsStockAndPurchases([product])
  const metrics = metricsMap.get(product.id)
  const stock = metrics?.stock ?? 0
  const purchaseCount = metrics?.purchaseCount ?? 0

  const enrichedPlans = (product.plans || []).map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    duration: plan.duration,
    fulfillmentType: plan.fulfillmentType,
    stock: metrics?.planStocks[plan.id] ?? 0,
  }))

  const productFeatures =
    Array.isArray(product.features) && (product.features as string[]).length > 0
      ? (product.features as string[])
      : null

  const hasPreCreatedPlan = enrichedPlans.some((p) => p.fulfillmentType === 'PRE_CREATED_ACCOUNT')
  const isAvailable = stock > 0 || hasPreCreatedPlan

  return (
    <div className='flex min-h-svh flex-col bg-background text-foreground' dir='rtl'>
      <LandingHeader />

      <main className='flex-1 py-6 md:py-10'>
        <div className='container mx-auto px-4 sm:px-6 max-w-5xl'>

          {/* Breadcrumb */}
          <nav aria-label='مسیر جاری' className='mb-6 flex items-center gap-1.5 text-xs text-muted-foreground font-sans'>
            <Link href='/' className='hover:text-foreground transition-colors'>
              خانه
            </Link>
            <ChevronLeft className='size-3 shrink-0' />
            <Link href='/products' className='hover:text-foreground transition-colors'>
              محصولات
            </Link>
            <ChevronLeft className='size-3 shrink-0' />
            <span className='truncate text-foreground font-medium'>{product.title}</span>
          </nav>

          {/* Main Grid: Image (right) + Content (left) */}
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12'>

            {/* Column 1: Product Image */}
            <div className='lg:sticky lg:top-24 lg:self-start'>
              <ProductDetailVisual image={product.image} title={product.title} />
            </div>

            {/* Column 2: Content + Buy Section */}
            <div className='space-y-8'>

              {/* Title & Status */}
              <div className='space-y-3'>
                {isAvailable ? (
                  <Badge className='bg-primary/8 text-primary border-primary/20 text-xs'>
                    آماده تحویل آنی
                  </Badge>
                ) : (
                  <Badge variant='outline' className='text-destructive/80 border-destructive/20 text-xs'>
                    اتمام موجودی موقت
                  </Badge>
                )}

                <h1 className='text-xl font-bold leading-snug tracking-tight text-foreground sm:text-2xl lg:text-3xl'>
                  {product.title}
                </h1>

                {product.shortDescription && (
                  <p className='text-sm leading-relaxed text-muted-foreground'>
                    {product.shortDescription}
                  </p>
                )}
              </div>

              {/* Buy Section (inline) */}
              <ProductBuyCard
                productId={product.id}
                productTitle={product.title}
                slug={product.slug}
                price={product.price}
                stock={stock}
                purchaseCount={purchaseCount}
                shortDescription={product.shortDescription}
                plans={enrichedPlans}
              />

              {/* Divider */}
              <hr className='border-border/50' />

              {/* Full Description */}
              {product.description && (
                <div className='space-y-3'>
                  <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                    توضیحات محصول
                  </h2>
                  <div className='prose-sm text-sm leading-relaxed text-foreground/90'>
                    <MarkdownView content={product.description} />
                  </div>
                </div>
              )}

              {/* Features List — only if product has custom features */}
              {productFeatures && (
                <>
                  <hr className='border-border/50' />
                  <div className='space-y-3'>
                    <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                      ویژگی‌ها
                    </h2>
                    <ul className='space-y-2'>
                      {productFeatures.map((feat, i) => (
                        <li key={i} className='flex items-start gap-2.5 text-sm text-foreground/85'>
                          <Check className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {/* Trust Bar */}
              <hr className='border-border/50' />
              <div className='flex flex-wrap gap-x-6 gap-y-2.5 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1.5'>
                  <ShieldCheck className='size-3.5 shrink-0' />
                  فعال‌سازی قانونی و رسمی
                </span>
                <span className='flex items-center gap-1.5'>
                  <Zap className='size-3.5 shrink-0' />
                  تحویل خودکار پس از پرداخت
                </span>
                <span className='flex items-center gap-1.5'>
                  <Clock className='size-3.5 shrink-0' />
                  پشتیبانی همه‌روزه
                </span>
              </div>

            </div>
          </div>
        </div>
      </main>

      <LandingFooter />

      {/* Sticky Mobile CTA — only visible on mobile when buy button is out of view */}
      <StickyMobileCta
        price={enrichedPlans[0]?.price ?? product.price}
        isAvailable={isAvailable}
        slug={product.slug}
        planId={enrichedPlans[0]?.id}
      />
    </div>
  )
}
