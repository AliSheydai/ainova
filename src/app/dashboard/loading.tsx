export default function DashboardLoading() {
  return (
    <div
      className='flex-1 p-4 md:p-6 space-y-6 animate-pulse'
      dir='rtl'
      role='status'
      aria-live='polite'
    >
      <span className='sr-only'>در حال بارگذاری اطلاعات داشبورد...</span>
      {/* Header skeleton */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='space-y-2'>
          <div className='h-8 w-48 bg-muted rounded-lg' />
          <div className='h-4 w-72 bg-muted/60 rounded' />
        </div>
        <div className='h-10 w-32 bg-muted rounded-xl' />
      </div>

      {/* KPI Cards skeleton */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className='bg-card border border-border p-5 rounded-2xl space-y-3'>
            <div className='flex justify-between items-center'>
              <div className='h-4 w-24 bg-muted rounded' />
              <div className='w-8 h-8 rounded-lg bg-muted' />
            </div>
            <div className='h-7 w-28 bg-muted rounded' />
            <div className='h-3 w-36 bg-muted/50 rounded' />
          </div>
        ))}
      </div>

      {/* Main content table skeleton */}
      <div className='bg-card border border-border rounded-2xl p-6 space-y-4'>
        <div className='flex justify-between items-center pb-3 border-b border-border'>
          <div className='h-5 w-36 bg-muted rounded' />
          <div className='h-9 w-48 bg-muted rounded-xl' />
        </div>
        <div className='space-y-3 pt-2'>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className='flex items-center justify-between py-2 border-b border-border/40'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 rounded-full bg-muted' />
                <div className='space-y-1.5'>
                  <div className='h-4 w-32 bg-muted rounded' />
                  <div className='h-3 w-20 bg-muted/50 rounded' />
                </div>
              </div>
              <div className='h-6 w-20 bg-muted rounded-full' />
              <div className='h-4 w-24 bg-muted rounded' />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
