'use client'

import { useEffect, useState } from 'react'
import {
  Settings,
  Phone,
  Send,
  Bot,
  Save,
  ShieldAlert,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
  HelpCircle,
  ToggleLeft,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Settings state
  const [supportPhone, setSupportPhone] = useState('')
  const [supportTelegram, setSupportTelegram] = useState('')
  const [botUsername, setBotUsername] = useState('')
  const [botDeeplink, setBotDeeplink] = useState('')
  const [salesEnabled, setSalesEnabled] = useState(true)
  const [salesNotice, setSalesNotice] = useState('')

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (data.success && data.settings) {
        const s = data.settings
        setSupportPhone(s.support_phone || '')
        setSupportTelegram(s.support_telegram || '')
        setBotUsername(s.telegram_bot_username || '')
        setBotDeeplink(s.telegram_bot_deeplink || '')
        setSalesEnabled(s.sales_enabled !== 'false')
        setSalesNotice(s.sales_notice || '')
      } else {
        toast.error(data.error || 'خطا در بارگذاری تنظیمات.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        support_phone: supportPhone,
        support_telegram: supportTelegram,
        telegram_bot_username: botUsername,
        telegram_bot_deeplink: botDeeplink,
        sales_enabled: salesEnabled ? 'true' : 'false',
        sales_notice: salesNotice,
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'تنظیمات با موفقیت ذخیره شدند.')
      } else {
        toast.error(data.error || 'خطا در ذخیره‌سازی تنظیمات.')
      }
    } catch {
      toast.error('خطای سرور در ذخیره تنظیمات.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <h1 className='text-base font-bold flex items-center gap-2'>
            <Settings className='size-4 text-primary' />
            <span>تنظیمات عمومی سامانه</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchSettings}
            disabled={loading}
            className='gap-1.5 text-xs h-8'
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='flex flex-col gap-6 p-4 sm:p-6 max-w-4xl'>
        {/* Security Notice */}
        <div className='rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 text-xs text-primary'>
          <ShieldAlert className='size-5 shrink-0 mt-0.5 text-primary' />
          <div>
            <span className='font-bold block text-sm text-foreground'>امنیت کلیدها و اسرار سیستم:</span>
            <p className='mt-0.5 leading-relaxed text-muted-foreground'>
              کلیدهای حساس مانند توکن درگاه زرین‌پال، توکن ربات تلگرام، کلید کاوه‌نگار و JWT Secret صرفاً از فایل <code className='font-mono font-bold text-foreground'>.env</code> خوانده می‌شوند و در دیتابیس یا پنل وب نمایش داده نخواهند شد.
            </p>
          </div>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-20'>
            <Loader2 className='size-8 animate-spin text-primary' />
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className='space-y-6'>
            {/* Support Settings Card */}
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-base font-bold flex items-center gap-2'>
                  <Phone className='size-4 text-primary' />
                  <span>اطلاعات تماس و پشتیبانی</span>
                </CardTitle>
                <CardDescription className='text-xs'>
                  این اطلاعات در پاورقی، مودال پشتیبانی و صفحات خرید به کاربران نمایش داده می‌شود.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 pt-0 text-xs'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label className='font-semibold block mb-1.5'>شماره تماس پشتیبانی:</label>
                    <Input
                      placeholder='021-91000000'
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className='text-xs h-10 font-mono'
                      dir='ltr'
                    />
                  </div>

                  <div>
                    <label className='font-semibold block mb-1.5'>آدرس پشتیبانی تلگرام:</label>
                    <Input
                      placeholder='https://t.me/google_ai_pro_support'
                      value={supportTelegram}
                      onChange={(e) => setSupportTelegram(e.target.value)}
                      className='text-xs h-10 font-mono'
                      dir='ltr'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Telegram Bot Settings */}
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-base font-bold flex items-center gap-2'>
                  <Bot className='size-4 text-primary' />
                  <span>تنظیمات ربات تلگرام</span>
                </CardTitle>
                <CardDescription className='text-xs'>
                  لینک دیپ‌لینک و آیدی ربات برای هدایت کاربران از هدر و صفحات وب به تلگرام
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 pt-0 text-xs'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label className='font-semibold block mb-1.5'>نام کاربری ربات (بدون @):</label>
                    <Input
                      placeholder='arioaccountbot'
                      value={botUsername}
                      onChange={(e) => setBotUsername(e.target.value)}
                      className='text-xs h-10 font-mono'
                      dir='ltr'
                    />
                  </div>

                  <div>
                    <label className='font-semibold block mb-1.5'>دیپ‌لینک شروع ربات (Deeplink):</label>
                    <Input
                      placeholder='https://t.me/arioaccountbot?start=guest'
                      value={botDeeplink}
                      onChange={(e) => setBotDeeplink(e.target.value)}
                      className='text-xs h-10 font-mono'
                      dir='ltr'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales General Settings */}
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-base font-bold flex items-center gap-2'>
                  <ToggleLeft className='size-4 text-primary' />
                  <span>تنظیمات فروش و اطلاع‌رسانی</span>
                </CardTitle>
                <CardDescription className='text-xs'>
                  کنترل وضعیت فعال بودن فروشگاه و بنر اطلاع‌رسانی بالا
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 pt-0 text-xs'>
                <div className='flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-muted/20'>
                  <div>
                    <span className='font-bold block text-foreground text-xs'>
                      وضعیت پذیرش سفارش‌های جدید (فروش آنلاین)
                    </span>
                    <span className='text-muted-foreground text-[11px] mt-0.5 block'>
                      در صورت غیرفعال کردن، کاربران امکان ثبت سفارش در صفحه خرید را نخواهند داشت.
                    </span>
                  </div>
                  <Switch
                    checked={salesEnabled}
                    onCheckedChange={setSalesEnabled}
                  />
                </div>

                <div>
                  <label className='font-semibold block mb-1.5'>متن پیام اطلاع‌رسانی بالای فروشگاه:</label>
                  <Textarea
                    rows={3}
                    placeholder='پیام اعلان تحویل آنی یا اطلاع‌رسانی مهم به خریداران...'
                    value={salesNotice}
                    onChange={(e) => setSalesNotice(e.target.value)}
                    className='text-xs'
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className='flex justify-end'>
              <Button
                type='submit'
                disabled={saving}
                className='h-11 px-6 text-xs font-bold gap-2 shadow-md'
              >
                {saving ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Save className='size-4' />
                )}
                ذخیره تنظیمات سیستم
              </Button>
            </div>
          </form>
        )}
      </Main>
    </>
  )
}
