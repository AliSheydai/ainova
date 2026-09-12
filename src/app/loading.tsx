import { Loader2 } from 'lucide-react'

export default function RootLoading() {
  return (
    <div
      className='min-h-[60vh] flex flex-col items-center justify-center gap-3 p-4'
      dir='rtl'
      role='status'
      aria-live='polite'
    >
      <div className='w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary'>
        <Loader2 className='w-6 h-6 animate-spin' aria-hidden='true' />
      </div>
      <p className='text-sm text-muted-foreground animate-pulse'>
        در حال بارگذاری اطلاعات...
      </p>
    </div>
  )
}
