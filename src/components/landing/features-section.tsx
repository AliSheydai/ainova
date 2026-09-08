'use client'

import {
  BookMarked,
  BrainCircuit,
  Cpu,
  FileText,
  HardDrive,
  Microscope,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const features = [
  {
    icon: BrainCircuit,
    title: 'Gemini',
    description:
      'دسترسی به قابلیت‌ها و مدل‌های پیشرفته Gemini مطابق پلن فعلی Google AI Pro.',
  },
  {
    icon: Microscope,
    title: 'Deep Research',
    description:
      'امکان استفاده از قابلیت‌های تحقیق و تحلیل عمیق Gemini، مطابق دسترسی فعلی پلن.',
  },
  {
    icon: FileText,
    title: 'AI در Google Workspace',
    description:
      'قابلیت‌های هوش مصنوعی در Gmail، Google Docs و سایر سرویس‌های Workspace مطابق پلن.',
  },
  {
    icon: HardDrive,
    title: 'Google One',
    description:
      'مزایای فضای ذخیره‌سازی و سرویس‌های همراه Google AI Pro مطابق پلن.',
  },
  {
    icon: Cpu,
    title: 'مدل‌های پیشرفته',
    description:
      'دسترسی به مدل‌ها و قابلیت‌های پیشرفته‌ای که Google برای مشترکان AI Pro ارائه می‌کند.',
  },
  {
    icon: BookMarked,
    title: 'Google Flow',
    description:
      'قابلیت‌های مرتبط با ساخت و تولید ویدیو با هوش مصنوعی، در صورت پشتیبانی در پلن و منطقه کاربر.',
  },
]

export function FeaturesSection() {
  return (
    <section id='features' className='py-20 md:py-24'>
      <div className='container mx-auto px-4 sm:px-6'>
        {/* Header */}
        <div className='mb-12 text-center'>
          <h2 className='mb-3 text-2xl font-bold text-foreground sm:text-3xl'>
            با Google AI Pro چه امکاناتی دارید؟
          </h2>
          <p className='mx-auto max-w-xl text-sm text-muted-foreground sm:text-base'>
            دسترسی به قابلیت‌های ارائه‌شده در پلن Google AI Pro، مطابق شرایط
            و منطقه حساب شما.
          </p>
        </div>

        {/* Grid */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature) => (
            <Card
              key={feature.title}
              className='group border border-border/60 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5'
            >
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
          ))}
        </div>
      </div>
    </section>
  )
}
