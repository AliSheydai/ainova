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
    <section id='features' className='relative py-20 md:py-28 overflow-hidden'>
      {/* Background ambient lighting in primary blue */}
      <div className='pointer-events-none absolute top-1/3 right-1/2 -translate-y-1/2 translate-x-1/2 size-[600px] rounded-full bg-primary/10 blur-[160px] -z-10' />

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
          {/* Main 3D Container */}
          <div className='relative w-full h-[570px] sm:h-[620px] md:h-[680px] overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card/70 via-card/30 to-background/90 shadow-2xl backdrop-blur-2xl transition-all duration-300'>

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

            {/* Side Navigation Arrow Buttons */}
            <div className='absolute inset-y-0 right-3 sm:right-6 flex items-center z-20 pointer-events-none'>
              <Button
                type='button'
                variant='secondary'
                size='icon'
                onClick={handlePrev}
                aria-label='امکان قبلی'
                className='pointer-events-auto size-10 sm:size-12 rounded-full border border-border/80 bg-background/85 hover:bg-background shadow-lg backdrop-blur-md transition-transform hover:scale-105 active:scale-95 text-foreground hover:text-primary hover:border-primary/40'
              >
                <ChevronRight className='size-5 sm:size-6' />
              </Button>
            </div>

            <div className='absolute inset-y-0 left-3 sm:left-6 flex items-center z-20 pointer-events-none'>
              <Button
                type='button'
                variant='secondary'
                size='icon'
                onClick={handleNext}
                aria-label='امکان بعدی'
                className='pointer-events-auto size-10 sm:size-12 rounded-full border border-border/80 bg-background/85 hover:bg-background shadow-lg backdrop-blur-md transition-transform hover:scale-105 active:scale-95 text-foreground hover:text-primary hover:border-primary/40'
              >
                <ChevronLeft className='size-5 sm:size-6' />
              </Button>
            </div>

            {/* Bottom Gradient Fade */}
            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/80 to-transparent' />
          </div>

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
