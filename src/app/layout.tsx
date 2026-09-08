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
  title: 'Google AI Pro — خرید و فعال‌سازی',
  description:
    'Google AI Pro را روی حساب Google خودتان فعال کنید. تحویل سریع پس از پرداخت، بدون نیاز به ارسال رمز عبور.',
  keywords: ['Google AI Pro', 'Gemini', 'هوش مصنوعی گوگل', 'خرید Google AI'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='fa' dir='rtl' className={cn(vazirmatn.variable, 'font-sans')} suppressHydrationWarning>
      <body className='min-h-svh w-full bg-background font-sans text-foreground antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
