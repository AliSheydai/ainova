'use client'

import {
  AppWindow,
  BookOpen,
  BrainCircuit,
  Clapperboard,
  HardDrive,
  Layers,
  Microscope,
  Palette,
  Play,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion'

const features = [
  {
    icon: BrainCircuit,
    tag: 'Next-Gen Models',
    title: 'مدل‌های فوق‌پیشرفته هوش مصنوعی',
    description:
      'دسترسی به بالاترین قدرت استدلال، تفکر عمیق و کدنویسی؛ امکان تحلیل اسناد حجیم، پروژه‌های فنی و فهم دقیق فایل‌های ویدیویی، متنی و صوتی سنگین.',
  },
  {
    icon: Microscope,
    tag: 'Deep Research',
    title: 'پژوهش خودکار و قابلیت‌های Agentic',
    description:
      'واکاوی مستقل صدها منبع وب با ابزارهای خودکار پژوهشی؛ بررسی عمیق رفرنس‌ها و تهیه گزارش‌های مستند، علمی و کاربردی در کوتاه‌ترین زمان.',
  },
  {
    icon: Clapperboard,
    tag: 'Video Studio',
    title: 'استودیوی ویدیوسازی و متحرک‌سازی',
    description:
      'خلق ویدیوهای باکیفیت و صحنه‌پردازی سینمایی با مدل‌های پیشرو (مانند Veo 3.1 و Flow)؛ تبدیل آنی ایده‌های متنی و تصاویر ثابت به ویدیوهای متحرک.',
  },
  {
    icon: Palette,
    tag: 'Image Generation',
    title: 'طراحی گرافیک و تولید تصویر هنری',
    description:
      'رندر پیشرفته تصاویر فوق‌واقع‌گرایانه، طراحی پوستر و کانسپت با مدرن‌ترین موتورهای هوش تصویری در بالاترین رزولوشن و دقیق‌ترین جزئیات بصری.',
  },
  {
    icon: Layers,
    tag: 'Canvas & Custom Bots',
    title: 'محیط تعاملی کار و ساخت دستیار اختصاصی',
    description:
      'فضای کار هوشمند Canvas برای برنامه‌نویسی زنده و نگارش متون تعاملی، همراه با قابلیت شخصی‌سازی دستیارهای اختصاصی متناسب با اهداف کاری شما.',
  },
  {
    icon: BookOpen,
    tag: 'Smart Research',
    title: 'دستیار مطالعاتی و دانشگاهی هوشمند',
    description:
      'سازمان‌دهی هوشمند مقالات، کتاب‌ها و اسناد دانشگاهی؛ اتصال به منابع دلخواه و تولید خلاصه‌های تحلیلی و پادکست‌های صوتی گفتگو‌محور از روی جزوات.',
  },
  {
    icon: Play,
    tag: 'Video Analytics',
    title: 'چت و خلاصه‌سازی هوشمند ویدیوها',
    description:
      'گفتگو و طرح سوال پیرامون محتوای ویدیوهای آموزشی و یوتیوب؛ استخراج سرفصل‌ها، نکات کلیدی و کدهای آموزشی بدون اتلاف وقت.',
  },
  {
    icon: AppWindow,
    tag: 'Workspace & Web',
    title: 'یکپارچگی با ابزارهای اداری و مرورگر',
    description:
      'نگارش و خلاصه‌سازی ایمیل‌ها، تدوین اسناد متنی، ساخت ارائه‌ها و اسلایدها با دستیار هوشمند درون محیط کاربری و مرورگر وب.',
  },
  {
    icon: HardDrive,
    tag: 'Cloud Storage',
    title: 'فضای ذخیره‌سازی ابری پرظرفیت و امن',
    description:
      'بهره‌مندی از حجم بالای فضای ابری مطمئن برای پشتیبان‌گیری تمام عکس‌ها، ویدیوها، پروژه‌ها و اسناد اداری بدون دغدغه محدودیت حافظه.',
  },
]

export function FeaturesSection() {
  return (
    <section id='features' className='py-20 md:py-24'>
      <div className='container mx-auto px-4 sm:px-6'>
        {/* Header */}
        <motion.div
          className='mb-12 text-center'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <div className='mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary'>
            <Sparkles className='size-3.5' />
            <span>امکانات و توانمندی‌ها</span>
          </div>
          <h2 className='mb-3 text-2xl font-bold text-foreground sm:text-3xl'>
            با اشتراک‌های هوش مصنوعی چه امکاناتی به دست می‌آورید؟
          </h2>
          <p className='mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base'>
            دسترسی نامحدود به قدرتمندترین مدل‌های استدلال و کدنویسی جهان، استودیوهای تولید ویدیو و تصویر،
            دستیارهای پژوهشی پیشرفته و زیرساخت ابری اختصاصی.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={staggerContainer(0.06)}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Card className='group h-full border border-border/70 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'>
                <CardHeader className='pb-2'>
                  <div className='mb-3 flex items-center justify-between'>
                    <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-200 group-hover:scale-105 group-hover:bg-primary/15'>
                      <feature.icon className='size-5' />
                    </div>
                    <Badge
                      variant='secondary'
                      className='border border-primary/20 bg-primary/10 text-[11px] font-medium text-primary dir-ltr'
                    >
                      {feature.tag}
                    </Badge>
                  </div>
                  <h3 className='text-base font-semibold text-foreground transition-colors duration-200 group-hover:text-primary'>
                    {feature.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className='text-sm leading-relaxed text-muted-foreground'>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

