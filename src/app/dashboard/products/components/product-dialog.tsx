import React from 'react'
import {
  ShoppingBag,
  Loader2,
  Plus,
  Minus,
  UploadCloud,
  Trash2,
  Link2,
  CheckCircle2,
  Video,
  Film,
  PlayCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { parseVideoUrl } from '@/lib/video-utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  toEnglishDigits,
  toPersianDigits,
  formatNumberWithCommas,
  numberToWordsPersian,
} from '@/lib/persian-utils'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  submitting: boolean
  formProdTitle: string
  setFormProdTitle: (v: string) => void
  formProdSlug: string
  setFormProdSlug: (v: string) => void
  formProdShortDesc: string
  setFormProdShortDesc: (v: string) => void
  formProdDesc: string
  setFormProdDesc: (v: string) => void
  formProdPrice: string
  setFormProdPrice: (v: string) => void
  formProdImage: string
  setFormProdImage: (v: string) => void
  formProdVideoUrl: string
  setFormProdVideoUrl: (v: string) => void
  formProdSortOrder: string
  setFormProdSortOrder: (v: string) => void
  onSave: () => void
}

export function ProductDialog({
  open,
  onOpenChange,
  isEditing,
  submitting,
  formProdTitle,
  setFormProdTitle,
  formProdSlug,
  setFormProdSlug,
  formProdShortDesc,
  setFormProdShortDesc,
  formProdDesc,
  setFormProdDesc,
  formProdPrice,
  setFormProdPrice,
  formProdImage,
  setFormProdImage,
  formProdVideoUrl,
  setFormProdVideoUrl,
  formProdSortOrder,
  setFormProdSortOrder,
  onSave,
}: ProductDialogProps) {
  const formattedPriceDisplay = toPersianDigits(formatNumberWithCommas(formProdPrice))
  const priceInWords = numberToWordsPersian(formProdPrice)
  const sortOrderNum = parseInt(toEnglishDigits(formProdSortOrder).replace(/[^\d]/g, ''), 10) || 1

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cleaned = toEnglishDigits(raw).replace(/[^\d]/g, '')
    setFormProdPrice(cleaned)
  }

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = toEnglishDigits(e.target.value).replace(/[^\d]/g, '')
    setFormProdSortOrder(cleaned)
  }

  const incrementSortOrder = () => {
    setFormProdSortOrder(String(sortOrderNum + 1))
  }

  const decrementSortOrder = () => {
    if (sortOrderNum > 1) {
      setFormProdSortOrder(String(sortOrderNum - 1))
    }
  }

  // Upload States & Handlers
  const [uploading, setUploading] = React.useState(false)
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [uploadMode, setUploadMode] = React.useState<'upload' | 'url'>('upload')
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('لطفاً یک فایل تصویری معتبر انتخاب کنید.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success && data.url) {
        setFormProdImage(data.url)
        toast.success('تصویر محصول با موفقیت آپلود شد.')
      } else {
        toast.error(data.error || 'خطا در بارگذاری تصویر.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور هنگام آپلود فایل.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  // Video States & Handlers
  const [uploadingVideo, setUploadingVideo] = React.useState(false)
  const [isVideoDragOver, setIsVideoDragOver] = React.useState(false)
  const [videoUploadMode, setVideoUploadMode] = React.useState<'url' | 'upload'>('url')
  const videoFileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleVideoFileUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('لطفاً یک فایل ویدیویی معتبر انتخاب کنید (مانند MP4 یا WebM).')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('حجم ویدئو نباید بیشتر از ۵۰ مگابایت باشد.')
      return
    }

    setUploadingVideo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success && data.url) {
        setFormProdVideoUrl(data.url)
        toast.success('ویدئو محصول با موفقیت آپلود شد.')
      } else {
        toast.error(data.error || 'خطا در بارگذاری ویدئو.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور هنگام آپلود فایل ویدئو.')
    } finally {
      setUploadingVideo(false)
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = ''
      }
    }
  }

  const parsedVideo = React.useMemo(() => {
    return parseVideoUrl(formProdVideoUrl)
  }, [formProdVideoUrl])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl p-4 sm:p-6 max-h-[90vh] flex flex-col'>
        <DialogHeader className='pb-3 border-b border-border/50 pe-7 shrink-0'>
          <div className='flex items-center gap-2.5'>
            <div className='size-8 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center'>
              <ShoppingBag className='size-4' />
            </div>
            <div className='min-w-0 text-start'>
              <DialogTitle className='text-sm sm:text-base font-bold'>
                {isEditing ? 'ویرایش مشخصات محصول' : 'ایجاد محصول جدید'}
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                مشخصات کلی محصول و دسته‌بندی فروشگاه را مشخص فرمایید.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-3.5 py-1 sm:py-2 overflow-y-auto flex-1 pe-1'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <span className='text-xs font-medium text-foreground block mb-1'>
                عنوان رسمی محصول: <span className='text-rose-500'>*</span>
              </span>
              <Input
                value={formProdTitle}
                onChange={(e) => setFormProdTitle(e.target.value)}
                placeholder='مثال: اکانت Google AI Pro'
                className='text-xs h-9 rounded-xl'
              />
            </div>

            <div>
              <span className='text-xs font-medium text-foreground block mb-1'>
                نامک یکتا (Slug): <span className='text-rose-500'>*</span>
              </span>
              <Input
                value={formProdSlug}
                onChange={(e) => setFormProdSlug(e.target.value)}
                placeholder='google-ai-pro'
                className='text-xs h-9 rounded-xl font-mono'
                dir='ltr'
              />
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <div>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-xs font-medium text-foreground block truncate'>
                  قیمت پایه / شروع از (تومان):
                </span>
                {formProdPrice && !isNaN(parseInt(formProdPrice, 10)) && (
                  <span className='text-[10px] text-muted-foreground shrink-0'>
                    معادل <strong className='text-foreground font-sans'>{formattedPriceDisplay}</strong> تومان
                  </span>
                )}
              </div>
              <div className='relative flex items-center'>
                <Input
                  value={formattedPriceDisplay}
                  onChange={handlePriceChange}
                  placeholder='مثال: ۳۹۰,۰۰۰'
                  className='text-xs h-9 rounded-xl font-sans font-bold pe-14'
                  dir='rtl'
                />
                <div className='absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none'>
                  <span className='text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md'>
                    تومان
                  </span>
                </div>
              </div>
              {priceInWords ? (
                <div className='mt-1 flex items-center gap-1 text-[11px] text-primary font-medium'>
                  <span>{priceInWords} تومان</span>
                </div>
              ) : null}
            </div>

            <div>
              <span className='text-xs font-medium text-foreground block mb-1'>
                اولویت نمایش (Sort Order):
              </span>
              <div className='flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 transition-all'>
                <button
                  type='button'
                  onClick={incrementSortOrder}
                  className='size-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted transition-colors border-e border-input/60 shrink-0 cursor-pointer'
                  title='افزایش اولویت'
                  aria-label='افزایش اولویت'
                >
                  <Plus className='size-3.5' />
                </button>
                <input
                  type='text'
                  inputMode='numeric'
                  value={toPersianDigits(formProdSortOrder)}
                  onChange={handleSortOrderChange}
                  placeholder='مثال: ۱'
                  className='flex-1 h-9 bg-transparent text-center font-sans text-xs text-foreground outline-none font-bold px-2'
                />
                <button
                  type='button'
                  onClick={decrementSortOrder}
                  disabled={sortOrderNum <= 1}
                  className='size-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 active:bg-muted transition-colors border-s border-input/60 shrink-0 disabled:opacity-30 disabled:pointer-events-none cursor-pointer'
                  title='کاهش اولویت'
                  aria-label='کاهش اولویت'
                >
                  <Minus className='size-3.5' />
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className='flex items-center justify-between mb-1.5'>
              <span className='text-xs font-medium text-foreground'>
                تصویر یا بنر محصول:
              </span>
              <button
                type='button'
                onClick={() => setUploadMode(uploadMode === 'upload' ? 'url' : 'upload')}
                className='text-[11px] text-primary hover:underline transition-all flex items-center gap-1 cursor-pointer'
              >
                {uploadMode === 'upload' ? (
                  <>
                    <Link2 className='size-3' />
                    <span>ورود مستقیم آدرس اینترنتی (URL)</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className='size-3' />
                    <span>آپلود مستقیم فایل</span>
                  </>
                )}
              </button>
            </div>

            {uploadMode === 'upload' ? (
              <div className='space-y-2'>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/jpeg,image/png,image/webp,image/gif,image/svg+xml'
                  className='hidden'
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0])
                    }
                  }}
                />

                {formProdImage ? (
                  <div className='flex items-center gap-3 p-2.5 rounded-xl border border-border/70 bg-muted/20'>
                    <div className='size-14 rounded-lg overflow-hidden border border-border bg-background shrink-0 flex items-center justify-center'>
                      <img
                        src={formProdImage}
                        alt='پیش‌نمایش تصویر محصول'
                        className='size-full object-cover'
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    </div>
                    <div className='min-w-0 flex-1 space-y-0.5'>
                      <div className='flex items-center gap-1 text-xs font-semibold text-foreground'>
                        <CheckCircle2 className='size-3.5 text-primary' />
                        <span>تصویر با موفقیت انتخاب شد</span>
                      </div>
                      <p className='text-[11px] font-mono text-muted-foreground truncate' dir='ltr'>
                        {formProdImage}
                      </p>
                    </div>
                    <div className='flex items-center gap-1 shrink-0'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className='h-8 text-xs px-2.5 rounded-lg'
                      >
                        {uploading ? (
                          <Loader2 className='size-3.5 animate-spin' />
                        ) : (
                          'تغییر تصویر'
                        )}
                      </Button>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        disabled={uploading}
                        onClick={() => setFormProdImage('')}
                        className='h-8 text-xs px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg'
                        title='حذف تصویر'
                      >
                        <Trash2 className='size-3.5' />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (!uploading) fileInputRef.current?.click()
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
                      isDragOver
                        ? 'border-primary bg-primary/5 scale-[0.99]'
                        : 'border-border/80 hover:border-primary/50 hover:bg-muted/30 bg-muted/10'
                    } ${uploading ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    <div className='flex flex-col items-center justify-center gap-1.5'>
                      <div className='size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center'>
                        {uploading ? (
                          <Loader2 className='size-5 animate-spin text-primary' />
                        ) : (
                          <UploadCloud className='size-5' />
                        )}
                      </div>
                      <div className='text-xs font-semibold text-foreground'>
                        {uploading ? (
                          <span>در حال آپلود و پردازش تصویر...</span>
                        ) : (
                          <span>برای انتخاب فایل کلیک کنید یا تصویر را به اینجا بکشید</span>
                        )}
                      </div>
                      <p className='text-[10px] text-muted-foreground'>
                        فرمت‌های مجاز: WebP، PNG، JPG، SVG (حداکثر ۵ مگابایت)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className='space-y-2'>
                <Input
                  value={formProdImage}
                  onChange={(e) => setFormProdImage(e.target.value)}
                  placeholder='https://... یا /images/product.png'
                  className='text-xs h-9 rounded-xl font-mono'
                  dir='ltr'
                />
                {formProdImage && (
                  <div className='flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-muted/20'>
                    <div className='size-10 rounded-md overflow-hidden border border-border bg-background shrink-0'>
                      <img
                        src={formProdImage}
                        alt='پیش‌نمایش'
                        className='size-full object-cover'
                      />
                    </div>
                    <span className='text-[11px] text-muted-foreground truncate' dir='ltr'>
                      {formProdImage}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Introduction Section */}
          <div className='p-3 rounded-xl border border-border/70 bg-muted/15 space-y-2.5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <Film className='size-3.5 text-primary' />
                <span className='text-xs font-semibold text-foreground'>
                  ویدئو معرفی محصول:
                </span>
                <span className='text-[10px] text-muted-foreground'>(اختیاری)</span>
              </div>
              <button
                type='button'
                onClick={() => setVideoUploadMode(videoUploadMode === 'upload' ? 'url' : 'upload')}
                className='text-[11px] text-primary hover:underline transition-all flex items-center gap-1 cursor-pointer'
              >
                {videoUploadMode === 'upload' ? (
                  <>
                    <Link2 className='size-3' />
                    <span>ورود لینک آپارات، یوتیوب یا مستقیم</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className='size-3' />
                    <span>آپلود مستقیم فایل ویدئو</span>
                  </>
                )}
              </button>
            </div>

            {videoUploadMode === 'upload' ? (
              <div className='space-y-2'>
                <input
                  ref={videoFileInputRef}
                  type='file'
                  accept='video/mp4,video/webm,video/ogg,video/quicktime'
                  className='hidden'
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleVideoFileUpload(e.target.files[0])
                    }
                  }}
                />

                {!formProdVideoUrl ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsVideoDragOver(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsVideoDragOver(false)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsVideoDragOver(false)
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleVideoFileUpload(e.dataTransfer.files[0])
                      }
                    }}
                    onClick={() => {
                      if (!uploadingVideo) videoFileInputRef.current?.click()
                    }}
                    className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all duration-200 ${
                      isVideoDragOver
                        ? 'border-primary bg-primary/5 scale-[0.99]'
                        : 'border-border/80 hover:border-primary/50 hover:bg-muted/30 bg-muted/10'
                    } ${uploadingVideo ? 'pointer-events-none opacity-70' : ''}`}
                  >
                    <div className='flex flex-col items-center justify-center gap-1'>
                      <div className='size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center'>
                        {uploadingVideo ? (
                          <Loader2 className='size-4 animate-spin text-primary' />
                        ) : (
                          <Video className='size-4' />
                        )}
                      </div>
                      <div className='text-xs font-medium text-foreground'>
                        {uploadingVideo ? (
                          <span>در حال آپلود و ذخیره فایل ویدئو...</span>
                        ) : (
                          <span>برای انتخاب فایل ویدئو کلیک کنید یا آن را به اینجا بکشید</span>
                        )}
                      </div>
                      <p className='text-[10px] text-muted-foreground'>
                        فرمت‌های مجاز: MP4، WebM (حداکثر ۵۰ مگابایت)
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className='space-y-1.5'>
                <Input
                  value={formProdVideoUrl}
                  onChange={(e) => setFormProdVideoUrl(e.target.value)}
                  placeholder='مثال: https://www.aparat.com/v/xyz یا یوتیوب یا لینک فایل MP4'
                  className='text-xs h-9 rounded-xl font-mono'
                  dir='ltr'
                />
                <p className='text-[10px] text-muted-foreground leading-relaxed'>
                  پشتیبانی از لینک ویدئوی آپارات، یوتیوب، یا آدرس مستقیم فایل MP4/WebM.
                </p>
              </div>
            )}

            {/* Video Preview Card if URL is present */}
            {formProdVideoUrl && (
              <div className='p-2.5 rounded-xl border border-border/80 bg-background/80 space-y-2'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-1.5 min-w-0'>
                    <PlayCircle className='size-3.5 text-primary shrink-0' />
                    <span className='text-xs font-medium text-foreground'>
                      پیش‌نمایش ویدئو:
                    </span>
                    {parsedVideo && (
                      <span className='text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md shrink-0'>
                        {parsedVideo.label}
                      </span>
                    )}
                  </div>
                  <div className='flex items-center gap-1 shrink-0'>
                    {videoUploadMode === 'upload' && (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={uploadingVideo}
                        onClick={() => videoFileInputRef.current?.click()}
                        className='h-7 text-[11px] px-2 rounded-lg'
                      >
                        {uploadingVideo ? <Loader2 className='size-3 animate-spin' /> : 'تغییر فایل'}
                      </Button>
                    )}
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      disabled={uploadingVideo}
                      onClick={() => setFormProdVideoUrl('')}
                      className='h-7 text-[11px] px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg'
                      title='حذف ویدئو'
                    >
                      <Trash2 className='size-3.5' />
                    </Button>
                  </div>
                </div>

                {/* Video Player Preview */}
                <div className='w-full aspect-video max-h-48 rounded-lg overflow-hidden border border-border bg-black/90 flex items-center justify-center'>
                  {parsedVideo?.type === 'aparat' || parsedVideo?.type === 'youtube' ? (
                    <iframe
                      src={parsedVideo.src}
                      title='پیش‌نمایش ویدئو'
                      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                      allowFullScreen
                      className='w-full h-full border-0'
                    />
                  ) : parsedVideo?.type === 'direct' ? (
                    <video
                      src={parsedVideo.src}
                      controls
                      playsInline
                      preload='metadata'
                      className='w-full h-full object-contain'
                    />
                  ) : (
                    <div className='text-center p-3 text-muted-foreground text-xs'>
                      لینک ویدئو وارد شده است اما منبع آن شناخته‌شده نیست.
                    </div>
                  )}
                </div>

                <p className='text-[10px] font-mono text-muted-foreground truncate' dir='ltr'>
                  {formProdVideoUrl}
                </p>
              </div>
            )}
          </div>

          <div>
            <span className='text-xs font-medium text-foreground block mb-1'>
              توضیح کوتاه (نمایش در کارت‌های ویترین):
            </span>
            <Input
              value={formProdShortDesc}
              onChange={(e) => setFormProdShortDesc(e.target.value)}
              placeholder='اشتراک ۱۸ ماهه هوش مصنوعی با ۲TB فضا'
              className='text-xs h-9 rounded-xl'
            />
          </div>

          <div>
            <div className='flex items-center justify-between mb-1'>
              <span className='text-xs font-medium text-foreground block'>
                توضیحات تکمیلی محصول:
              </span>
              {formProdDesc?.length > 0 && (
                <span className='text-[10px] text-muted-foreground'>
                  {toPersianDigits(formProdDesc.length)} کاراکتر
                </span>
              )}
            </div>
            <Textarea
              rows={4}
              value={formProdDesc}
              onChange={(e) => setFormProdDesc(e.target.value)}
              placeholder='توضیحات تفصیلی، مزایا و نکات مهم برای مشتری...'
              className='text-xs rounded-xl [field-sizing:fixed] h-28 max-h-28 min-h-28 resize-none overflow-y-auto leading-relaxed'
              style={{ fieldSizing: 'fixed' } as React.CSSProperties}
            />
          </div>
        </div>

        <DialogFooter className='pt-3 border-t border-border/50 flex flex-col-reverse sm:flex-row gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onOpenChange(false)}
            className='rounded-xl text-xs w-full sm:w-auto h-9'
          >
            انصراف
          </Button>
          <Button
            type='button'
            size='sm'
            disabled={submitting}
            aria-busy={submitting}
            onClick={onSave}
            className='rounded-xl text-xs font-semibold gap-1.5 w-full sm:w-auto h-9'
          >
            {submitting && <Loader2 className='size-3.5 animate-spin' aria-hidden='true' />}
            <span>{isEditing ? 'بروزرسانی محصول' : 'ایجاد محصول'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
