import type { Metadata } from 'next'
import { Vazirmatn } from 'next/font/google'
import '@/styles/index.css'
import { Providers } from '@/components/providers'
import { cn } from '@/lib/utils'

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'جمینای — خرید و فعال‌سازی اشتراک هوش مصنوعی گوگل',
  description:
    'اشتراک جمینای را روی حساب گوگل خودتان فعال کنید. دسترسی ۱۸ ماهه، تحویل فوری پس از پرداخت، بدون نیاز به ارسال رمز عبور.',
  keywords: ['جمینای', 'هوش مصنوعی گوگل', 'خرید جمینای', 'اشتراک جمینای', 'گوگل وان'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='fa' dir='rtl' className={cn(vazirmatn.variable, vazirmatn.className, 'font-sans')} suppressHydrationWarning>
      <body className={cn(vazirmatn.className, 'min-h-svh w-full bg-background font-sans text-foreground antialiased')} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
