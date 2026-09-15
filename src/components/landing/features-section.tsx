'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MousePointerClick,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fadeUp, viewportOnce } from '@/lib/motion'
import {
  CircularGallery,
  type CircularGalleryItem,
  type CircularGalleryRef,
} from '@/components/ui/feature-gallery'
import {
  featureItemsData,
  getFeatureGalleryItems,
} from '@/components/landing/feature-cards-data'

export function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [galleryItems, setGalleryItems] = useState<CircularGalleryItem[]>([])
  const galleryRef = useRef<CircularGalleryRef>(null)

  // Generate crystal-clear Persian card textures once page fonts (Vazirmatn) are ready
  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setGalleryItems(getFeatureGalleryItems())
      })
    } else {
      setGalleryItems(getFeatureGalleryItems())
    }
  }, [])

  const currentFeature = featureItemsData[activeIndex] || featureItemsData[0]

  const handlePrev = () => {
    galleryRef.current?.prev()
  }

  const handleNext = () => {
    galleryRef.current?.next()
  }

  const handleGoTo = (index: number) => {
    galleryRef.current?.goTo(index)
    setActiveIndex(index)
  }

  return (
    <section id='features' className='relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-card/50 via-background to-card/30 dark:from-card/30 dark:via-background dark:to-card/20 transition-colors duration-300'>
      {/* Ambient multi-layer lighting matching card & stage theme */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] md:w-[1100px] h-[550px] rounded-full bg-primary/12 blur-[150px] -z-10'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute top-1/4 right-1/4 size-[400px] rounded-full bg-sky-500/10 blur-[130px] -z-10'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute bottom-1/4 left-1/4 size-[350px] rounded-full bg-indigo-500/10 blur-[140px] -z-10'
      />

      <div className='container mx-auto px-4 sm:px-6'>
        {/* Header */}
        <motion.div
          className='mb-8 sm:mb-12 text-center'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary shadow-sm backdrop-blur-md'>
            <span>امکانات و توانمندی‌ها</span>
          </div>

          <h2 className='mb-4 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground'>
            با اشتراک‌های هوش مصنوعی چه امکاناتی به دست می‌آورید؟
          </h2>

          <p className='mx-auto max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground'>
            دسترسی نامحدود به قدرتمندترین مدل‌های استدلال و کدنویسی جهان، استودیوهای تولید ویدیو و تصویر،
            دستیارهای پژوهشی پیشرفته و زیرساخت ابری اختصاصی.
          </p>
        </motion.div>

        {/* 3D Circular Gallery Stage */}
        <motion.div
          className='relative mx-auto max-w-6xl'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          {/* Main 3D Floating Stage - zero borders or bounding box, cards float freely in section background */}
          <div className='relative w-full h-[570px] sm:h-[620px] md:h-[680px] overflow-hidden bg-transparent [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)] sm:[mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]'>
            {/* Circular Gallery WebGL canvas */}
            {galleryItems.length > 0 && (
              <CircularGallery
                ref={galleryRef}
                items={galleryItems}
                bend={0.35}
                textColor='#ffffff'
                borderRadius={0.05}
                scrollEase={0.05}
                scrollSpeed={2}
                autoRotate={true}
                autoRotateSpeed={0.25}
                onActiveChange={setActiveIndex}
              />
            )}
          </div>

          {/* Side Navigation Arrow Buttons (Positioned outside mask for crystal-clear visibility and interaction) */}
          {/* <div className='absolute inset-y-0 right-2 sm:right-4 md:right-6 flex items-center z-20 pointer-events-none'>
            <Button
              type='button'
              variant='secondary'
              size='icon'
              onClick={handlePrev}
              aria-label='امکان قبلی'
              className='pointer-events-auto size-10 sm:size-12 rounded-full border border-border/70 bg-card/75 hover:bg-card shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 text-foreground hover:text-primary hover:border-primary/40'
            >
              <ChevronRight className='size-5 sm:size-6' />
            </Button>
          </div> */}

          {/* <div className='absolute inset-y-0 left-2 sm:left-4 md:left-6 flex items-center z-20 pointer-events-none'>
            <Button
              type='button'
              variant='secondary'
              size='icon'
              onClick={handleNext}
              aria-label='امکان بعدی'
              className='pointer-events-auto size-10 sm:size-12 rounded-full border border-border/70 bg-card/75 hover:bg-card shadow-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 text-foreground hover:text-primary hover:border-primary/40'
            >
              <ChevronLeft className='size-5 sm:size-6' />
            </Button>
          </div> */}

          {/* Dots Indicator & Quick Navigation */}
          <div className='mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2'>
            {featureItemsData.map((item, idx) => {
              const isActive = idx === activeIndex
              return (
                <button
                  key={item.id}
                  onClick={() => handleGoTo(idx)}
                  className={`group relative flex items-center justify-center rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-8 sm:w-10 h-3 bg-primary shadow-md shadow-primary/30'
                      : 'size-2.5 sm:size-3 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                  }`}
                  aria-label={`رفتن به ${item.title}`}
                >
                  <span className='sr-only'>{item.title}</span>
                </button>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
