export default function CheckoutLoading() {
  return (
    <div
      className='min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 animate-pulse'
      dir='rtl'
      role='status'
      aria-live='polite'
    >
      <span className='sr-only'>در حال بارگذاری فرم تسویه حساب و مشخصات سفارش...</span>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header skeleton */}
        <div className='flex items-center justify-between pb-6 border-b border-border'>
          <div className='h-8 w-40 bg-muted rounded-lg' />
          <div className='h-8 w-24 bg-muted rounded-xl' />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4'>
          {/* Form left/main skeleton */}
          <div className='lg:col-span-7 space-y-6'>
            <div className='bg-card border border-border rounded-2xl p-6 space-y-4'>
              <div className='h-6 w-32 bg-muted rounded' />
              <div className='space-y-3'>
                <div className='h-11 w-full bg-muted rounded-xl' />
                <div className='h-11 w-full bg-muted rounded-xl' />
                <div className='h-11 w-full bg-muted rounded-xl' />
              </div>
            </div>

            <div className='bg-card border border-border rounded-2xl p-6 space-y-4'>
              <div className='h-6 w-36 bg-muted rounded' />
              <div className='h-12 w-full bg-muted rounded-xl' />
            </div>
          </div>

          {/* Order summary right skeleton */}
          <div className='lg:col-span-5 space-y-6'>
            <div className='bg-card border border-border rounded-2xl p-6 space-y-5'>
              <div className='h-6 w-28 bg-muted rounded' />
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <div className='h-4 w-20 bg-muted rounded' />
                  <div className='h-4 w-24 bg-muted rounded' />
                </div>
                <div className='flex justify-between'>
                  <div className='h-4 w-16 bg-muted rounded' />
                  <div className='h-4 w-20 bg-muted rounded' />
                </div>
                <div className='pt-3 border-t border-border flex justify-between'>
                  <div className='h-6 w-24 bg-muted rounded' />
                  <div className='h-6 w-32 bg-muted rounded' />
                </div>
              </div>
              <div className='h-12 w-full bg-primary/20 rounded-xl' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
