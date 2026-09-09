'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Globe,
  Lock,
  ChevronDown,
  Info,
  Clock,
  Bot,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const steps = [
  {
    number: '۱',
    title: 'دریافت لینک اختصاصی فعال‌سازی',
    subtitle: 'از تب «سفارش‌های من»',
    description:
      'پس از ثبت سفارش، سیستم خودکار لینک اختصاصی برای شما صادر می‌کند. از تب «سفارش‌های من» روی «کپی لینک» یا «فعال‌سازی» کلیک کنید.',
    badge: 'گام ۱',
    tip: 'هر لینک منحصراً برای شما بوده و بدون نیاز به رمز عبور اکانت فعال می‌شود.',
    icon: Sparkles,
    color: 'from-blue-600 to-indigo-600',
  },
  {
    number: '۲',
    title: 'روشن کردن VPN با آی‌پی پایدار',
    subtitle: 'پیش‌نیاز ضروری برای دسترسی بدون محدودیت',
    description:
      'به دلیل محدودیت‌های منطقه‌ای شرکت گوگل، پیش از باز کردن لینک حتماً VPN با لوکیشن پایدار (آمریکا، آلمان، انگلیس و...) روشن کنید. ترجیحاً از حالت Incognito (ناشناس) مرورگر استفاده کنید.',
    badge: 'گام ۲',
    tip: 'استفاده از حالت Incognito از تداخل جیمیل‌های کاری با جیمیل اصلی جلوگیری می‌کند.',
    icon: Globe,
    color: 'from-sky-600 to-blue-600',
  },
  {
    number: '۳',
    title: 'ورود به حساب گوگل شخصی شما',
    subtitle: 'فقط در دامنه رسمی accounts.google.com',
    description:
      'پس از باز کردن لینک، صفحه رسمی گوگل باز می‌شود. شما فقط روی دامنه رسمی Google نام کاربری و رمز خود را وارد می‌کنید و هیچ شخص دیگری دسترسی به رمز شما ندارد.',
    badge: 'گام ۳',
    tip: 'دقت کنید همان حسابی را انتخاب کنید که می‌خواهید اشتراک روی آن فعال شود.',
    icon: Lock,
    color: 'from-blue-700 to-indigo-700',
  },
  {
    number: '۴',
    title: 'پذیرش دعوت و تأیید نهایی عضویت',
    subtitle: 'تأیید عضویت با یک کلیک',
    description:
      'در صفحه اختصاصی Google One، خلاصه طرح (۲ ترابایت فضا و هوش مصنوعی جمینای ادونس) نمایش داده می‌شود. کافیست روی دکمه Accept یا عضویت کلیک فرمایید.',
    badge: 'گام ۴',
    tip: 'پس از مشاهده پیام خوش‌آمدگویی Google One، اشتراک فعال شده است.',
    icon: CheckCircle2,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    number: '۵',
    title: 'بهره‌مندی از امکانات جمینای ادونس',
    subtitle: 'تست در gemini.google.com و Google Drive',
    description:
      'بلافاصله به آدرس gemini.google.com بروید؛ نشان پیشرفته جمینای فعال شده است. همچنین ۲ ترابایت فضا در Google Drive و Google Photos برای شما در دسترس است.',
    badge: 'گام ۵',
    tip: 'از سقف بالای توکن و ابزارهای تولید محتوا و کدنویسی بهره ببرید!',
    icon: Bot,
    color: 'from-violet-600 to-fuchsia-600',
  },
]

const faqs = [
  {
    question: 'با خطای Family Restriction (محدودیت سالانه خانواده) مواجه شدم، چاره چیست؟',
    answer:
      'طبق قوانین گوگل، هر اکانت در هر ۱۲ ماه فقط ۱ بار امکان تغییر گروه خانواده دارد. اگر قبلاً در فمیلی دیگری بوده‌اید، ساده‌ترین و مطمئن‌ترین راه‌حل ساخت یک اکانت جیمیل جدید (کمتر از ۱ دقیقه) و فعال‌سازی لینک روی آن است.',
  },
  {
    question: 'آیا فایل‌ها، عکس‌ها یا چت‌های شخصی من برای کسی قابل مشاهده است؟',
    answer:
      'مطلقاً خیر! حریم خصوصی در گوگل کاملاً ایزوله است. هیچ‌کس جز شخص خودتان به درایو، عکس‌ها، ایمیل‌ها یا چت‌های هوش مصنوعی شما دسترسی ندارد.',
  },
  {
    question: 'خطای عدم تطابق کشور / ریجن چیست و چگونه حل می‌شود؟',
    answer:
      'کشور حساب گوگل شما باید با سرویس‌های خانواده سازگار باشد. با روشن کردن VPN پایدار و در صورت لزوم ساخت یک پروفایل پرداخت جدید در pay.google.com ریجن هماهنگ خواهد شد.',
  },
]

interface ActivationGuideTabProps {
  onGoToOrders?: () => void
}

export function ActivationGuideTab({ onGoToOrders }: ActivationGuideTabProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge className="bg-primary text-primary-foreground text-xs gap-1">
            <Sparkles className="size-3" />
            آموزش ۵ مرحله‌ای
          </Badge>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs gap-1">
            <ShieldCheck className="size-3" />
            بدون نیاز به پسورد
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            <Clock className="size-3 ml-1" />
            زمان: کمتر از ۲ دقیقه
          </Badge>
        </div>
        <h3 className="text-base font-bold text-foreground">
          راهنمای فعال‌سازی اشتراک قانونی جمینای
        </h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          برای فعال‌سازی اشتراک، کافیست لینک دریافتی را با VPN فعال در مرورگر باز کنید و مراحل زیر را گام‌به‌گام پیش ببرید.
        </p>

        {onGoToOrders && (
          <Button
            size="sm"
            onClick={onGoToOrders}
            className="mt-3 gap-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground shadow-xs"
          >
            <Sparkles className="size-3.5" />
            مشاهده سفارش‌ها و کپی لینک فعال‌سازی
          </Button>
        )}
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
          مراحل فعال‌سازی گام‌به‌گام
        </h4>

        {steps.map((step) => {
          const Icon = step.icon
          return (
            <Card key={step.number} className="border-border/70 overflow-hidden shadow-xs">
              <CardContent className="p-4 sm:p-4.5">
                <div className="flex items-start gap-3.5">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${step.color} text-white font-bold text-sm shadow-sm`}>
                    <Icon className="size-5" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h5 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <span className="text-primary font-sans font-black">{step.number}.</span>
                        {step.title}
                      </h5>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {step.subtitle}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>

                    <div className="flex items-start gap-1.5 text-[11px] text-primary/90 bg-primary/5 rounded-lg p-2 mt-2 border border-primary/10">
                      <Info className="size-3.5 shrink-0 mt-0.5" />
                      <span>{step.tip}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQs Section */}
      <div className="space-y-3 pt-2">
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
                className="rounded-xl border border-border/70 overflow-hidden bg-card"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-3.5 text-right text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
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
