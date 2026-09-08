import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center p-6 text-center'>
      <h1 className='text-6xl font-bold tracking-tight text-primary'>۴۰۴</h1>
      <h2 className='mt-4 text-2xl font-semibold'>صفحه مورد نظر یافت نشد</h2>
      <p className='mt-2 max-w-md text-sm text-muted-foreground'>
        صفحه‌ای که به دنبال آن هستید وجود ندارد یا منتقل شده است.
      </p>
      <Button asChild className='mt-6'>
        <Link href='/'>بازگشت به داشبورد</Link>
      </Button>
    </div>
  )
}
