export default function ProductDetailLoading() {
  return (
    <div
      className='min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 animate-pulse'
      dir='rtl'
      role='status'
      aria-live='polite'
    >
      <span className='sr-only'>در حال بارگذاری اطلاعات محصول و پلن‌ها...</span>
      <div className='max-w-5xl mx-auto space-y-8'>
        {/* Breadcrumb skeleton */}
        <div className='flex gap-2 items-center'>
          <div className='h-4 w-16 bg-muted rounded' />
          <div className='h-4 w-4 bg-muted rounded' />
          <div className='h-4 w-32 bg-muted rounded' />
        </div>

        {/* Product top section: image + summary */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-8'>
          <div className='md:col-span-5'>
            <div className='aspect-square w-full bg-muted rounded-3xl' />
          </div>
          <div className='md:col-span-7 space-y-4 flex flex-col justify-center'>
            <div className='h-9 w-3/4 bg-muted rounded-xl' />
            <div className='h-5 w-1/2 bg-muted/70 rounded' />
            <div className='h-20 w-full bg-muted/40 rounded-2xl' />
            <div className='h-12 w-48 bg-primary/20 rounded-2xl mt-4' />
          </div>
        </div>

        {/* Plans section skeleton */}
        <div className='pt-8 space-y-4'>
          <div className='h-7 w-40 bg-muted rounded-lg' />
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='bg-card border border-border p-6 rounded-3xl space-y-4'>
                <div className='h-6 w-32 bg-muted rounded' />
                <div className='h-8 w-24 bg-muted rounded' />
                <div className='space-y-2 pt-2'>
                  <div className='h-4 w-full bg-muted/60 rounded' />
                  <div className='h-4 w-4/5 bg-muted/60 rounded' />
                </div>
                <div className='h-11 w-full bg-muted rounded-xl pt-2' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
