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
  title: 'آریوچت — فروشگاه تخصصی اشتراک‌های هوش مصنوعی و دیجیتال',
  description:
    'خرید مطمئن و قانونی انواع اشتراک‌های هوش مصنوعی بین‌المللی (Google AI Pro، ChatGPT، Claude، ابزارهای تولید محتوا و فضای ابری) با فعال‌سازی روی حساب شخصی، تحویل آنی و بدون نیاز به رمز عبور.',
  keywords: [
    'آریوچت',
    'ArioChat',
    'خرید اشتراک هوش مصنوعی',
    'اشتراک جمینای',
    'Google AI Pro',
    'ChatGPT Plus',
    'Claude Pro',
    'فضای ابری گوگل وان',
    'اکانت هوش مصنوعی',
  ],
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
