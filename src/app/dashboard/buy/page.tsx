'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Loader2, ShoppingCart, Sparkles, Package, Zap, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface ProductItem {
  id: string
  title: string
  name: string
  slug: string
  shortDescription: string | null
  description: string | null
  price: number
  stock: number
  purchaseCount: number
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان'
}

export default function BuyPage() {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (data.products) {
          setProducts(data.products)
        } else if (data.id) {
          setProducts([data])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleBuyProduct = async (product: ProductItem) => {
    setBuyingId(product.id)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, slug: product.slug }),
      })
      const data = await res.json()

      if (res.status === 401) {
        window.location.href = `/login?redirect=/dashboard/buy`
        return
      }

      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        toast.error(data.message || 'خطا در ثبت سفارش.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور. لطفاً دوباره تلاش کنید.')
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <>
      <Header>
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='flex flex-col gap-6 p-4 sm:p-6'>
        {/* Page title */}
        <div className='flex items-center gap-3'>
          <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10'>
            <ShoppingCart className='size-5 text-primary' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-foreground'>
              خرید و فعال‌سازی اشتراک‌های هوش مصنوعی
            </h1>
            <p className='text-xs sm:text-sm text-muted-foreground'>
              تحویل آنی و رسمی روی حساب شخصی بدون نیاز به پسورد
            </p>
          </div>
        </div>

        <Separator />

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='size-8 animate-spin text-primary' />
          </div>
        ) : products.length === 0 ? (
          <div className='py-16 text-center text-sm text-muted-foreground'>
            محصولی برای خرید در دسترس نیست. لطفاً بعداً مراجعه نمایید.
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {products.map((prod) => {
              const isAvailable = prod.stock > 0
              return (
                <Card
                  key={prod.id}
                  className='relative overflow-hidden border-border/70 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between gap-2 mb-2'>
                      <div className='size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold'>
                        <Package className='size-4' />
                      </div>
                      {isAvailable ? (
                        <Badge className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]'>
                          <Zap className='size-2.5 me-1' />
                          تحویل آنی
                        </Badge>
                      ) : (
                        <Badge variant='outline' className='text-rose-500 text-[10px]'>
                          موقتاً ناموجود
                        </Badge>
                      )}
                    </div>
                    <CardTitle className='text-base font-bold'>{prod.title || prod.name}</CardTitle>
                    {prod.shortDescription && (
                      <CardDescription className='text-xs line-clamp-2 mt-1'>
                        {prod.shortDescription}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className='pt-0 space-y-4'>
                    <div className='pt-3 border-t border-border/40 flex items-baseline justify-between'>
                      <span className='text-xs text-muted-foreground'>مبلغ اشتراک:</span>
                      <strong className='text-lg font-bold text-primary font-sans'>
                        {formatPrice(prod.price)}
                      </strong>
                    </div>

                    <div className='flex gap-2'>
                      <Button
                        className='flex-1 text-xs font-semibold'
                        disabled={buyingId === prod.id || !isAvailable}
                        onClick={() => handleBuyProduct(prod)}
                      >
                        {buyingId === prod.id ? (
                          <Loader2 className='size-4 animate-spin' />
                        ) : (
                          <span>خرید آنی</span>
                        )}
                      </Button>
                      <Link href={`/products/${prod.slug}`}>
                        <Button variant='outline' size='sm' className='text-xs px-2.5'>
                          <span>جزییات</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </Main>
    </>
  )
}
