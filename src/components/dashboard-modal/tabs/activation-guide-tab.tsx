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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion, AnimatePresence } from 'framer-motion'

type DeliveryMethodKey = 'link' | 'account' | 'provisioning'

interface DeliveryMethod {
  id: DeliveryMethodKey
  title: string
  shortTitle: string
  icon: React.ComponentType<{ className?: string }>
  badge: string
  color: string
  examples: string
  description: string
  steps: Array<{
    number: string
    title: string
    subtitle: string
    desc: string
    tip: string
  }>
}

const deliveryMethods: DeliveryMethod[] = [
  {
    id: 'link',
    title: 'لینک فعال‌سازی و دعوت‌نامه',
    shortTitle: 'لینک اختصاصی',
    icon: ExternalLink,
    badge: 'بدون نیاز به پسورد',
    color: 'from-blue-600 to-indigo-600',
    examples: 'مانند جمینای ادونس (Google One Family)، پلن‌های تیمی و اشتراکی',
    description:
      'در این روش نیازی به ارسال رمز عبور نیست؛ اشتراک از طریق یک لینک دعوت اختصاصی مستقیماً روی اکانت شخصی خودتان فعال می‌شود.',
    steps: [
      {
        number: '۱',
        title: 'دریافت لینک از تب «سفارش‌های من»',
        subtitle: 'کپی لینک یا کلیک روی دکمه فعال‌سازی',
        desc: 'وارد تب «سفارش‌های من» شوید و در کادر سفارش، روی دکمه «کپی لینک» یا «فعال‌سازی» کلیک کنید.',
        tip: 'هر لینک منحصراً برای حساب شما صادر شده و یک‌بار مصرف است.',
      },
      {
        number: '۲',
        title: 'روشن کردن VPN با آی‌پی پایدار',
        subtitle: 'استفاده ترجیحی از حالت مرورگر ناشناس (Incognito)',
        desc: 'به دلیل تحریم‌های شرکت‌های ارائه‌دهنده، پیش از باز کردن لینک حتماً VPN با آی‌پی پایدار (آمریکا یا اروپا) روشن کنید.',
        tip: 'باز کردن لینک در پنجره ناشناس (Incognito) از تداخل حساب‌های جیمیل متفرقه جلوگیری می‌کند.',
      },
      {
        number: '۳',
        title: 'ورود به حساب شخصی و پذیرش دعوت',
        subtitle: 'کلیک روی دکمه Accept یا عضویت',
        desc: 'در صفحه رسمی باز شده، وارد اکانت شخصی خود شوید و درخواست عضویت یا پذیرش طرح را تأیید فرمایید.',
        tip: 'پس از مشاهده پیام خوش‌آمدگویی یا تایید عضویت، اشتراک بلافاصله روی اکانت شما فعال شده است.',
      },
    ],
  },
  {
    id: 'account',
    title: 'اکانت آماده اختصاصی',
    shortTitle: 'اکانت آماده (ایمیل و رمز)',
    icon: Key,
    badge: 'تحویل فوری اطلاعات',
    color: 'from-purple-600 to-indigo-600',
    examples: 'مانند اکانت‌های اختصاصی ChatGPT Plus، Claude Pro و ابزارهای پریمیوم AI',
    description:
      'در این روش، یک حساب کاربری آماده، تمیز و کاملاً اختصاصی همراه با نام کاربری/ایمیل و پسورد به شما تحویل داده می‌شود.',
    steps: [
      {
        number: '۱',
        title: 'دریافت مشخصات اکانت از تب «سفارش‌های من»',
        subtitle: 'کپی نام کاربری (ایمیل) و رمز عبور',
        desc: 'در کارت سفارش شما، ایمیل و رمزعبور اختصاصی قرار گرفته است. با کلیک روی آیکون‌های کپی، مشخصات را بردارید.',
        tip: 'با زدن روی آیکون چشم می‌توانید رمز عبور را مشاهده کنید.',
      },
      {
        number: '۲',
        title: 'روشن کردن VPN و مراجعه به سایت رسمی',
        subtitle: 'ورود به پلتفرم با آی‌پی پایدار',
        desc: 'فیلترشکن خود را روی لوکیشن مناسب روشن کرده و وارد سایت رسمی سرویس (مثلاً chatgpt.com یا claude.ai) شوید.',
        tip: 'همیشه از دامنه‌های رسمی سرویس‌ها برای ورود استفاده کنید.',
      },
      {
        number: '۳',
        title: 'لاگین و بهره‌مندی از تمام امکانات',
        subtitle: 'استفاده نامحدود و بدون نیاز به تنظیمات اضافه',
        desc: 'با ایمیل و پسورد دریافتی لاگین کنید. پلن پرمیوم روی اکانت فعال است و می‌توانید مستقیماً از آن استفاده نمایید.',
        tip: 'این اکانت کاملاً در انحصار شما بوده و تاریخچه و چت‌های شما کاملاً محفوظ است.',
      },
    ],
  },
  {
    id: 'provisioning',
    title: 'فعال‌سازی روی اکانت شخصی شما',
    shortTitle: 'شارژ روی ایمیل شما',
    icon: User,
    badge: 'فعال‌سازی مستقیم',
    color: 'from-emerald-600 to-teal-600',
    examples: 'پلن‌هایی که حین ثبت سفارش، آدرس ایمیل شخصی خود را در فرم وارد کرده‌اید',
    description:
      'در این نوع سفارش، فعال‌سازی مستقیماً توسط سیستم یا تیم فنی روی آدرس ایمیلی که هنگام خرید ثبت کرده‌اید اعمال می‌شود.',
    steps: [
      {
        number: '۱',
        title: 'ثبت ایمیل در مرحله سفارش',
        subtitle: 'ارسال آدرس اکانت شخصی به سیستم',
        desc: 'شما در مرحله تسویه‌حساب، ایمیل اکانت شخصی خود را ثبت کرده‌اید و سفارش در مرحله اعمال قرار گرفته است.',
        tip: 'مطمئن شوید ایمیلی که وارد کرده‌اید معتبر بوده و به آن دسترسی دارید.',
      },
      {
        number: '۲',
        title: 'اعمال اشتراک و تغییر وضعیت به تکمیل‌شده',
        subtitle: 'انجام فرایند شارژ توسط سیستم یا پشتیبانی',
        desc: 'اشتراک توسط سیستم روی اکانت شما اعمال شده و وضعیت سفارش در تب «سفارش‌های من» به «تکمیل شده» تغییر می‌یابد.',
        tip: 'در صورت نیاز به تایید ایمیل، یک لینک تایید از طرف سرویس برای شما ایمیل خواهد شد.',
      },
      {
        number: '۳',
        title: 'ورود به حساب و استفاده از سرویس',
        subtitle: 'مشاهده فعال بودن طرح پرمیوم',
        desc: 'با ایمیل شخصی خود وارد سایت یا اپلیکیشن سرویس مربوطه شوید؛ اشتراک شما فعال و آماده استفاده است.',
        tip: 'در صورت عدم مشاهده تغییر، یک‌بار از حساب کاربری خود خارج و مجدداً وارد شوید.',
      },
    ],
  },
]

const goldenTips = [
  {
    icon: Globe,
    badge: 'نکته اول',
    title: 'اتصال به VPN با آی‌پی پایدار',
    desc: 'اکثر سرویس‌های هوش مصنوعی (OpenAI, Google, Anthropic) به دلیل تحریم، نیازمند اتصال با لوکیشن‌های پایدار (مانند آمریکا، آلمان یا انگلیس) هستند.',
  },
  {
    icon: Lock,
    badge: 'نکته دوم',
    title: 'استفاده از تب ناشناس (Incognito)',
    desc: 'باز کردن لینک یا اکانت در پنجره ناشناس مانع از تداخل کش، کوکی‌ها و اکانت‌های قبلی مرورگر می‌شود و فعال‌سازی روان انجام می‌گیرد.',
  },
  {
    icon: ShieldCheck,
    badge: 'نکته سوم',
    title: 'حفظ حریم خصوصی و عدم اشتراک‌گذاری',
    desc: 'چت‌ها و پروژه‌های شما کاملاً محرمانه است. برای حفظ پایداری اشتراک و جلوگیری از مسدودی، اطلاعات اکانت را در اختیار دیگران قرار ندهید.',
  },
]

const faqs = [
  {
    question: 'از کجا بدانم اشتراک من به چه روشی فعال و تحویل داده می‌شود؟',
    answer:
      'نوع تحویل روی کارت سفارش شما در تب «سفارش‌های من» دقیقاً نمایش داده شده است. اگر اشتراک شما با لینک باشد، دکمه «کپی لینک»؛ اگر اکانت آماده باشد، «ایمیل و رمز ورود»؛ و اگر فعال‌سازی روی ایمیل باشد، پیام تایید فعال‌سازی برای شما نمایش داده می‌شود.',
  },
  {
    question: 'آیا چت‌ها، فایل‌ها و اطلاعات شخصی من برای شخص دیگری قابل دیدن است؟',
    answer:
      'مطلقاً خیر! در تمامی روش‌ها (چه لینک دعوت فمیلی و چه اکانت‌های اختصاصی) حریم خصوصی ۱۰۰٪ ایزوله است و هیچ شخص دیگری (حتی مدیر فمیلی یا پشتیبانی) دسترسی به فایل‌ها، مکالمات، پروژه‌ها و تاریخچه چت‌های شما ندارد.',
  },
  {
    question: 'با خطای عدم تطابق کشور یا دسترسی (Region / Access Denied) مواجه شدم، چاره چیست؟',
    answer:
      'این خطا معمولاً به دلیل نشت آی‌پی یا قطعی موقت VPN رخ می‌دهد. فیلترشکن خود را قطع و به لوکیشن دیگری (ترجیحاً آمریکا یا آلمان) متصل کنید، کش مرورگر را پاک نمایید و صفحه را حتماً در حالت پنجره ناشناس (Incognito) باز فرمایید.',
  },
  {
    question: 'برای اشتراک‌های گوگل و جمینای، خطای Family Restriction چیست و چطور رفع می‌شود؟',
    answer:
      'طبق قوانین شرکت گوگل، هر جیمیل در هر ۱۲ ماه فقط یک‌بار اجازه تغییر گروه خانواده را دارد. اگر در یک سال گذشته عضو فمیلی دیگری بوده‌اید، ساده‌ترین و سریع‌ترین راهکار ساخت یک جیمیل تازه (کمتر از ۱ دقیقه) و فعال‌سازی لینک روی آن جیمیل است.',
  },
  {
    question: 'در صورت بروز هرگونه سوال یا مشکل فنی حین فعال‌سازی چه اقدامی کنم؟',
    answer:
      'تیم پشتیبانی ما همه‌روزه همراه شماست. کافیست به تب «پشتیبانی» مراجعه فرمایید تا از طریق تلگرام یا ثبت تیکت، فوراً راهنمایی لازم را دریافت کنید. تمامی سفارش‌ها دارای ضمانت کامل کارکرد هستند.',
  },
]

interface ActivationGuideTabProps {
  onGoToOrders?: () => void
}

export function ActivationGuideTab({ onGoToOrders }: ActivationGuideTabProps) {
  const [selectedMethod, setSelectedMethod] = useState<DeliveryMethodKey>('link')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const activeMethod = deliveryMethods.find((m) => m.id === selectedMethod) || deliveryMethods[0]

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5 shadow-xs">
        <h3 className="text-base sm:text-lg font-bold text-foreground">
          راهنمای فعال‌سازی و تحویل انواع اشتراک‌ها
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-2xl">
          اشتراک‌های مختلف به روش‌های گوناگون (لینک اختصاصی، اکانت آماده با ایمیل و رمز، یا فعال‌سازی مستقیم) تحویل داده می‌شوند. برای اطلاع از روش تحویل سفارش خود، وارد تب «سفارش‌های من» شوید.
        </p>
      </div>

      {/* Delivery Methods Interactive Switcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            روش فعال‌سازی سفارش خود را انتخاب کنید:
          </h4>
          <span className="text-[11px] text-primary font-medium">
            ۳ شیوه اصلی تحویل
          </span>
        </div>

        {/* Method Selector Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {deliveryMethods.map((method) => {
            const Icon = method.icon
            const isSelected = selectedMethod === method.id
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-start transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-primary/60 bg-primary/10 text-primary ring-1 ring-primary/20 shadow-xs'
                    : 'border-border/70 bg-card hover:bg-muted/50 text-foreground'
                }`}
              >
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">{method.shortTitle}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{method.badge}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Active Method Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMethod.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-xs"
          >
            {/* Method Header Info */}
            <div className="border-b border-border/50 pb-3 space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-primary" />
                  {activeMethod.title}
                </h5>
                <Badge variant="outline" className="text-[11px] bg-muted/40 font-medium text-muted-foreground">
                  {activeMethod.examples}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                {activeMethod.description}
              </p>
            </div>

            {/* Steps in this method */}
            <div className="space-y-3">
              {activeMethod.steps.map((step) => (
                <div
                  key={step.number}
                  className="group flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${activeMethod.color} text-white font-black text-xs shadow-xs`}
                  >
                    {step.number}
                  </div>

                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h6 className="text-xs font-bold text-foreground">
                        {step.title}
                      </h6>
                      <span className="text-[10.5px] text-muted-foreground">
                        {step.subtitle}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>

                    <div className="flex items-start gap-1.5 text-[11px] text-primary/90 bg-primary/5 rounded-lg p-2 mt-1.5 border border-primary/10">
                      <Info className="size-3.5 shrink-0 mt-0.5" />
                      <span>{step.tip}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3 Golden Rules / Tips */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="size-3.5 text-primary shrink-0" />
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            ۳ نکته طلایی برای فعال‌سازی موفق و سریع
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
          پرسش‌های متداول فعال‌سازی
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

