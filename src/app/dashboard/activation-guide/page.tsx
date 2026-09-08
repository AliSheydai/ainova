'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
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

// Step-by-step activation guide
const steps = [
  {
    number: '۱',
    title: 'دریافت لینک اختصاصی فعال‌سازی',
    subtitle: 'از بخش «سفارش‌های من» پنل کاربری',
    description:
      'پس از ثبت و پرداخت موفق سفارش، سیستم به صورت کاملاً خودکار یک لینک اختصاصی برای شما صادر می‌کند. وارد بخش سفارش‌ها شده و با کلیک روی دکمه «کپی لینک» یا «باز کردن و فعال‌سازی»، فرآیند را آغاز کنید.',
    badge: 'گام اولیه',
    tip: 'هر لینک منحصراً متعلق به اکانت شما بوده و با یک کلیک فعال‌سازی می‌شود.',
    icon: Sparkles,
    color: 'from-blue-600 to-indigo-600',
  },
  {
    number: '۲',
    title: 'آماده‌سازی مرورگر و ابزار تغییر آی‌پی',
    subtitle: 'پیش‌نیاز ضروری برای کاربران داخل ایران',
    description:
      'به دلیل محدودیت‌های منطقه‌ای شرکت گوگل، پیش از باز کردن لینک حتماً VPN خود را با لوکیشن پایدار (آمریکا، آلمان، انگلیس، ترکیه و...) روشن کنید. اکیداً توصیه می‌شود مرورگر خود را در حالت ناشناس (Incognito) باز کنید تا کش و حساب‌های دیگر تداخل ایجاد نکنند.',
    badge: 'نکته طلایی',
    tip: 'استفاده از حالت Incognito مانع از فعال شدن اشتباه اشتراک روی سایر جیمیل‌های کاری یا فرعی شما می‌شود.',
    icon: Globe,
    color: 'from-amber-500 to-orange-600',
  },
  {
    number: '۳',
    title: 'ورود به حساب گوگل شخصی شما',
    subtitle: 'صرفاً در دامنه رسمی accounts.google.com',
    description:
      'پس از باز کردن لینک، صفحه رسمی گوگل از شما می‌خواهد که با جیمیل خود وارد شوید. توجه فرمایید که نام کاربری و رمز عبور را فقط در صفحه رسمی Google وارد می‌کنید و هیچ شخص ثالثی دسترسی به مشخصات شما ندارد.',
    badge: 'امنیت کامل',
    tip: 'مطمئن شوید همان اکانتی را لاگین می‌کنید که می‌خواهید ۲ ترابایت فضا و هوش مصنوعی روی آن فعال شود.',
    icon: Lock,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    number: '۴',
    title: 'پذیرش دعوت و تایید نهایی اشتراک',
    subtitle: 'تایید عضویت با یک کلیک',
    description:
      'در صفحه اختصاصی Google One که باز می‌شود، خلاصه طرح جمینای (شامل هوش مصنوعی پیشرفته Gemini و ۲ ترابایت فضای ابری) نمایش داده می‌شود. کافیست روی دکمه Accept / Join Family / ادامه کلیک کنید تا اکانت شما بلافاصله عضو شود.',
    badge: 'تایید نهایی',
    tip: 'در صورتی که پیام خوش‌آمدگویی گوگل وان را مشاهده کردید، اشتراک با موفقیت اعمال شده است.',
    icon: CheckCircle2,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    number: '۵',
    title: 'بررسی و بهره‌مندی از امکانات اکانت',
    subtitle: 'تست هوش مصنوعی Gemini Advanced و فضای ۲ ترابایت',
    description:
      'بلافاصله به آدرس gemini.google.com بروید؛ نشان جمینای یا Gemini Advanced را در بالای صفحه مشاهده خواهید کرد. همچنین در Google Drive و Google Photos ظرفیت ۲ ترابایت به سهمیه حساب شما افزوده شده است.',
    badge: 'اتمام مراحل',
    tip: 'از برترین امکانات هوش مصنوعی روز دنیا با سرعت و سقف توکن فوق‌العاده لذت ببرید!',
    icon: Bot,
    color: 'from-violet-600 to-fuchsia-600',
  },
]

// Common issues & Troubleshooting
const faqs = [
  {
    question: 'با خطای «نمی‌توانید عضو گروه خانواده دیگری شوید» (Family Restriction) مواجه شدم، چاره چیست؟',
    answer:
      'طبق قوانین شرکت گوگل، هر اکانت جیمیل در هر ۱۲ ماه فقط یک‌بار مجاز به تغییر گروه خانواده (Family Group) است. اگر قبلاً در فمیلی دیگری بوده‌اید، ساده‌ترین و مطمئن‌ترین راه‌حل این است که یک اکانت جیمیل جدید (ساخت آن کمتر از ۱ دقیقه زمان می‌برد) ایجاد کرده و لینک فعال‌سازی را روی آن استفاده نمایید.',
    severity: 'warning',
  },
  {
    question: 'آیا فایل‌ها، ایمیل‌ها یا عکس‌های شخصی من برای دیگران قابل مشاهده است؟',
    answer:
      'مطلقاً خیر! در اشتراک‌های گوگل، حریم خصوصی به صورت ۱۰۰٪ ایزوله است. هیچ‌کس جز خودتان (حتی مدیر گروه یا پشتیبانی) به فایل‌های Drive، عکس‌های Photos، ایمیل‌ها، چت‌های Gemini و اطلاعات خصوصی شما دسترسی ندارد. فقط حجم فضای اشتراکی به اکانت شما تخصیص می‌یابد.',
    severity: 'success',
  },
  {
    question: 'خطای عدم تطابق کشور / ریجن (Country Association) چیست و چگونه حل می‌شود؟',
    answer:
      'حساب گوگل شما باید ریجن مشخصی داشته باشد که با خدمات فمیلی و AI Pro سازگار باشد (مثلاً آمریکا یا کشورهای اروپایی). اگر کشور اکانت شما ایران باشد، می‌توانید از طریق بخش فرم رسمی تطبیق کشور گوگل (Country Association) یا ایجاد پروفایل پرداخت با آی‌پی مناسب، ریجن را هماهنگ کنید.',
    severity: 'info',
  },
  {
    question: 'لینک فعال‌سازی تا چه زمانی معتبر است؟',
    answer:
      'لینک‌های صادر شده تا زمان فعال‌سازی معتبر هستند؛ اما توصیه می‌کنیم ظرف حداکثر ۲۴ ساعت پس از خرید، اشتراک خود را فعال فرمایید. در صورت هرگونه انقضا یا مشکل فنی، پشتیبانی بدون فوت وقت لینک جدید برای شما صادر خواهد کرد.',
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
                  <Sparkles className="size-3.5" />
                  آموزش جامع و گام‌به‌گام
                </Badge>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-xs gap-1">
                  <ShieldCheck className="size-3.5" />
                  بدون نیاز به رمز عبور
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                راهنمای فعال‌سازی <span className="text-primary">جمینای</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                تمام مراحل و نکات لازم برای فعال‌سازی آنی اشتراک ۱۸ ماهه جمینای و ۲ ترابایت فضای ابری روی جیمیل شخصی خودتان، با حفظ کامل امنیت و حریم خصوصی.
              </p>

              {/* Status chips */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" />
                  <span>زمان لازم: <strong>کمتر از ۲ دقیقه</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="size-4 text-amber-500" />
                  <span>تحویل: <strong>آنی و خودکار</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="size-4 text-emerald-500" />
                  <span>رمز عبور: <strong>هرگز نیاز نیست</strong></span>
                </div>
              </div>
            </div>

            {/* Quick CTA Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <Button asChild className="gap-2 shadow-md shadow-primary/20">
                <Link href="/dashboard/orders">
                  <Sparkles className="size-4" />
                  مشاهده سفارش‌ها و لینک من
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 border-border/80 hover:bg-muted">
                <a
                  href="https://policies.google.com/country-association-form"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="size-4 text-primary" />
                  تست کشور حساب گوگل
                  <ExternalLink className="size-3 opacity-60" />
                </a>
              </Button>
            </div>
          </div>
        </div>


        {/* Step-by-Step Visual Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                <Layers className="size-5 text-primary" />
                مراحل ۵ گانه فعال‌سازی
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                راهنمای تفصیلی هر گام همراه با نکات کلیدی
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              ۵ مرحله ساده
            </Badge>
          </div>

          <div className="space-y-4 relative">
            {steps.map((step, idx) => {
              const IconComponent = step.icon
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col md:flex-row gap-5 p-5 sm:p-6 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-md transition-all"
                >
                  {/* Step Number & Icon */}
                  <div className="flex items-center md:items-start gap-3 md:gap-4 shrink-0">
                    <div
                      className={`flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-gradient-to-tr ${step.color} text-white font-black text-xl shadow-md shadow-primary/20 shrink-0`}
                    >
                      {step.number}
                    </div>
                    <div className="md:hidden">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          {step.title}
                        </h3>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          {step.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 space-y-3">
                    <div className="hidden md:flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">
                            {step.title}
                          </h3>
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                            {step.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.subtitle}
                        </p>
                      </div>

                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <IconComponent className="size-4.5" />
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed text-foreground/80">
                      {step.description}
                    </p>

                    {/* Tip box */}
                    <div className="flex items-start gap-2.5 rounded-xl bg-muted/40 border border-border/50 p-3 text-xs text-muted-foreground">
                      <Info className="size-4 text-primary shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        <strong className="text-foreground">نکته: </strong>
                        {step.tip}
                      </span>
                    </div>
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
                    تضمین امنیت، حریم خصوصی و عدم نیاز به پسورد
                  </h3>
                  <Badge variant="destructive" className="text-[11px]">
                    بسیار مهم
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  <strong>ما هرگز رمز عبور حساب Google شما را نمی‌پرسیم.</strong> فعال‌سازی به طور مستقیم از طریق لینک‌های معتبر گوگل روی اکانت شخصی شما صورت می‌گیرد و اطلاعات شما کاملاً محرمانه و محافظت‌شده باقی می‌ماند.
                </p>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="shrink-0 border-destructive/30 hover:bg-destructive/10 text-destructive gap-1.5 text-xs">
              <Link href="/dashboard/support">
                <HelpCircle className="size-3.5" />
                گزارش یا سوال امنیتی
              </Link>
            </Button>
          </div>

          <Separator className="my-4 bg-destructive/15" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2 text-foreground/80">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span>عدم دسترسی به فایل‌ها و عکس‌های شخصی</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span>بدون نیاز به نام کاربری یا پسورد شما</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
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
                      <div
                        className={`flex size-8 items-center justify-center rounded-xl shrink-0 ${
                          faq.severity === 'warning'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : faq.severity === 'success'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
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
            ابزارها و میانبرهای رسمی گوگل
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Country Association Form */}
            <Card className="border-border/70 hover:border-primary/40 hover:shadow-xs transition-all">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Globe className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">ابزار رسمی</Badge>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">مدیریت کشور اکانت گوگل</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    بررسی کشور تعیین‌شده برای اکانت شما و در صورت نیاز درخواست هماهنگ‌سازی ریجن.
                  </p>
                </div>

                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <a
                    href="https://policies.google.com/country-association-form"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>باز کردن فرم کشور</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Google One Management */}
            <Card className="border-border/70 hover:border-primary/40 hover:shadow-xs transition-all">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Cloud className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">سهمیه فضا</Badge>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">داشبورد Google One</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    بررسی حجم ۲ ترابایتی و وضعیت فضای مصرفی در درایو، جیمیل و عکس‌های گوگل.
                  </p>
                </div>

                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <a
                    href="https://one.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>ورود به گوگل وان</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Gemini AI Pro Direct Link */}
            <Card className="border-border/70 hover:border-primary/40 hover:shadow-xs transition-all">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      <Bot className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px]">هوش مصنوعی</Badge>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">سامانه Gemini Advanced</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    دسترسی مستقیم به مدل پیشرفته Gemini Pro با پنجره زمینه وسیع ۱ میلیون توکن.
                  </p>
                </div>

                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  <a
                    href="https://gemini.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>ورود به جمینای</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Call to Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                آیا هنوز سفارش ثبت‌نشده یا فعال‌نشده‌ای دارید؟
              </h4>
              <p className="text-xs text-muted-foreground">
                از طریق دکمه‌های زیر می‌توانید سفارش‌های قبلی را ببینید یا با پشتیبانی در ارتباط باشید.
              </p>
            </div>
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
                <Sparkles className="size-3.5" />
                سفارش‌های من
              </Link>
            </Button>
          </div>
        </div>
      </Main>
    </>
  )
}
