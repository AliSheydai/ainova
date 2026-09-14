'use client'

import { useState } from 'react'
import {
  MessageSquare,
  Star,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatRelativeTime, toPersianDigits } from '@/lib/persian-utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface ApprovedReview {
  id: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
}

interface ProductReviewsProps {
  productId: string
  productTitle: string
  initialReviews: ApprovedReview[]
  initialStats: ReviewStats
}

const RATING_LABELS: Record<number, string> = {
  1: 'خیلی ضعیف',
  2: 'ضعیف',
  3: 'متوسط',
  4: 'خوب',
  5: 'عالی و رضایت‌بخش',
}

export function ProductReviews({
  productId,
  productTitle,
  initialReviews,
  initialStats,
}: ProductReviewsProps) {
  const [reviews] = useState<ApprovedReview[]>(initialReviews)
  const [stats] = useState<ReviewStats>(initialStats)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form State
  const [userName, setUserName] = useState('')
  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)
  const [errors, setErrors] = useState<{ userName?: string; comment?: string; form?: string }>({})

  const activeRating = hoveredRating ?? rating

  const handleOpenDialog = () => {
    setSubmittedSuccess(false)
    setErrors({})
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const trimmedName = userName.trim()
    const trimmedComment = comment.trim()
    const newErrors: { userName?: string; comment?: string; form?: string } = {}

    if (!trimmedName) {
      newErrors.userName = 'لطفاً نام یا نام مستعار خود را وارد کنید.'
    } else if (trimmedName.length < 2) {
      newErrors.userName = 'نام یا نام مستعار باید حداقل ۲ حرف باشد.'
    }

    if (!trimmedComment) {
      newErrors.comment = 'لطفاً متن نظر خود را بنویسید.'
    } else if (trimmedComment.length < 5) {
      newErrors.comment = 'متن نظر باید حداقل ۵ کاراکتر باشد.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          userName: trimmedName,
          rating,
          comment: trimmedComment,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setSubmittedSuccess(true)
        setUserName('')
        setComment('')
        setRating(5)
        toast.success('نظر شما ثبت شد و پس از بررسی و تایید مدیریت منتشر خواهد شد.')
      } else {
        setErrors({ form: data.error || 'خطا در ثبت نظر. لطفاً دوباره تلاش کنید.' })
      }
    } catch {
      setErrors({ form: 'خطای ارتباط با سرور. اینترنت خود را بررسی کنید.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className='space-y-6 pt-10 pb-6 border-t border-border/50' aria-label='نظرات کاربران'>
      {/* Header Section */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <MessageSquare className='size-5 text-primary shrink-0' />
            <h2 className='text-base sm:text-lg lg:text-xl font-bold text-foreground'>
              نظرات و دیدگاه‌های خریداران
            </h2>
          </div>
          <p className='text-xs sm:text-sm text-muted-foreground'>
            تجربه خریداران از کیفیت اشتراک و فعال‌سازی این محصول
          </p>
        </div>

        {/* Action button */}
        <Button
          onClick={handleOpenDialog}
          className='self-start sm:self-auto gap-1.5 text-xs sm:text-sm font-medium h-9 sm:h-10 px-4'
        >
          <Plus className='size-4' />
          <span>ثبت نظر جدید</span>
        </Button>
      </div>

      {/* Rating Stats Bar (only when reviews exist) */}
      {stats.totalReviews > 0 ? (
        <div className='flex flex-wrap items-center gap-4 sm:gap-6 p-4 rounded-xl bg-card border border-border/60 shadow-xs'>
          {/* Average Rating Big */}
          <div className='flex items-baseline gap-1.5'>
            <span className='text-2xl sm:text-3xl font-bold font-sans text-foreground'>
              {toPersianDigits(stats.averageRating)}
            </span>
            <span className='text-xs sm:text-sm text-muted-foreground font-sans'>از ۵</span>
          </div>

          {/* Stars visual */}
          <div className='flex items-center gap-1'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-4 ${
                  i < Math.round(stats.averageRating)
                    ? 'text-primary fill-primary'
                    : 'text-muted-foreground/30 fill-muted-foreground/10'
                }`}
              />
            ))}
          </div>

          {/* Review count */}
          <div className='text-xs text-muted-foreground font-sans border-s border-border/60 ps-4'>
            بر اساس {toPersianDigits(stats.totalReviews)} دیدگاه ثبت‌شده
          </div>

          {/* Verified tag */}
          {/* <div className='ms-auto hidden md:flex items-center gap-1.5 text-xs text-primary font-medium'>
            <ShieldCheck className='size-4' />
            <span>نظرات تاییدشده پس از بررسی مدیریت</span>
          </div> */}
        </div>
      ) : null}

      {/* Reviews List or Empty State */}
      {reviews.length === 0 ? (
        /* Empty State */
        <div className='text-center py-12 px-4 rounded-xl border border-dashed border-border/80 bg-card/50 space-y-3'>
          <div className='size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto'>
            <MessageSquare className='size-6' />
          </div>
          <div className='space-y-1 max-w-md mx-auto'>
            <h3 className='text-sm sm:text-base font-bold text-foreground'>
              هنوز نظری برای این محصول ثبت نشده است
            </h3>
            <p className='text-xs text-muted-foreground leading-relaxed'>
              آیا از این سرویس استفاده کرده‌اید؟ اولین نفری باشید که دیدگاه و تجربه ارزشمند خود را با دیگران به اشتراک می‌گذارد.
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleOpenDialog}
            className='gap-1.5 text-xs h-8 px-3.5 border-primary/30 text-primary hover:bg-primary/10'
          >
            <Plus className='size-3.5' />
            <span>ثبت اولین نظر</span>
          </Button>
        </div>
      ) : (
        /* Reviews Grid */
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4'>
          {reviews.map((r) => (
            <div
              key={r.id}
              className='p-4 sm:p-5 rounded-xl border border-border/60 bg-card hover:border-border transition-colors space-y-3'
            >
              {/* Review Card Header */}
              <div className='flex items-start justify-between gap-2'>
                <div className='flex items-center gap-2.5 min-w-0'>
                  <div className='size-8 sm:size-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs sm:text-sm shrink-0'>
                    {r.userName.slice(0, 1) || <User className='size-4' />}
                  </div>
                  <div className='min-w-0'>
                    <div className='text-xs sm:text-sm font-semibold text-foreground truncate'>
                      {r.userName}
                    </div>
                    <div className='text-[11px] text-muted-foreground font-sans flex items-center gap-1'>
                      <Clock className='size-3 shrink-0' />
                      <span>{formatRelativeTime(r.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className='flex items-center gap-0.5 shrink-0' aria-label={`امتیاز ${r.rating} از ۵`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${
                        i < r.rating
                          ? 'text-primary fill-primary'
                          : 'text-muted-foreground/30 fill-muted-foreground/10'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Comment Text */}
              <p className='text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words'>
                {r.comment}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Review Submission Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-md p-5 sm:p-6'>
          <DialogHeader className='text-start space-y-1.5'>
            <DialogTitle className='text-base sm:text-lg font-bold flex items-center gap-2 text-foreground'>
              <MessageSquare className='size-4 text-primary shrink-0' />
              <span>ثبت نظر برای {productTitle}</span>
            </DialogTitle>
            <DialogDescription className='text-xs text-muted-foreground'>
              دیدگاه و تجربه استفاده خود از این اشتراک را بنویسید.
            </DialogDescription>
          </DialogHeader>

          {submittedSuccess ? (
            /* Success Feedback State */
            <div className='py-6 text-center space-y-4'>
              <div className='size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto'>
                <CheckCircle2 className='size-8' />
              </div>
              <div className='space-y-1.5 max-w-sm mx-auto'>
                <h4 className='text-sm sm:text-base font-bold text-foreground'>
                  نظر شما با موفقیت دریافت شد
                </h4>
                <p className='text-xs sm:text-sm text-muted-foreground leading-relaxed'>
                  دیدگاه شما پس از بررسی و تایید توسط تیم مدیریت در این صفحه منتشر خواهد شد. از همراهی شما سپاسگزاریم!
                </p>
              </div>
              <Button
                onClick={() => setDialogOpen(false)}
                className='text-xs h-9 px-6 font-medium mt-2'
              >
                متوجه شدم
              </Button>
            </div>
          ) : (
            /* Review Submission Form */
            <form noValidate onSubmit={handleSubmit} className='space-y-4 pt-1'>
              {/* Information Notice */}
              <div className='p-3 rounded-lg bg-muted/40 border border-border/50 text-[11px] sm:text-xs text-muted-foreground flex items-start gap-2 leading-relaxed'>
                <Clock className='size-4 text-primary shrink-0 mt-0.5' />
                <span>
                  جهت حفظ کیفیت و محتوای مناسب، دیدگاه شما پس از بررسی و تأیید ادمین در صفحه محصول نمایش داده می‌شود.
                </span>
              </div>

              {/* Star Rating Picker */}
              <div className='space-y-1.5'>
                <label className='text-xs font-medium text-foreground block'>
                  امتیاز شما به این محصول:
                </label>
                <div className='flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20'>
                  <div className='flex items-center gap-1' onMouseLeave={() => setHoveredRating(null)}>
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starValue = i + 1
                      const isFilled = starValue <= activeRating
                      return (
                        <button
                          key={starValue}
                          type='button'
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoveredRating(starValue)}
                          className='p-1 rounded hover:scale-110 transition-transform focus:outline-none focus:ring-1 focus:ring-primary'
                          aria-label={`${starValue} ستاره`}
                        >
                          <Star
                            className={`size-5 sm:size-6 ${
                              isFilled
                                ? 'text-primary fill-primary'
                                : 'text-muted-foreground/30 fill-muted-foreground/10'
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>
                  <span className='text-xs font-medium text-foreground'>
                    {RATING_LABELS[activeRating] || ''}
                  </span>
                </div>
              </div>

              {/* User Name Input */}
              <div className='space-y-1.5'>
                <label htmlFor='review-user-name' className='text-xs font-medium text-foreground block'>
                  نام یا نام مستعار شما:
                </label>
                <Input
                  id='review-user-name'
                  placeholder='مثال: علی رضایی'
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value)
                    if (errors.userName) setErrors((prev) => ({ ...prev, userName: undefined }))
                  }}
                  maxLength={50}
                  aria-invalid={!!errors.userName}
                  className={cn(
                    'text-xs h-9 transition-colors',
                    errors.userName && 'border-destructive focus-visible:ring-destructive/30'
                  )}
                />
                {errors.userName && (
                  <p className='text-[11px] sm:text-xs text-destructive font-medium flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-150'>
                    <AlertCircle className='size-3.5 shrink-0' />
                    <span>{errors.userName}</span>
                  </p>
                )}
              </div>

              {/* Comment Textarea */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between text-xs'>
                  <label htmlFor='review-comment' className='font-medium text-foreground'>
                    متن نظر شما:
                  </label>
                  <span className='text-[11px] text-muted-foreground font-sans'>
                    {toPersianDigits(comment.length)} / ۵۰۰
                  </span>
                </div>
                <Textarea
                  id='review-comment'
                  placeholder='نظرتان درباره سرعت فعال‌سازی، کیفیت اکانت یا پشتیبانی را بنویسید...'
                  value={comment}
                  onChange={(e) => {
                    setComment(e.target.value)
                    if (errors.comment) setErrors((prev) => ({ ...prev, comment: undefined }))
                  }}
                  maxLength={500}
                  aria-invalid={!!errors.comment}
                  className={cn(
                    'text-xs h-24 sm:h-28 resize-none leading-relaxed transition-colors',
                    errors.comment && 'border-destructive focus-visible:ring-destructive/30'
                  )}
                />
                {errors.comment && (
                  <p className='text-[11px] sm:text-xs text-destructive font-medium flex items-center gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-150'>
                    <AlertCircle className='size-3.5 shrink-0' />
                    <span>{errors.comment}</span>
                  </p>
                )}
              </div>

              {/* General Form Error Message if any */}
              {errors.form && (
                <div className='text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-lg flex items-center gap-2'>
                  <AlertCircle className='size-4 shrink-0' />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className='flex items-center justify-end gap-2 pt-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                  className='text-xs h-9 px-4'
                >
                  انصراف
                </Button>
                <Button
                  type='submit'
                  size='sm'
                  disabled={submitting}
                  className='text-xs h-9 px-5 gap-1.5 font-medium'
                >
                  {submitting ? (
                    <>
                      <Loader2 className='size-3.5 animate-spin' />
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <span>ارسال نظر جهت بررسی</span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
