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
  Bell,
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

  // Admin Notification States (Section 4.4)
  const [adminChatId, setAdminChatId] = useState('')
  const [adminNotifEnabled, setAdminNotifEnabled] = useState(true)
  const [lowStockThreshold, setLowStockThreshold] = useState('3')
  const [testingTelegram, setTestingTelegram] = useState(false)

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
        setAdminChatId(s.admin_telegram_chat_id || '')
        setAdminNotifEnabled(s.admin_notifications_enabled !== 'false')
        setLowStockThreshold(s.low_stock_threshold || '3')
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
        admin_telegram_chat_id: adminChatId,
        admin_notifications_enabled: adminNotifEnabled ? 'true' : 'false',
        low_stock_threshold: lowStockThreshold,
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

  const handleTestTelegram = async () => {
    if (!adminChatId.trim()) {
      toast.error('لطفاً ابتدا شناسه چت تلگرام ادمین را وارد نمایید.')
      return
    }

    setTestingTelegram(true)
    try {
      const res = await fetch('/api/admin/settings/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: adminChatId.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'پیام آزمایشی به تلگرام ارسال شد!')
      } else {
        toast.error(data.error || 'خطا در ارسال پیام تلگرام.')
      }
    } catch {
      toast.error('خطای ارتباط با سرور در ارسال تست تلگرام.')
    } finally {
      setTestingTelegram(false)
    }
  }

  return (
    <>
      <Header>
        <div className='hidden sm:flex items-center gap-2 overflow-hidden'>
          <h1 className='text-sm sm:text-base font-bold flex items-center gap-2 truncate'>
            <Settings className='size-4 text-primary shrink-0' />
            <span className='truncate'>تنظیمات عمومی سامانه</span>
          </h1>
        </div>
        <div className='ms-auto flex items-center gap-2 shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchSettings}
            disabled={loading}
            className='gap-1.5 text-xs h-8 px-2.5 sm:px-3'
            title='بروزرسانی'
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className='hidden sm:inline'>بروزرسانی</span>
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main className='p-3.5 sm:p-6 max-w-4xl'>
        <div className='flex flex-col gap-5 sm:gap-6 w-full min-w-0'>
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
          <div
            className='flex flex-col items-center justify-center py-20 gap-2.5 text-muted-foreground'
            role='status'
            aria-live='polite'
          >
            <Loader2 className='size-8 animate-spin text-primary' aria-hidden='true' />
            <span className='text-xs'>در حال بارگذاری تنظیمات سیستم...</span>
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

            {/* Admin Notifications Card (Section 4.4) */}
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-base font-bold flex items-center gap-2'>
                  <Bell className='size-4 text-primary' />
                  <span>اعلان‌های فوری تلگرام ادمین</span>
                </CardTitle>
                <CardDescription className='text-xs'>
                  دریافت فوری اعلان‌های ثبت سفارش جدید، هشدار اتمام یا کمبود موجودی انبار و استرداد وجه در تلگرام
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 pt-0 text-xs'>
                <div className='flex items-center justify-between p-3.5 rounded-xl border border-border/50 bg-muted/20'>
                  <div>
                    <span className='font-bold block text-foreground text-xs'>
                      ارسال اعلان‌های سیستمی به تلگرام ادمین
                    </span>
                    <span className='text-muted-foreground text-[11px] mt-0.5 block'>
                      فعال‌سازی ارسال پیام‌های سفارش پرداخت‌شده و هشدارهای کالا به ربات تلگرام
                    </span>
                  </div>
                  <Switch
                    checked={adminNotifEnabled}
                    onCheckedChange={setAdminNotifEnabled}
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label className='font-semibold block mb-1.5'>شناسه چت تلگرام ادمین (Chat ID):</label>
                    <div className='flex items-center gap-2'>
                      <Input
                        placeholder='مثال: 123456789'
                        value={adminChatId}
                        onChange={(e) => setAdminChatId(e.target.value)}
                        className='text-xs h-10 font-mono'
                        dir='ltr'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={handleTestTelegram}
                        disabled={testingTelegram || !adminChatId.trim()}
                        aria-busy={testingTelegram}
                        className='h-10 px-3.5 text-xs font-semibold shrink-0 cursor-pointer'
                        title='ارسال پیام تستی'
                      >
                        {testingTelegram ? (
                          <>
                            <Loader2 className='size-3.5 animate-spin' aria-hidden='true' />
                            <span className='sr-only'>در حال بررسی اتصال به تلگرام...</span>
                          </>
                        ) : (
                          'تست اتصال'
                        )}
                      </Button>
                    </div>
                    <span className='text-[10px] text-muted-foreground mt-1 block'>
                      شناسه عددی تلگرام مدیر (می‌توانید با ارسال پیام به ربات @userinfobot دریافت کنید).
                    </span>
                  </div>

                  <div>
                    <label className='font-semibold block mb-1.5'>آستانه هشدار کمبود موجودی انبار:</label>
                    <Input
                      type='number'
                      min='0'
                      max='100'
                      step='1'
                      placeholder='3'
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className='text-xs h-10 font-mono'
                      dir='ltr'
                    />
                    <span className='text-[10px] text-muted-foreground mt-1 block'>
                      هر زمان موجودی یک پلن کمتر یا مساوی این عدد شد، هشدار فوری برای ادمین ارسال می‌شود.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className='flex justify-end'>
              <Button
                type='submit'
                disabled={saving}
                aria-busy={saving}
                className='h-11 px-6 text-xs font-bold gap-2 shadow-md'
              >
                {saving ? (
                  <Loader2 className='size-4 animate-spin' aria-hidden='true' />
                ) : (
                  <Save className='size-4' aria-hidden='true' />
                )}
                ذخیره تنظیمات سیستم
              </Button>
            </div>
          </form>
        )}
        </div>
      </Main>
    </>
  )
}
