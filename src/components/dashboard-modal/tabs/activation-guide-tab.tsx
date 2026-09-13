'use client'

import React, { useState } from 'react'
import {
  ExternalLink,
  ShieldCheck,
  Globe,
  Lock,
  ChevronDown,
  Info,
  Clock,
  Zap,
  Key,
  User,
  Package,
  Sparkles,
  Mail,
  CheckCircle2,
  Warehouse,
  Check,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion, AnimatePresence } from 'framer-motion'

export type PlanDeliveryKey = 'link' | 'email-account'
export type EmailAccountSubMode = 'inventory' | 'own'

interface PlanStep {
  number: string
  title: string
  subtitle: string
  desc: string
  tip: string
}

const goldenTips = [
  {
    icon: Globe,
    badge: 'نکته اول',
    title: 'اتصال به VPN با آی‌پی پایدار',
    desc: 'سرویس‌های بین‌المللی هوش مصنوعی (Google, OpenAI, Anthropic) به دلیل تحریم، نیازمند اتصال پایدار با لوکیشن‌های معتبر مانند آمریکا یا اروپا هستند.',
  },
  {
    icon: Lock,
    badge: 'نکته دوم',
    title: 'استفاده از تب ناشناس (Incognito)',
    desc: 'باز کردن لینک یا لاگین در پنجره ناشناس از تداخل کش، کوکی‌ها و اکانت‌های قبلی مرورگر جلوگیری کرده و فرآیند را کاملاً روان می‌سازد.',
  },
  {
    icon: ShieldCheck,
    badge: 'نکته سوم',
    title: 'تضمین اصالت و حریم خصوصی ۱۰۰٪',
    desc: 'چت‌ها، پروژه‌ها و فایل‌های ابری شما در هر دو پلن کاملاً محرمانه و ایزوله بوده و در انحصار کامل خودتان قرار دارد.',
  },
]

const faqs = [
  {
    question: 'فروشگاه چه پلن‌هایی ارائه می‌دهد و تفاوت آنها در چیست؟',
    answer:
      'در حال حاضر ۲ پلن اصلی ارائه می‌شود: ۱) «پلن لینک فعال‌سازی آنی»: اشتراک از طریق یک لینک دعوت اختصاصی بدون نیاز به ارسال رمز عبور، مستقیماً روی اکانت شخصی شما فعال می‌شود. ۲) «پلن اکانت روی ایمیل»: که در آن می‌توانید یا اکانت آماده از انبار (ایمیل و پسورد با تحویل آنی) بگیرید یا جیمیل خودتان را ثبت کنید تا اشتراک مستقیماً روی آن فعال شود.',
  },
  {
    question: 'در پلن اکانت روی ایمیل، تفاوت «اکانت آماده» و «فعال‌سازی روی ایمیل شخصی» چیست؟',
    answer:
      'در حالت اکانت آماده از انبار، بلافاصله پس از پرداخت یک ایمیل و رمز عبور اختصاصی و نو تحویل می‌گیرید که اشتراک از قبل روی آن فعال است. در حالت ایمیل شخصی، شما جیمیل خودتان را در فرم تسویه‌حساب وارد می‌کنید تا فعال‌سازی مستقیماً توسط تیم فنی روی همان اکانت شخصی شما انجام گردد.',
  },
  {
    question: 'آیا بعد از دریافت «اکانت آماده»، می‌توانم رمز عبور آن را تغییر دهم؟',
    answer:
      'بله ۱۰۰٪! اکانت‌های آماده انبار کاملاً اختصاصی، تمیز و نو هستند و پس از تحویل می‌توانید فوراً رمز عبور، شماره تلفن و ایمیل بازیابی آن را به دلخواه خود تغییر دهید تا مالکیت کامل در دست شما باشد.',
  },
  {
    question: 'آیا در روش «لینک فعال‌سازی آنی»، به رمز عبور اکانت من نیازی است؟',
    answer:
      'خیر، به هیچ وجه! لینک‌های فعال‌سازی از زیرساخت رسمی دعوت استفاده می‌کنند و شما تنها با کلیک روی لینک و ورود به حساب گوگل خودتان با زدن دکمه Accept عضویت را می‌پذیرید؛ بنابراین هیچ نیازی به ارسال رمز عبور نیست.',
  },
  {
    question: 'خطای Family Restriction در گوگل چیست و چگونه برطرف می‌شود؟',
    answer:
      'طبق قوانین شرکت گوگل، هر جیمیل در هر ۱۲ ماه فقط یک‌بار اجازه تغییر گروه خانواده (Family) را دارد. اگر قبلاً در فمیلی دیگری عضو بوده‌اید و با این خطا در لینک مواجه شدید، ساده‌ترین راهکار ساخت یک جیمیل تازه (کمتر از ۱ دقیقه) و فعال‌سازی لینک روی آن است، یا می‌توانید از پلن اکانت روی ایمیل استفاده فرمایید.',
  },
  {
    question: 'در صورت بروز هرگونه مشکل یا سوال حین فعال‌سازی چه اقدامی کنم؟',
    answer:
      'تیم پشتیبانی ما همه‌روزه همراه شماست. کافیست به تب «پشتیبانی» مراجعه فرمایید تا از طریق تلگرام یا ثبت تیکت، فوراً راهنمایی لازم را دریافت کنید. تمامی سفارش‌ها دارای گارانتی کامل و ضمانت تعویض هستند.',
  },
]

interface ActivationGuideTabProps {
  onGoToOrders?: () => void
}

export function ActivationGuideTab({ onGoToOrders }: ActivationGuideTabProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanDeliveryKey>('link')
  const [emailSubMode, setEmailSubMode] = useState<EmailAccountSubMode>('inventory')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                راهنمای فعال‌سازی ۲ پلن فروشگاه
              </h3>
              <Badge variant="outline" className="text-[11px] border-primary/30 text-primary bg-primary/5">
                ساده و شفاف
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
              سفارش‌های فروشگاه در قالب <strong>۲ پلن اصلی</strong> تحویل داده میشوند. برای آموزش هر پلن روی کارت آن کلیک کنید.
            </p>
          </div>

          {onGoToOrders && (
            <Button
              onClick={onGoToOrders}
              variant="outline"
              size="sm"
              className="shrink-0 text-xs gap-1.5 border-primary/30 hover:bg-primary/10"
            >
              <span>مشاهده سفارش‌های من</span>
              <ArrowLeft className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* 2 Main Plans Selector Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            پلن سفارش خود را انتخاب کنید:
          </h4>
          <span className="text-[11px] text-primary font-medium">
            ۲ پلن قابل سفارش در فروشگاه
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Plan 1 Card: Instant Link */}
          <button
            type="button"
            onClick={() => setSelectedPlan('link')}
            className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border text-start transition-all duration-200 cursor-pointer ${
              selectedPlan === 'link'
                ? 'border-blue-500/70 bg-blue-500/10 text-foreground ring-2 ring-blue-500/20 shadow-xs'
                : 'border-border/70 bg-card hover:bg-muted/40 text-foreground'
            }`}
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                selectedPlan === 'link'
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Zap className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs sm:text-sm font-bold truncate">۱. لینک فعال‌سازی آنی</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    selectedPlan === 'link'
                      ? 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold'
                      : 'text-muted-foreground'
                  }`}
                >
                  تحویل ۰ ثانیه
                </Badge>
              </div>
              <p className="text-[11.5px] text-muted-foreground leading-relaxed line-clamp-2">
                دریافت فوری لینک دعوت اختصاصی؛ بدون نیاز به رمز عبور با یک کلیک روی اکانت شما
              </p>
            </div>
          </button>

          {/* Plan 2 Card: On Email */}
          <button
            type="button"
            onClick={() => setSelectedPlan('email-account')}
            className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border text-start transition-all duration-200 cursor-pointer ${
              selectedPlan === 'email-account'
                ? 'border-purple-500/70 bg-purple-500/10 text-foreground ring-2 ring-purple-500/20 shadow-xs'
                : 'border-border/70 bg-card hover:bg-muted/40 text-foreground'
            }`}
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                selectedPlan === 'email-account'
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Mail className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs sm:text-sm font-bold truncate">۲. اکانت روی ایمیل</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    selectedPlan === 'email-account'
                      ? 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold'
                      : 'text-muted-foreground'
                  }`}
                >
                  ۲ شیوه تحویل
                </Badge>
              </div>
              <p className="text-[11.5px] text-muted-foreground leading-relaxed line-clamp-2">
                اکانت آماده نو از انبار (ایمیل و رمز فوری) یا فعال‌سازی مستقیم روی ایمیل شخصی شما
              </p>
            </div>
          </button>
        </div>

        {/* Selected Plan Active Container */}
        <AnimatePresence mode="wait">
          {selectedPlan === 'link' ? (
            /* PLAN 1: INSTANT ACTIVATION LINK */
            <motion.div
              key="plan-link"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-blue-500/30 bg-card p-4 sm:p-5 space-y-4 shadow-xs"
            >
              {/* Header Info */}
              <div className="border-b border-border/50 pb-3 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h5 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <span className="flex size-2.5 rounded-full bg-blue-500" />
                    پلن اول: لینک فعال‌سازی آنی (Google One / فمیلی)
                  </h5>
                  <Badge variant="outline" className="text-[11px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-medium">
                    بدون نیاز به رمز عبور • تحویل آنی
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  در این روش هیچ نیازی به ارسال پسورد یا ایمیل نیست؛ بلافاصله پس از پرداخت یک لینک دعوت رسمی و اختصاصی دریافت می‌کنید و با یک کلیک، اشتراک مستقیماً روی اکانت شخصی گوگل شما فعال می‌شود.
                </p>
              </div>

              {/* 3 Steps */}
              <div className="space-y-3">
                <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs shadow-xs">
                    ۱
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h6 className="text-xs sm:text-sm font-bold text-foreground">
                        دریافت لینک از تب «سفارش‌های من»
                      </h6>
                      <span className="text-[10.5px] text-muted-foreground">
                        کپی لینک یا کلیک دکمه فعال‌سازی
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      وارد تب «سفارش‌های من» شوید. در کارت سفارش، روی دکمه «کپی لینک» یا «فعال‌سازی در گوگل» کلیک کنید.
                    </p>
                    <div className="flex items-start gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/5 rounded-lg p-2 mt-1.5 border border-blue-500/15">
                      <Info className="size-3.5 shrink-0 mt-0.5" />
                      <span>هر لینک منحصراً متعلق به سفارش شما صادر شده و کاملاً ایمن و یک‌بار مصرف است.</span>
                    </div>
                  </div>
                </div>

                <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs shadow-xs">
                    ۲
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h6 className="text-xs sm:text-sm font-bold text-foreground">
                        اتصال به VPN و باز کردن در حالت ناشناس (Incognito)
                      </h6>
                      <span className="text-[10.5px] text-muted-foreground">
                        استفاده از آی‌پی پایدار (آمریکا یا اروپا)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      به دلیل تحریم‌های شرکت گوگل، پیش از باز کردن لینک فیلترشکن خود را با آی‌پی پایدار فعال کنید و لینک را ترجیحاً در پنجره ناشناس (Incognito) مرورگر باز نمایید.
                    </p>
                    <div className="flex items-start gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/5 rounded-lg p-2 mt-1.5 border border-blue-500/15">
                      <Info className="size-3.5 shrink-0 mt-0.5" />
                      <span>پنجره ناشناس (Incognito) از تداخل جیمیل‌ها و کوکی‌های قبلی مرورگر به طور کامل جلوگیری می‌کند.</span>
                    </div>
                  </div>
                </div>

                <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs shadow-xs">
                    ۳
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h6 className="text-xs sm:text-sm font-bold text-foreground">
                        ورود به اکانت شخصی و تایید پذیرش عضویت
                      </h6>
                      <span className="text-[10.5px] text-muted-foreground">
                        پذیرش دعوت با دکمه Accept یا Join
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      در صفحه رسمی باز شده گوگل، با جیمیل مدنظر خود وارد شوید و دکمه عضویت یا پذیرش طرح را بزنید.
                    </p>
                    <div className="flex items-start gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/5 rounded-lg p-2 mt-1.5 border border-blue-500/15">
                      <Info className="size-3.5 shrink-0 mt-0.5" />
                      <span>پس از مشاهده پیام خوش‌آمدگویی، اشتراک و حجم ابری بلافاصله روی همان اکانت شخصی فعال شده است.</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* PLAN 2: ON EMAIL (READY ACCOUNT OR USER EMAIL) */
            <motion.div
              key="plan-email"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-purple-500/30 bg-card p-4 sm:p-5 space-y-4 shadow-xs"
            >
              {/* Header Info */}
              <div className="border-b border-border/50 pb-3 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h5 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <span className="flex size-2.5 rounded-full bg-purple-500" />
                    پلن دوم: اکانت اختصاصی روی ایمیل
                  </h5>
                  <Badge variant="outline" className="text-[11px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-medium">
                    شامل ۲ حالت تحویل (انتخابی در خرید)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  در این پلن، شما هنگام خرید انتخاب کرده‌اید که اکانت آماده تحویل بگیرید یا اشتراک روی جیمیل شخصی خودتان فعال شود. راهنمای حالت انتخابی خود را در زیر مشاهده کنید:
                </p>
              </div>

              {/* Sub-Mode Segmented Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => setEmailSubMode('inventory')}
                  className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                    emailSubMode === 'inventory'
                      ? 'bg-background text-purple-700 dark:text-purple-300 shadow-xs border border-purple-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Warehouse className="size-3.5 shrink-0" />
                  <span className="truncate">حالت اول: اکانت آماده انبار (تحویل فوری)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmailSubMode('own')}
                  className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-lg font-bold transition-all cursor-pointer ${
                    emailSubMode === 'own'
                      ? 'bg-background text-purple-700 dark:text-purple-300 shadow-xs border border-purple-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="size-3.5 shrink-0" />
                  <span className="truncate">حالت دوم: فعال‌سازی روی ایمیل شما</span>
                </button>
              </div>

              {/* Sub-mode content */}
              <AnimatePresence mode="wait">
                {emailSubMode === 'inventory' ? (
                  <motion.div
                    key="submode-inventory"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs leading-relaxed text-purple-900 dark:text-purple-200">
                      <strong>شیوه اکانت آماده:</strong> بلافاصله پس از پرداخت، مشخصات ورود شامل ایمیل (جیمیل اختصاصی) و رمز عبور یک اکانت نو در تب سفارش‌ها تحویل داده می‌شود و قابلیت تغییر رمز دارد.
                    </div>

                    {/* Steps for Ready Account */}
                    <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs shadow-xs">
                        ۱
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h6 className="text-xs sm:text-sm font-bold text-foreground">
                            دریافت مشخصات اکانت از تب «سفارش‌های من»
                          </h6>
                          <span className="text-[10.5px] text-muted-foreground">
                            کپی ایمیل و رمز عبور اختصاصی
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          در کارت سفارش شما، ایمیل و رمز عبور اختصاصی قرار دارد. با کلیک روی آیکون‌های کپی، مشخصات را بردارید.
                        </p>
                        <div className="flex items-start gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 bg-purple-500/5 rounded-lg p-2 mt-1.5 border border-purple-500/15">
                          <Info className="size-3.5 shrink-0 mt-0.5" />
                          <span>با زدن آیکون چشم در کنار کادر پسورد می‌توانید رمز عبور را مشاهده فرمایید.</span>
                        </div>
                      </div>
                    </div>

                    <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs shadow-xs">
                        ۲
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h6 className="text-xs sm:text-sm font-bold text-foreground">
                            روشن کردن فیلترشکن و لاگین در پلتفرم
                          </h6>
                          <span className="text-[10.5px] text-muted-foreground">
                            ورود به سایت رسمی با مشخصات دریافتی
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          VPN خود را روی لوکیشن مناسب روشن کرده و وارد سایت رسمی سرویس مربوطه شوید و با ایمیل و رمز عبور دریافتی وارد شوید.
                        </p>
                        <div className="flex items-start gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 bg-purple-500/5 rounded-lg p-2 mt-1.5 border border-purple-500/15">
                          <Info className="size-3.5 shrink-0 mt-0.5" />
                          <span>پیشنهاد می‌شود برای اولین لاگین از پنجره ناشناس (Incognito) مرورگر استفاده کنید.</span>
                        </div>
                      </div>
                    </div>

                    <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs shadow-xs">
                        ۳
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h6 className="text-xs sm:text-sm font-bold text-foreground">
                            بهره‌مندی کامل و امکان تغییر مشخصات اکانت
                          </h6>
                          <span className="text-[10.5px] text-muted-foreground">
                            مالکیت ۱۰۰٪ انحصاری شما
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          پلن پرمیوم از پیش روی این اکانت فعال است. شما می‌توانید پس از اولین لاگین، رمز عبور را به دلخواه تغییر داده و ایمیل یا شماره بازیابی شخصی خود را روی اکانت ثبت نمایید.
                        </p>
                        <div className="flex items-start gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 bg-purple-500/5 rounded-lg p-2 mt-1.5 border border-purple-500/15">
                          <Info className="size-3.5 shrink-0 mt-0.5" />
                          <span>این اکانت کاملاً در انحصار شما بوده و تاریخچه و فایل‌های آن ۱۰۰٪ محرمانه است.</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="submode-own"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-3"
                  >
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
                      <strong>شیوه فعال‌سازی روی ایمیل شما:</strong> شما در زمان خرید جیمیل شخصی خود را ثبت کرده‌اید. اشتراک مستقیماً توسط تیم پشتیبانی روی همان اکانت شخصی شما شارژ و اعمال می‌گردد.
                    </div>

                    {/* Steps for User's Own Email */}
                    <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-xs shadow-xs">
                        ۱
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h6 className="text-xs sm:text-sm font-bold text-foreground">
                            ثبت جیمیل در مرحله تسویه‌حساب خرید
                          </h6>
                          <span className="text-[10.5px] text-muted-foreground">
                            ارسال مشخصات اکانت به سیستم
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          در زمان خرید، شما جیمیل شخصی خود را در فرم تسویه‌حساب وارد کرده‌اید و سفارش در مرحله اعمال اختصاصی قرار گرفته است.
                        </p>
                        <div className="flex items-start gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-lg p-2 mt-1.5 border border-emerald-500/15">
                          <Info className="size-3.5 shrink-0 mt-0.5" />
                          <span>اطمینان حاصل کنید که به صندوق ورودی جیمیل ثبت‌شده دسترسی کامل دارید.</span>
                        </div>
                      </div>
                    </div>

                    <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-xs shadow-xs">
                        ۲
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h6 className="text-xs sm:text-sm font-bold text-foreground">
                            اعمال اشتراک و تغییر وضعیت سفارش به تکمیل‌شده
                          </h6>
                          <span className="text-[10.5px] text-muted-foreground">
                            انجام شارژ توسط تیم فنی یا سیستم
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          اشتراک توسط کارشناسان فنی روی جیمیل شما شارژ شده و وضعیت سفارش در بخش «سفارش‌های من» به «تکمیل شده» تغییر می‌یابد.
                        </p>
                        <div className="flex items-start gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-lg p-2 mt-1.5 border border-emerald-500/15">
                          <Info className="size-3.5 shrink-0 mt-0.5" />
                          <span>در صورت نیاز به تایید ایمیلی از طرف گوگل، ایمیل رسمی فعال‌سازی برای شما ارسال می‌گردد.</span>
                        </div>
                      </div>
                    </div>

                    <div className="group flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-black text-xs shadow-xs">
                        ۳
                      </div>
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h6 className="text-xs sm:text-sm font-bold text-foreground">
                            ورود به حساب کاربری شخصی و استفاده
                          </h6>
                          <span className="text-[10.5px] text-muted-foreground">
                            بدون نیاز به تغییر اکانت یا جابجایی اطلاعات
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          با همان جیمیل شخصی خود وارد سرویس مدنظر شوید؛ اشتراک شما فعال است و به تمام قابلیت‌ها و حجم ابری دسترسی دارید.
                        </p>
                        <div className="flex items-start gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-lg p-2 mt-1.5 border border-emerald-500/15">
                          <Info className="size-3.5 shrink-0 mt-0.5" />
                          <span>در صورت عدم مشاهده تغییر، یک‌بار از اکانت خود خارج شده و مجدداً لاگین فرمایید.</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3 Golden Rules / Tips */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            ۳ نکته طلایی برای فعال‌سازی موفق و بدون اختلال
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {goldenTips.map((tip, idx) => {
            const Icon = tip.icon
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border/70 bg-card p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-primary/40 hover:shadow-xs transition-all duration-200"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">
                      {tip.badge}
                    </span>
                  </div>

                  <h5 className="text-xs sm:text-[13px] font-bold text-foreground leading-snug">
                    {tip.title}
                  </h5>

                  <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                    {tip.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQs Section */}
      <div className="space-y-3 pt-1">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
          پرسش‌های متداول فعال‌سازی ۲ پلن
        </h4>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <Collapsible
                key={idx}
                open={isOpen}
                onOpenChange={() => setOpenFaq(isOpen ? null : idx)}
                className="rounded-xl border border-border/70 overflow-hidden bg-card transition-colors"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-3.5 text-start text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-3.5 pb-3.5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2.5 bg-muted/20">
                  {faq.answer}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </div>
    </div>
  )
}
