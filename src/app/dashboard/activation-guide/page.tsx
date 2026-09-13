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
  MessageCircle,
  Layers,
  ShieldAlert,
  Zap,
  Mail,
  Warehouse,
  User,
  Key,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// Common issues & Troubleshooting
const faqs = [
  {
    question: 'فروشگاه در حال حاضر چه پلن‌هایی ارائه می‌دهد و تفاوت آنها چیست؟',
    answer:
      'در حال حاضر ۲ پلن اصلی ارائه می‌شود: ۱) «پلن لینک فعال‌سازی آنی»: اشتراک از طریق لینک دعوت اختصاصی بدون نیاز به رمز عبور، مستقیماً روی اکانت شخصی شما فعال می‌شود. ۲) «پلن اکانت روی ایمیل»: که در آن می‌توانید یا اکانت آماده از انبار (ایمیل و پسورد با تحویل فوری) بگیرید یا جیمیل خودتان را ثبت کنید تا اشتراک مستقیماً روی آن فعال شود.',
    severity: 'info',
  },
  {
    question: 'در پلن اکانت روی ایمیل، تفاوت «اکانت آماده» با «فعال‌سازی روی ایمیل شخصی» چیست؟',
    answer:
      'در حالت اکانت آماده از انبار، بلافاصله پس از پرداخت یک ایمیل و رمز عبور اختصاصی و نو تحویل می‌گیرید که اشتراک از قبل روی آن فعال است. در حالت ایمیل شخصی، شما جیمیل خودتان را در فرم تسویه‌حساب وارد می‌کنید تا فعال‌سازی مستقیماً توسط تیم فنی روی همان اکانت شخصی شما انجام گردد.',
    severity: 'info',
  },
  {
    question: 'آیا چت‌ها، فایل‌ها و اطلاعات شخصی من برای دیگران قابل مشاهده است؟',
    answer:
      'مطلقاً خیر! در هر دو روش (چه لینک‌های اشتراکی و چه اکانت‌های اختصاصی) حریم خصوصی به صورت ۱۰۰٪ ایزوله است. هیچ‌کس جز خودتان به مکالمات، پروژه‌ها و تاریخچه چت‌های هوش مصنوعی و فایل‌های ابری شما دسترسی ندارد.',
    severity: 'success',
  },
  {
    question: 'آیا در پلن اکانت آماده، امکان تغییر رمز عبور وجود دارد؟',
    answer:
      'بله ۱۰۰٪! اکانت‌های آماده انبار کاملاً اختصاصی و نو هستند و پس از تحویل می‌توانید رمز عبور، شماره تلفن و ایمیل بازیابی آن را به دلخواه خود تغییر دهید.',
    severity: 'success',
  },
  {
    question: 'خطای عدم تطابق کشور یا دسترسی (Region Error / Access Denied) چیست و چگونه حل می‌شود؟',
    answer:
      'به دلیل تحریم‌های ارائه‌دهندگان، آی‌پی اتصال شما باید خارج از ایران باشد. اگر با این خطا مواجه شدید، لوکیشن VPN خود را به آمریکا یا اروپا تغییر دهید، کش مرورگر را پاک کنید یا صفحه را در پنجره ناشناس (Incognito) باز کنید.',
    severity: 'warning',
  },
  {
    question: 'برای اشتراک‌های گوگل، خطای Family Restriction چیست و چه راهکاری دارد؟',
    answer:
      'طبق قوانین شرکت گوگل، هر جیمیل در هر ۱۲ ماه فقط یک‌بار مجاز به تغییر گروه خانواده (Family Group) است. اگر قبلاً در فمیلی دیگری بوده‌اید، ساده‌ترین و سریع‌ترین راهکار ساخت یک جیمیل تازه (کمتر از ۱ دقیقه) و فعال‌سازی لینک روی آن است، یا می‌توانید از پلن اکانت روی ایمیل استفاده نمایید.',
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
  const [emailPlanTab, setEmailPlanTab] = useState<'inventory' | 'own'>('inventory')

  return (
    <>
      <Header>
        <div className="ms-auto flex items-center gap-2">
          <ThemeSwitch />
        </div>
      </Header>

      <Main className="flex flex-col gap-8 p-4 sm:p-6 max-w-5xl mx-auto w-full pb-16">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 shadow-sm">
          <div className="absolute -top-24 -left-24 size-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 size-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-primary text-primary-foreground font-semibold px-3 py-1 text-xs gap-1.5 shadow-sm">
                  آموزش جامع ۲ پلن فروشگاه
                </Badge>
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs gap-1">
                  <ShieldCheck className="size-3.5" />
                  حفظ کامل حریم خصوصی
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                راهنمای فعال‌سازی <span className="text-primary">اشتراک‌های فروشگاه</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                کلیه محصولات در قالب <strong>۲ پلن تعریف‌شده</strong> عرضه می‌شوند: لینک فعال‌سازی آنی (بدون نیاز به پسورد) و اکانت اختصاصی روی ایمیل (آماده یا روی جیمیل شما).
              </p>

              {/* Status chips */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" />
                  <span>زمان فعال‌سازی: <strong>کمتر از ۱ دقیقه</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="size-4 text-primary" />
                  <span>تحویل: <strong>آنی و خودکار</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="size-4 text-primary" />
                  <span>حریم خصوصی: <strong>۱۰۰٪ تضمین‌شده</strong></span>
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
              روش‌های ۲ گانه فعال‌سازی سفارش‌ها
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              روش فعال‌سازی مربوط به سفارش شما در کارت هر سفارش در تب «سفارش‌های من» مشخص شده است
            </p>
          </div>

          <div className="space-y-6">
            {/* PLAN 1: INSTANT ACTIVATION LINK */}
            <div className="rounded-3xl border border-blue-500/30 bg-card p-5 sm:p-7 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
                    <Zap className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      پلن اول: لینک فعال‌سازی آنی (Google One Family)
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      اتصال مستقیم به اکانت شخصی شما با یک کلیک • بدون نیاز به ارسال رمز عبور
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-semibold px-3 py-1 w-fit bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
                  تحویل ۰ ثانیه • بدون نیاز به پسورد
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                در این روش یک لینک دعوت اختصاصی بلافاصله پس از پرداخت صادر می‌شود. شما کافیست لینک را با VPN روشن در مرورگر باز کرده و با جیمیل شخصی خود عضویت را بپذیرید.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                        ۱
                      </span>
                      <h4 className="text-xs font-bold text-foreground">
                        دریافت لینک از تب «سفارش‌های من»
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      وارد بخش «سفارش‌های من» شوید و دکمه کپی لینک یا فعال‌سازی در گوگل را بزنید.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/5 rounded-lg p-2 border border-blue-500/15 mt-2">
                    <Info className="size-3.5 shrink-0 mt-0.5" />
                    <span>هر لینک منحصراً متعلق به اکانت شما بوده و یک‌بار مصرف است.</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                        ۲
                      </span>
                      <h4 className="text-xs font-bold text-foreground">
                        اتصال به VPN و حالت ناشناس (Incognito)
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      فیلترشکن خود را با لوکیشن معتبر (آمریکا یا اروپا) روشن کنید و ترجیحاً لینک را در پنجره ناشناس مرورگر باز فرمایید.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/5 rounded-lg p-2 border border-blue-500/15 mt-2">
                    <Info className="size-3.5 shrink-0 mt-0.5" />
                    <span>حالت ناشناس از تداخل اکانت‌ها و کش‌های قبلی مرورگر جلوگیری می‌کند.</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xs">
                        ۳
                      </span>
                      <h4 className="text-xs font-bold text-foreground">
                        ورود به اکانت و تایید نهایی عضویت
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      در صفحه رسمی گوگل، وارد اکانت خود شده و دکمه پذیرش (Accept / Join) را کلیک کنید تا اشتراک فوراً فعال شود.
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/5 rounded-lg p-2 border border-blue-500/15 mt-2">
                    <Info className="size-3.5 shrink-0 mt-0.5" />
                    <span>طرح و فضای ابری بلافاصله روی همان اکانت شخصی فعال می‌گردد.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PLAN 2: ON EMAIL (READY ACCOUNT OR USER EMAIL) */}
            <div className="rounded-3xl border border-purple-500/30 bg-card p-5 sm:p-7 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground">
                      پلن دوم: اکانت اختصاصی روی ایمیل
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ارائه اکانت آماده نو از انبار یا فعال‌سازی مستقیم روی ایمیل شخصی شما
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-semibold px-3 py-1 w-fit bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">
                  ۲ حالت تحویل به انتخاب خریدار
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                این پلن بسته به انتخابی که در صفحه تسویه‌حساب انجام داده‌اید، به یکی از دو شیوه زیر تحویل داده می‌شود:
              </p>

              {/* Sub-mode selector tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-xl border border-border/60 max-w-xl">
                <button
                  type="button"
                  onClick={() => setEmailPlanTab('inventory')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    emailPlanTab === 'inventory'
                      ? 'bg-background text-purple-700 dark:text-purple-300 shadow-xs border border-purple-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Warehouse className="size-3.5 shrink-0" />
                  <span>حالت اول: اکانت آماده انبار (تحویل فوری)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEmailPlanTab('own')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    emailPlanTab === 'own'
                      ? 'bg-background text-purple-700 dark:text-purple-300 shadow-xs border border-purple-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="size-3.5 shrink-0" />
                  <span>حالت دوم: فعال‌سازی روی ایمیل شما</span>
                </button>
              </div>

              {emailPlanTab === 'inventory' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs leading-relaxed text-purple-900 dark:text-purple-200">
                    <strong>آموزش اکانت آماده:</strong> بلافاصله پس از پرداخت، مشخصات ورود (ایمیل و رمز عبور اختصاصی) در کارت سفارش به شما نشان داده می‌شود.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-xl bg-purple-600 text-white font-black text-xs">
                            ۱
                          </span>
                          <h4 className="text-xs font-bold text-foreground">
                            برداشتن ایمیل و رمز ورود از پنل
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          در کارت سفارش، نام کاربری و پسورد قرار دارد. با کلیک روی آیکون کپی، مشخصات را بردارید.
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 bg-purple-500/5 rounded-lg p-2 border border-purple-500/15 mt-2">
                        <Info className="size-3.5 shrink-0 mt-0.5" />
                        <span>با زدن آیکون چشم رمز عبور نمایان می‌شود.</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-xl bg-purple-600 text-white font-black text-xs">
                            ۲
                          </span>
                          <h4 className="text-xs font-bold text-foreground">
                            روشن کردن فیلترشکن و لاگین
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          VPN پایدار را روشن کرده و وارد سایت رسمی سرویس مربوطه شوید و با مشخصات دریافتی لاگین فرمایید.
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 bg-purple-500/5 rounded-lg p-2 border border-purple-500/15 mt-2">
                        <Info className="size-3.5 shrink-0 mt-0.5" />
                        <span>همواره از آدرس‌های رسمی برای ورود استفاده نمایید.</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-xl bg-purple-600 text-white font-black text-xs">
                            ۳
                          </span>
                          <h4 className="text-xs font-bold text-foreground">
                            امکان تغییر رمز و مالکیت ۱۰۰٪
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          پلن فعال است. می‌توانید پس از اولین ورود، رمز عبور را به دلخواه خود تغییر داده و شماره بازیابی اضافه کنید.
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 bg-purple-500/5 rounded-lg p-2 border border-purple-500/15 mt-2">
                        <Info className="size-3.5 shrink-0 mt-0.5" />
                        <span>اکانت کاملاً در انحصار شما و تاریخچه آن محفوظ است.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed text-emerald-900 dark:text-emerald-200">
                    <strong>آموزش فعال‌سازی روی ایمیل شما:</strong> در زمان خرید جیمیل خودتان را ثبت کرده‌اید و اشتراک مستقیماً توسط پشتیبانی روی همان اکانت شارژ می‌شود.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs">
                            ۱
                          </span>
                          <h4 className="text-xs font-bold text-foreground">
                            ثبت مشخصات در فرم خرید
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          در مرحله تسویه‌حساب، ایمیل شخصی خودتان را ثبت کرده‌اید و سفارش در مرحله اعمال قرار گرفته است.
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/15 mt-2">
                        <Info className="size-3.5 shrink-0 mt-0.5" />
                        <span>اطمینان حاصل کنید که به صندوق این ایمیل دسترسی دارید.</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs">
                            ۲
                          </span>
                          <h4 className="text-xs font-bold text-foreground">
                            اعمال اشتراک و تکمیل سفارش
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          طرح توسط کارشناسان روی اکانت شما فعال شده و وضعیت سفارش در پنل به «تکمیل شده» تغییر می‌یابد.
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/15 mt-2">
                        <Info className="size-3.5 shrink-0 mt-0.5" />
                        <span>در صورت نیاز، ایمیل تاییدیه رسمی ارسال خواهد شد.</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs">
                            ۳
                          </span>
                          <h4 className="text-xs font-bold text-foreground">
                            ورود به اکانت و استفاده آسان
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          با همان ایمیل شخصی خود به سرویس وارد شوید؛ اشتراک شما فعال و آماده استفاده است.
                        </p>
                      </div>
                      <div className="flex items-start gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-lg p-2 border border-emerald-500/15 mt-2">
                        <Info className="size-3.5 shrink-0 mt-0.5" />
                        <span>در صورت عدم مشاهده تغییر، یک‌بار خارج و مجدداً وارد شوید.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
              <span>بدون نیاز به رمز عبور در پلن لینک آنی</span>
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
