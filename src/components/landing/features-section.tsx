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
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion'

const features = [
  {
    icon: BrainCircuit,
    tag: 'Gemini 3.1 Pro',
    title: 'مدل فوق‌پیشرفته Gemini 3.1 Pro',
    description:
      'دسترسی به بالاترین قدرت استدلال، تفکر عمیق و کدنویسی؛ امکان تحلیل اسناد حجیم تا ۱۵۰۰ صفحه با پنجره متنی عظیم، به همراه درک فایل‌های ویدیویی و صوتی سنگین.',
  },
  {
    icon: Microscope,
    tag: 'Deep Research',
    title: 'پژوهش خودکار و قابلیت‌های Agentic',
    description:
      'واکاوی مستقل صدها منبع وب با توانمندی‌های Agentic در سرچ گوگل؛ بررسی خودکار رفرنس‌ها و تهیه گزارش‌های پژوهشی، جامع و مستند علمی در چند دقیقه.',
  },
  {
    icon: Clapperboard,
    tag: 'Veo 3.1 & Flow',
    title: 'استودیوی ویدیوسازی با Veo 3.1 و Flow',
    description:
      'خلق ویدیوهای باکیفیت و واقع‌گرایانه با موتور قدرتمند Veo 3.1، صحنه‌پردازی سینمایی با ابزار حرفه‌ای Flow و متحرک‌سازی و تبدیل آنی تصاویر به ویدیو با ابزار Whisk.',
  },
  {
    icon: Palette,
    tag: 'Nano Banana Pro',
    title: 'ساخت تصویر هنری با Nano Banana Pro',
    description:
      'تولید و رندر پیشرفته تصاویر فوق‌واقع‌گرایانه، طراحی پوستر و کانسپت با مدل‌های مدرن تصویری (Nano Banana Pro و Nano Banana 2) با بالاترین رزولوشن و جزئیات بصری.',
  },
  {
    icon: Layers,
    tag: 'Canvas & Gems',
    title: 'محیط تعاملی Canvas و ساخت Gem اختصاصی',
    description:
      'فضای کار هوشمند Canvas برای کدنویسی زنده و نگارش متون تعاملی، به همراه قابلیت ساخت دستیارهای هوش مصنوعی اختصاصی (Gems) با پرامپت و تخصص دلخواه شما.',
  },
  {
    icon: BookOpen,
    tag: 'NotebookLM',
    title: 'دستیار پژوهشی دانشگاهی NotebookLM',
    description:
      'سازمان‌دهی هوشمند مقالات، کتاب‌ها و اسناد دانشگاهی؛ اتصال به منابع دلخواه و تولید خودکار خلاصه‌های تحلیلی و پادکست‌های صوتی گفتگو‌محور از روی جزوه‌های شما.',
  },
  {
    icon: Play,
    tag: 'YouTube AI',
    title: 'چت و خلاصه‌سازی زنده ویدیوهای یوتیوب',
    description:
      'گفتگو و طرح سوال مستقیم حین تماشای ویدیوهای یوتیوب با جمینای؛ استخراج نکات کلیدی، کدهای آموزشی و جمع‌بندی ساعت‌ها آموزش ویدیویی بدون اتلاف وقت.',
  },
  {
    icon: AppWindow,
    tag: 'Workspace & Chrome',
    title: 'جمینای در Gmail، Docs، Vids و کروم',
    description:
      'نگارش و خلاصه‌سازی ایمیل‌ها در جیمیل، تدوین خودکار اسناد در Docs، ساخت اسلاید و ویدیو در Google Vids و بهره‌مندی از دستیار هوشمند درون مرورگر Chrome.',
  },
  {
    icon: HardDrive,
    tag: 'Google One Cloud',
    title: 'حافظه ابری اختصاصی و امن گوگل وان',
    description:
      'فضای ابری پرظرفیت و امن برای پشتیبان‌گیری تمام عکس‌ها، ویدیوها، اسناد و پروژه‌ها در Google Drive، Google Photos و Gmail بدون نگرانی از پر شدن حافظه.',
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
          <h2 className='mb-3 text-2xl font-bold text-foreground sm:text-3xl'>
            با اشتراک جمینای چه امکاناتی به دست می‌آورید؟
          </h2>
          <p className='mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base'>
            دسترسی بدون مرز به قدرتمندترین مدل‌های هوش مصنوعی، استودیوی ساخت ویدیو و تصویر،
            دستیارهای پژوهشی پیشرفته و حافظه ابری گسترده گوگل.
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
              <Card className='group h-full border border-border/60 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5'>
                <CardHeader className='pb-2'>
                  <div className='mb-3 flex items-center justify-between'>
                    <div className='flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-200 group-hover:scale-105 group-hover:bg-primary/15'>
                      <feature.icon className='size-5' />
                    </div>
                    <Badge
                      variant='secondary'
                      className='border border-primary/15 bg-primary/5 text-[11px] font-medium text-primary/90 dir-ltr'
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

