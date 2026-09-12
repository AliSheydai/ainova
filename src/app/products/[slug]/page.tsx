import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { FulfillmentService } from '@/lib/fulfillment/order-fulfillment'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingFooter } from '@/components/landing/landing-footer'
import { ProductBuyCard } from '@/components/product/product-buy-card'
import { MarkdownView } from '@/components/ui/markdown-view'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  ShieldCheck,
  Check,
  Zap,
  ArrowRight,
  Package,
  Clock,
  HelpCircle,
} from 'lucide-react'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const params = await props.params
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  })

  if (!product || product.status === 'ARCHIVED') {
    return {
      title: 'محصول یافت نشد',
    }
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

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      plans: {
        where: { active: true },
        orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
      },
    },
  })

  if (!product || product.status === 'ARCHIVED') {
    notFound()
  }

  const [stock, purchaseCount, enrichedPlans] = await Promise.all([
    FulfillmentService.getProductStock(product.id),
    FulfillmentService.getProductPurchaseCount(product.id),
    Promise.all(
      (product.plans || []).map(async (plan) => {
        const planStock = await FulfillmentService.getPlanStock(plan.id)
        return {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
          fulfillmentType: plan.fulfillmentType,
          stock: planStock,
        }
      })
    ),
  ])

  const defaultFeatures = [
    'فعال‌سازی رسمی و قانونی روی اکانت شخصی شما',
    'تحویل آنی و خودکار بلافاصله پس از پرداخت',
    'بدون نیاز به ارسال کلمه عبور یا اطلاعات ورود حساب',
    'پشتیبانی همه‌روزه توسط کارشناسان فنی',
    'تضمین بازگشت وجه در صورت بروز هرگونه مشکل فعال‌سازی',
  ]

  const productFeatures =
    Array.isArray(product.features) && (product.features as string[]).length > 0
      ? (product.features as string[])
      : defaultFeatures

  return (
    <div className='flex min-h-svh flex-col bg-background text-foreground' dir='rtl'>
      <LandingHeader />

      <main className='flex-1 py-8 md:py-14'>
        <div className='container mx-auto px-4 sm:px-6 max-w-6xl'>
          {/* Breadcrumb */}
          <nav className='flex items-center gap-2 text-xs text-muted-foreground mb-6 sm:mb-8'>
            <Link href='/' className='hover:text-foreground transition-colors'>
              صفحه اصلی
            </Link>
            <span>/</span>
            <Link href='/#products' className='hover:text-foreground transition-colors'>
              محصولات
            </Link>
            <span>/</span>
            <span className='text-foreground font-semibold truncate'>
              {product.title}
            </span>
          </nav>

          {/* Main Hero Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start'>
            {/* Left/Middle: Product Details */}
            <div className='lg:col-span-7 space-y-6 sm:space-y-8'>
              <div className='space-y-3'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge className='bg-primary/10 text-primary border-primary/25 text-xs px-2.5 py-0.5'>
                    <Sparkles className='size-3 me-1' />
                    اشتراک ویژه
                  </Badge>
                  {stock > 0 ? (
                    <Badge variant='outline' className='text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs'>
                      آماده تحویل آنی
                    </Badge>
                  ) : (
                    <Badge variant='outline' className='text-rose-500 border-rose-500/30 text-xs'>
                      اتمام موجودی موقت
                    </Badge>
                  )}
                </div>

                <h1 className='text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight'>
                  {product.title}
                </h1>

                {product.shortDescription && (
                  <p className='text-sm sm:text-base text-muted-foreground leading-relaxed'>
                    {product.shortDescription}
                  </p>
                )}
              </div>

              {/* Product Visual / Image */}
              <div className='relative rounded-2xl overflow-hidden border border-border/60 bg-gradient-to-br from-primary/10 via-muted/30 to-background p-4 sm:p-6 flex items-center justify-center shadow-inner'>
                {product.image ? (
                  <div className='relative w-full aspect-16/9 max-w-lg rounded-xl overflow-hidden shadow-md border border-border/50 bg-card'>
                    <img
                      src={product.image}
                      alt={product.title}
                      className='w-full h-full object-cover transition-transform duration-300 hover:scale-102'
                      loading='lazy'
                    />
                  </div>
                ) : (
                  <div className='text-center space-y-3 py-6'>
                    <div className='size-20 sm:size-24 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mx-auto shadow-md border border-primary/20'>
                      <Package className='size-10 sm:size-12' />
                    </div>
                    <div className='text-xs font-semibold text-muted-foreground'>
                      {product.title}
                    </div>
                  </div>
                )}
              </div>

              {/* Full Description */}
              {product.description && (
                <div className='space-y-3 pt-2'>
                  <h2 className='text-base sm:text-lg font-bold text-foreground flex items-center gap-2'>
                    <span>توضیحات و مشخصات محصول</span>
                  </h2>
                  <div className='rounded-xl bg-muted/20 border border-border/50 p-4 sm:p-6'>
                    <MarkdownView content={product.description} />
                  </div>
                </div>
              )}

              {/* Key Features List */}
              <div className='space-y-3 pt-2'>
                <h2 className='text-base sm:text-lg font-bold text-foreground'>
                  مزایا و ویژگی‌های این اشتراک
                </h2>
                <ul className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm'>
                  {productFeatures.map((feat, i) => (
                    <li
                      key={i}
                      className='flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border/50 text-foreground shadow-xs'
                    >
                      <Check className='size-4 text-primary shrink-0' />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Sticky Buy Box Card */}
            <div className='lg:col-span-5 lg:sticky lg:top-24'>
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
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}
