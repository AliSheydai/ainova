'use client'

import {
  BookMarked,
  BrainCircuit,
  Cpu,
  FileText,
  HardDrive,
  Microscope,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/motion'

const features = [
  {
    icon: BrainCircuit,
    title: 'دستیار هوشمند جمینای',
    description:
      'پاسخ‌دهی دقیق به سوالات پیچیده، ایده‌پردازی، کدنویسی و نگارش حرفه‌ای با قوی‌ترین مدل‌های هوش مصنوعی.',
  },
  {
    icon: Microscope,
    title: 'پژوهش و تحلیل عمیق',
    description:
      'جستجو و بررسی خودکار منابع مختلف وب و آماده‌سازی گزارش‌های تحلیلی، جامع و دقیق برای کارهای علمی و کاری.',
  },
  {
    icon: FileText,
    title: 'هوش مصنوعی در ابزارهای گوگل',
    description:
      'نگارش و خلاصه‌سازی ایمیل‌ها در جیمیل، ویرایش و تولید خودکار متون و ارائه‌ها در اسناد و محیط‌های کاری گوگل.',
  },
  {
    icon: HardDrive,
    title: 'حافظه ابری ۲ ترابایتی گوگل وان',
    description:
      'فضای ابری گسترده و فوق‌العاده امن برای ذخیره تمام فایل‌ها، عکس‌ها، ویدیوها و پروژه‌ها بدون دغدغه پر شدن حافظه.',
  },
  {
    icon: Cpu,
    title: 'پردازش هم‌زمان متن، صدا و تصویر',
    description:
      'دسترسی به سریع‌ترین و پیشرفته‌ترین مدل‌های چندحالته گوگل با درک عمیق داده‌های بصری و متنی.',
  },
  {
    icon: BookMarked,
    title: 'استودیوی خلاقانه تولید محتوا',
    description:
      'ابزارهای مدرن نسل جدید برای خلق تصاویر هنری، ایده‌های خلاق و ویدیوهای جذاب با هوش مصنوعی.',
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
          <p className='mx-auto max-w-xl text-sm text-muted-foreground sm:text-base'>
            جامع‌ترین جعبه‌ابزار هوش مصنوعی گوگل برای سرعت بخشیدن به کارها،
            یادگیری عمیق و تولید محتوای هوشمندانه.
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
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Card className='group h-full border border-border/60 bg-card transition-colors duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5'>
                <CardHeader className='pb-2'>
                  <div className='mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15'>
                    <feature.icon className='size-5' />
                  </div>
                  <h3 className='text-base font-semibold text-foreground'>
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
