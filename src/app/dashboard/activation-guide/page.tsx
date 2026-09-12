'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Globe,
  Lock,
  ChevronDown,
  Info,
  Clock,
  Cloud,
  Bot,
  MessageCircle,
  Layers,
  ShieldAlert,
  Zap,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// Delivery methods & steps
const deliveryMethods = [
  {
    id: 'link',
    title: 'روش اول: لینک فعال‌سازی و دعوت‌نامه',
    subtitle: 'مانند جمینای ادونس (Google One Family)، پلن‌های تیمی و اشتراکی',
    badge: 'بدون نیاز به پسورد',
    color: 'from-blue-600 to-indigo-600',
    icon: ExternalLink,
    desc: 'در این روش یک لینک دعوت اختصاصی به شما اختصاص می‌یابد تا اشتراک را مستقیماً روی اکانت شخصی خود بدون به اشتراک گذاشتن رمز عبور فعال کنید.',
    steps: [
      {
        number: '۱',
        title: 'دریافت لینک از تب «سفارش‌های من»',
        subtitle: 'کپی لینک یا کلیک روی دکمه فعال‌سازی',
        desc: 'وارد پنل کاربری بخش «سفارش‌های من» شوید و دکمه کپی لینک یا فعال‌سازی را بزنید.',
        tip: 'هر لینک منحصراً متعلق به اکانت شما بوده و یک‌بار مصرف است.',
      },
      {
        number: '۲',
        title: 'اتصال به VPN و باز کردن در حالت ناشناس (Incognito)',
        subtitle: 'پیش‌نیاز ضروری جهت دور زدن تحریم‌ها',
        desc: 'فیلترشکن خود را با لوکیشن معتبر (آمریکا یا اروپا) روشن کنید و ترجیحاً لینک را در پنجره ناشناس مرورگر باز نمایید.',
        tip: 'حالت Incognito از تداخل اکانت‌ها و کش‌های قبلی مرورگر جلوگیری می‌کند.',
      },
      {
        number: '۳',
        title: 'ورود به حساب شخصی و تایید نهایی عضویت',
        subtitle: 'پذیرش عضویت با یک کلیک',
        desc: 'در صفحه رسمی باز شده، وارد اکانت خود شوید و دکمه پذیرش (Accept / Join) را کلیک کنید تا اشتراک فوراً فعال شود.',
        tip: 'پس از تایید، طرح بلافاصله روی حساب شخصی شما فعال می‌شود.',
      },
    ],
  },
  {
    id: 'account',
    title: 'روش دوم: اکانت آماده و اختصاصی',
    subtitle: 'مانند اکانت‌های اختصاصی ChatGPT Plus، Claude Pro و ابزارهای پریمیوم AI',
    badge: 'تحویل فوری مشخصات',
    color: 'from-purple-600 to-indigo-600',
    icon: Lock,
    desc: 'یک حساب کاربری آماده، تمیز و کاملاً اختصاصی همراه با نام کاربری/ایمیل و رمز عبور در پنل به شما تحویل داده می‌شود.',
    steps: [
      {
        number: '۱',
        title: 'دریافت مشخصات ورود از بخش سفارش‌ها',
        subtitle: 'کپی ایمیل و پسورد اختصاصی',
        desc: 'در کارت سفارش شما، ایمیل و رمز عبور قرار دارد. با کلیک روی آیکون کپی، اطلاعات را کپی کنید.',
        tip: 'با آیکون چشم می‌توانید رمز عبور را به صورت واضح مشاهده کنید.',
      },
      {
        number: '۲',
        title: 'روشن کردن VPN و ورود به سایت رسمی سرویس',
        subtitle: 'مراجعه به پلتفرم با آی‌پی خارجی',
        desc: 'فیلترشکن خود را فعال کرده و وارد سایت رسمی سرویس مورد نظر (مانند chatgpt.com یا claude.ai) شوید.',
        tip: 'همیشه از دامنه‌ها و لینک‌های رسمی پلتفرم‌ها برای لاگین استفاده فرمایید.',
      },
      {
        number: '۳',
        title: 'لاگین و بهره‌مندی از امکانات پرمیوم',
        subtitle: 'شروع کار بدون نیاز به ساخت حساب جدید',
        desc: 'با مشخصات دریافتی وارد شوید. اکانت از پیش شارژ شده و تمام قابلیت‌های نسخه پیشرفته در دسترس شماست.',
        tip: 'اکانت به طور کامل در انحصار شماست و تاریخچه و چت‌های شما محفوظ می‌ماند.',
      },
    ],
  },
  {
    id: 'provisioning',
    title: 'روش سوم: فعال‌سازی روی ایمیل شخصی شما',
    subtitle: 'پلن‌هایی که حین خرید، آدرس ایمیل شخصی خود را در فرم ثبت کرده‌اید',
    badge: 'شارژ مستقیم',
    color: 'from-emerald-600 to-teal-600',
    icon: CheckCircle2,
    desc: 'اشتراک توسط سیستم هوشمند یا کارشناسان فنی مستقیماً روی آدرس ایمیل ثبت‌شده شما شارژ و اعمال می‌شود.',
    steps: [
      {
        number: '۱',
        title: 'ثبت ایمیل در مرحله تسویه‌حساب',
        subtitle: 'ثبت آدرس اکانت در فرم سفارش',
        desc: 'در زمان خرید، ایمیل مورد نظرتان را ثبت کرده‌اید و سفارش در مرحله اعمال روی اکانت شما قرار می‌گیرد.',
        tip: 'مطمئن شوید ایمیل وارد شده فعال بوده و به صندوق دریافت آن دسترسی دارید.',
      },
      {
        number: '۲',
        title: 'تکمیل سفارش و ارسال اعلان',
        subtitle: 'اعمال طرح توسط تیم فنی یا سیستم',
        desc: 'طرح روی اکانت شما فعال شده و وضعیت سفارش در پنل به حالت «تکمیل شده» درمی‌آید.',
        tip: 'در صورت نیاز به تایید، ایمیل تاییدیه رسمی از سوی سرویس ارسال خواهد شد.',
      },
      {
        number: '۳',
        title: 'ورود به حساب و استفاده از اشتراک',
        subtitle: 'بهره‌مندی از امکانات پرمیوم',
        desc: 'با ایمیل شخصی خود به سرویس مربوطه وارد شوید؛ اشتراک شما فعال و آماده استفاده است.',
        tip: 'در صورت مشاهده نکردن تغییر، یک‌بار خارج و مجدداً وارد اکانت شوید.',
      },
    ],
  },
]

// Common issues & Troubleshooting
const faqs = [
  {
    question: 'از کجا بفهمم اشتراک من با کدام روش تحویل داده شده است؟',
    answer:
      'در تب «سفارش‌های من»، روی هر سفارش جزئیات تحویل درج شده است: اگر روش لینک باشد، دکمه «کپی لینک»؛ اگر اکانت آماده باشد، «ایمیل و رمز عبور اختصاصی»؛ و اگر فعال‌سازی مستقیم باشد، وضعیت تکمیل سفارش به همراه یادداشت تحویل نمایش داده می‌شود.',
    severity: 'info',
  },
  {
    question: 'آیا فایل‌ها، ایمیل‌ها یا چت‌های شخصی من برای دیگران قابل مشاهده است؟',
    answer:
      'مطلقاً خیر! در تمامی روش‌ها (چه لینک‌های اشتراکی و چه اکانت‌های اختصاصی) حریم خصوصی به صورت ۱۰۰٪ ایزوله است. هیچ‌کس جز خودتان به مکالمات، پروژه‌ها و تاریخچه چت‌های هوش مصنوعی شما دسترسی ندارد.',
    severity: 'success',
  },
  {
    question: 'خطای عدم تطابق کشور یا دسترسی (Region Error / Access Denied) چیست و چگونه حل می‌شود؟',
    answer:
      'به دلیل تحریم‌های ارائه‌دهندگان، آی‌پی اتصال شما باید خارج از ایران باشد. اگر با این خطا مواجه شدید، لوکیشن VPN خود را به آمریکا یا آلمان تغییر دهید، کش مرورگر را پاک کنید یا صفحه را در پنجره ناشناس (Incognito) باز کنید.',
    severity: 'warning',
  },
  {
    question: 'برای اشتراک‌های گوگل، خطای Family Restriction چیست و چه راهکاری دارد؟',
    answer:
      'طبق قوانین شرکت گوگل، هر جیمیل در هر ۱۲ ماه فقط یک‌بار مجاز به تغییر گروه خانواده (Family Group) است. اگر قبلاً در فمیلی دیگری بوده‌اید، ساده‌ترین و سریع‌ترین راهکار ساخت یک جیمیل تازه (کمتر از ۱ دقیقه) و فعال‌سازی لینک روی آن است.',
    severity: 'warning',
  },
  {
    question: 'در صورت بروز هرگونه مشکل در فعال‌سازی چگونه پیگیری کنم؟',
    answer:
      'تیم پشتیبانی ما همه‌روزه آماده پاسخگویی به شماست. از طریق بخش «پشتیبانی» با کارشناسان ما در ارتباط باشید؛ تمام سفارش‌ها دارای گارانتی کامل و ضمانت تعویض هستند.',
    severity: 'info',
  },
]

export default function ActivationGuidePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="flex flex-col gap-8 p-4 sm:p-6 max-w-5xl mx-auto w-full pb-16">
        {/* Hero Section with Vibrant Gradient & Badges */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 shadow-sm">
          <div className="absolute -top-24 -left-24 size-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1 text-xs gap-1.5 shadow-sm">
                  آموزش جامع و گام‌به‌گام
                </Badge>
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs gap-1">
                  <ShieldCheck className="size-3.5" />
                  حفظ کامل حریم خصوصی
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                راهنمای فعال‌سازی <span className="text-primary">انواع اشتراک‌ها</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                راهنمای جامع، ساده و گام‌به‌گام برای فعال‌سازی آنی انواع اشتراک‌های هوش مصنوعی و دیجیتال (ChatGPT, Gemini, Claude و...) با حفظ کامل امنیت، اصالت و حریم خصوصی.
              </p>

              {/* Status chips */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" />
                  <span>زمان لازم: <strong>کمتر از ۲ دقیقه</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="size-4 text-primary" />
                  <span>تحویل: <strong>آنی و خودکار</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="size-4 text-primary" />
                  <span>رمز شخصی: <strong>هرگز نیاز نیست</strong></span>
                </div>
              </div>
            </div>

            {/* Quick CTA Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <Button asChild className="gap-2 shadow-md shadow-primary/20">
                <Link href="/dashboard/orders">
                  مشاهده سفارش‌ها و اطلاعات تحویل
                </Link>
              </Button>
            </div>
          </div>
        </div>


        {/* Step-by-Step Delivery Methods */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              روش‌های ۳ گانه فعال‌سازی سفارش‌ها
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              روش فعال‌سازی مربوط به سفارش شما در تب «سفارش‌های من» مشخص شده است
            </p>
          </div>

          <div className="space-y-6">
            {deliveryMethods.map((method) => {
              const MethodIcon = method.icon
              return (
                <div
                  key={method.id}
                  className="rounded-3xl border border-border/80 bg-card p-5 sm:p-7 space-y-4 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr ${method.color} text-white shadow-xs`}>
                        <MethodIcon className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground">
                          {method.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {method.subtitle}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold px-3 py-1 w-fit bg-primary/5 text-primary border-primary/25">
                      {method.badge}
                    </Badge>
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {method.desc}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {method.steps.map((step) => (
                      <div
                        key={step.number}
                        className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-xs">
                              {step.number}
                            </span>
                            <h4 className="text-xs font-bold text-foreground">
                              {step.title}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {step.desc}
                          </p>
                        </div>

                        <div className="flex items-start gap-1.5 text-[11px] text-primary/90 bg-primary/5 rounded-lg p-2 border border-primary/10 mt-2">
                          <Info className="size-3.5 shrink-0 mt-0.5" />
                          <span>{step.tip}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Security & Privacy Commitment Banner */}
        <div className="rounded-2xl border border-destructive/20 bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent p-6 sm:p-7">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive shrink-0">
                <ShieldAlert className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    تضمین اصالت، پایداری و حفظ کامل حریم خصوصی
                  </h3>
                  <Badge variant="destructive" className="text-[11px]">
                    بسیار مهم
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  <strong>ما هرگز رمز عبور حساب شخصی شما را نمی‌پرسیم.</strong> تمامی سفارش‌ها با بالاترین استانداردهای امنیتی، به صورت رسمی و قانونی فعال می‌شوند و تاریخچه چت‌ها، فایل‌ها و پروژه‌های شما کاملاً محرمانه باقی می‌مانند.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="shrink-0 border-destructive/30 hover:bg-destructive/10 text-destructive gap-1.5 text-xs">
              <Link href="/dashboard/support">
                <HelpCircle className="size-3.5" />
                پشتیبانی و ضمانت
              </Link>
            </Button>
          </div>

          <Separator className="my-4 bg-destructive/15" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2 text-foreground/80">
              <CheckCircle2 className="size-4 text-primary shrink-0" />
              <span>عدم دسترسی دیگران به چت‌ها و فایل‌های شخصی</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <CheckCircle2 className="size-4 text-primary shrink-0" />
              <span>بدون نیاز به رمز عبور اکانت‌های شخصی شما</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <CheckCircle2 className="size-4 text-primary shrink-0" />
              <span>پشتیبانی و ضمانت تعویض در صورت بروز مشکل</span>
            </div>
          </div>
        </div>

        {/* Troubleshooting & FAQs (Accordion) */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" />
              خطاهای متداول و راه‌حل‌های فوری
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              پاسخ به سوالات و خطاهایی که ممکن است در حین فعال‌سازی با آنها مواجه شوید
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <Collapsible
                  key={idx}
                  open={isOpen}
                  onOpenChange={(open) => setOpenFaq(open ? idx : null)}
                  className="rounded-2xl border border-border/70 bg-card overflow-hidden transition-all"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between p-4 sm:p-5 text-start hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-xl shrink-0 bg-primary/10 text-primary">
                        {faq.severity === 'warning' ? (
                          <AlertTriangle className="size-4" />
                        ) : faq.severity === 'success' ? (
                          <ShieldCheck className="size-4" />
                        ) : (
                          <Info className="size-4" />
                        )}
                      </div>
                      <span className="text-sm sm:text-base font-bold text-foreground">
                        {faq.question}
                      </span>
                    </div>

                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform duration-200 shrink-0 ms-2 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="border-t border-border/50 bg-muted/15 p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        </div>

        {/* Useful Quick Links & Service Shortcuts */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="size-5 text-primary" />
            میانبرهای ورود به سرویس‌های هوش مصنوعی
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ChatGPT Direct Link */}
            <Card className="border-border/70 hover:border-primary/40 hover:shadow-xs transition-all">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Bot className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">OpenAI</Badge>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">ورود به ChatGPT</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    دسترسی مستقیم به سامانه چت‌جی‌پی‌تی و مدل‌های پیشرفته GPT-4o و o1.
                  </p>
                </div>

                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <a
                    href="https://chatgpt.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>ورود به ChatGPT</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Gemini AI Direct Link */}
            <Card className="border-border/70 hover:border-primary/40 hover:shadow-xs transition-all">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Bot className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">Google</Badge>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">ورود به Google Gemini</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    دسترسی مستقیم به مدل پیشرفته Gemini Advanced با ۲ ترابایت فضای ابری.
                  </p>
                </div>

                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>ورود به Gemini</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Claude AI Direct Link */}
            <Card className="border-border/70 hover:border-primary/40 hover:shadow-xs transition-all">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Bot className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">Anthropic</Badge>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">ورود به Claude</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    دسترسی به دستیار هوشمند Claude Pro و مدل‌های Sonnet برای کدنویسی و تحلیل متن.
                  </p>
                </div>

                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <a
                    href="https://claude.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>ورود به Claude</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Call to Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-primary/5">
          <div>
            <h4 className="text-sm font-bold text-foreground">
              آیا هنوز سفارش ثبت‌نشده یا فعال‌نشده‌ای دارید؟
            </h4>
            <p className="text-xs text-muted-foreground">
              از طریق دکمه‌های زیر می‌توانید سفارش‌های قبلی را ببینید یا با پشتیبانی در ارتباط باشید.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none gap-1.5 text-xs">
              <Link href="/dashboard/support">
                <MessageCircle className="size-3.5" />
                پشتیبانی آنلاین
              </Link>
            </Button>
            <Button asChild size="sm" className="flex-1 sm:flex-none gap-1.5 text-xs shadow-sm">
              <Link href="/dashboard/orders">
                سفارش‌های من
              </Link>
            </Button>
          </div>
        </div>
      </Main>
    </>
  )
}
