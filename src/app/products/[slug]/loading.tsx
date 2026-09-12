export default function ProductDetailLoading() {
  return (
    <div
      className='min-h-screen bg-background py-6 px-4 sm:px-6 animate-pulse'
      dir='rtl'
      role='status'
      aria-live='polite'
    >
      <span className='sr-only'>در حال بارگذاری اطلاعات محصول...</span>

      <div className='mx-auto max-w-5xl space-y-6'>
        {/* Breadcrumb skeleton */}
        <div className='flex items-center gap-2'>
          <div className='h-3 w-12 rounded bg-muted' />
          <div className='h-3 w-3 rounded bg-muted' />
          <div className='h-3 w-16 rounded bg-muted' />
          <div className='h-3 w-3 rounded bg-muted' />
          <div className='h-3 w-24 rounded bg-muted' />
        </div>

        {/* Main grid */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12'>
          {/* Image column */}
          <div className='aspect-video w-full rounded-2xl bg-muted' />

          {/* Content column */}
          <div className='space-y-8'>
            {/* Title area */}
            <div className='space-y-3'>
              <div className='h-5 w-20 rounded-full bg-muted' />
              <div className='h-7 w-3/4 rounded-lg bg-muted' />
              <div className='h-4 w-full rounded bg-muted/70' />
              <div className='h-4 w-2/3 rounded bg-muted/60' />
            </div>

            {/* Buy section */}
            <div className='space-y-4 border-t border-border/40 pt-5'>
              <div className='flex items-end justify-between'>
                <div className='space-y-1'>
                  <div className='h-3 w-16 rounded bg-muted/60' />
                  <div className='h-7 w-32 rounded-lg bg-muted' />
                </div>
                <div className='h-5 w-20 rounded-full bg-muted/60' />
              </div>
              <div className='h-12 w-full rounded-xl bg-primary/15' />
              <div className='h-3 w-48 mx-auto rounded bg-muted/50' />
            </div>

            {/* Description */}
            <div className='space-y-3 border-t border-border/40 pt-6'>
              <div className='h-3 w-20 rounded bg-muted/50' />
              <div className='space-y-2'>
                <div className='h-4 w-full rounded bg-muted/50' />
                <div className='h-4 w-5/6 rounded bg-muted/40' />
                <div className='h-4 w-4/5 rounded bg-muted/40' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
