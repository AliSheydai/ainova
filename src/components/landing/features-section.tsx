'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Code2,
  GraduationCap,
  Search,
  Palette,
  Video,
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fadeUp, viewportOnce } from '@/lib/motion'
import {
  CircularGallery,
  type CircularGalleryItem,
  type CircularGalleryRef,
} from '@/components/ui/feature-gallery'
import {
  featureCategories,
  featureItemsData,
  getFeaturesByCategory,
  getFeatureGalleryItems,
  preloadFeatureCardsCache,
  type FeatureCategory,
} from '@/components/landing/feature-cards-data'
import { useTheme } from '@/context/theme-provider'
import { toPersianDigits } from '@/lib/persian-utils'

const categoryIcons: Record<FeatureCategory, React.ElementType> = {
  all: Sparkles,
  coding: Code2,
  education: GraduationCap,
  research: Search,
  design: Palette,
  media: Video,
}

export function FeaturesSection() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState<FeatureCategory>('all')
  const [activeIndex, setActiveIndex] = useState(0)
  const [galleryItems, setGalleryItems] = useState<CircularGalleryItem[]>([])
  const galleryRef = useRef<CircularGalleryRef>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? (resolvedTheme === 'dark' ? 'dark' : 'light') : 'dark'

  // Pre-warm card texture cache in idle time to guarantee 60fps instant transitions
  useEffect(() => {
    if (!mounted) return
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => preloadFeatureCardsCache(currentTheme))
    } else {
      setTimeout(() => preloadFeatureCardsCache(currentTheme), 80)
    }
  }, [mounted, currentTheme])

  // Calculate card counts for each category badge
  const categoryCounts = useMemo(() => {
    const counts: Record<FeatureCategory, number> = {
      all: featureItemsData.length,
      coding: 0,
      education: 0,
      research: 0,
      design: 0,
      media: 0,
    }
    featureItemsData.forEach((item) => {
      item.categories.forEach((cat) => {
        if (cat !== 'all') {
          counts[cat] = (counts[cat] || 0) + 1
        }
      })
    })
    return counts
  }, [])

  const currentCategoryInfo = useMemo(() => {
    return (
      featureCategories.find((cat) => cat.id === activeCategory) ||
      featureCategories[0]
    )
  }, [activeCategory])

  const currentCategoryFeatures = useMemo(() => {
    return getFeaturesByCategory(activeCategory)
  }, [activeCategory])

  const ActiveCategoryIcon = categoryIcons[activeCategory] || Sparkles

  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  // Instantly update gallery textures when theme changes
  useEffect(() => {
    setGalleryItems(getFeatureGalleryItems(currentTheme, activeCategory))
  }, [currentTheme])

  const handleCategoryChange = (category: FeatureCategory) => {
    if (category === activeCategory) return

    // 1. Immediately update active category so button pill responds with zero delay
    setActiveCategory(category)
    setActiveIndex(0)

    // 2. Soft, lightweight crossfade: fade down briefly, swap cards in-place, then smoothly fade in
    setIsTransitioning(true)
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    transitionTimeoutRef.current = setTimeout(() => {
      setGalleryItems(getFeatureGalleryItems(currentTheme, category))
      requestAnimationFrame(() => {
        setIsTransitioning(false)
      })
    }, 120)
  }

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
    <section
      id='features'
      className='relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-card/50 via-background to-card/30 dark:from-card/30 dark:via-background dark:to-card/20 transition-colors duration-300'
    >
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
          className='mb-6 sm:mb-8 text-center'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary shadow-sm backdrop-blur-md'>
            <Sparkles className='size-3.5' />
            <span>امکانات و توانمندی‌ها بر اساس حوزه کاری شما</span>
          </div>

          <h2 className='mb-3 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground'>
            با اشتراک‌های هوش مصنوعی چه امکاناتی به دست می‌آورید؟
          </h2>

          <p className='mx-auto max-w-2xl text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground'>
            حوزه فعالیت یا نیاز خود را انتخاب کنید تا امکانات، مدل‌ها و قابلیت‌های متناسب با اهداف شما نمایش داده شود.
          </p>
        </motion.div>

        {/* Category Selector: Dropdown on Mobile, Pills on Desktop */}
        <motion.div
          className='mb-3 sm:mb-4 mx-auto max-w-5xl'
          initial='hidden'
          whileInView='visible'
          viewport={viewportOnce}
          variants={fadeUp}
        >
          {/* Mobile Category Dropdown Selector (sm:hidden) */}
          <div className='block sm:hidden w-full max-w-[260px] mx-auto mb-3 px-2'>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  className='group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-card/95 text-card-foreground shadow-sm active:scale-[0.98] transition-all cursor-pointer select-none text-right'
                >
                  <div className='flex items-center gap-2 min-w-0'>
                    <div className='flex items-center justify-center size-7 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 group-hover:scale-105 transition-transform'>
                      <ActiveCategoryIcon className='size-3.5' />
                    </div>
                    <div className='flex flex-col text-right truncate'>
                      <span className='text-[10px] text-muted-foreground font-medium leading-none'>
                        دسته‌بندی:
                      </span>
                      <span className='text-xs font-bold text-foreground truncate mt-0.5'>
                        {currentCategoryInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-1.5 shrink-0'>
                    <span className='text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20'>
                      {toPersianDigits(categoryCounts[activeCategory])}
                    </span>
                    <ChevronDown className='size-3.5 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200' />
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align='center'
                sideOffset={6}
                className='w-[var(--radix-dropdown-menu-trigger-width)] min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-trigger-width)] p-1.5 rounded-xl shadow-xl border border-border/80 bg-popover dark:bg-[#111422] text-popover-foreground [direction:rtl] text-right z-50'
                style={{ opacity: 1, width: 'var(--radix-dropdown-menu-trigger-width)' }}
              >
                <div className='px-2 py-1 flex items-center justify-between border-b border-border/60 pb-1 mb-1'>
                  <span className='text-[11px] font-bold text-foreground'>
                    انتخاب دسته‌بندی
                  </span>
                  <span className='text-[10px] text-muted-foreground'>
                    {toPersianDigits(featureCategories.length)} حوزه
                  </span>
                </div>

                <div className='space-y-0.5'>
                  {featureCategories.map((category) => {
                    const isSelected = activeCategory === category.id
                    const Icon = categoryIcons[category.id]
                    const count = categoryCounts[category.id]

                    return (
                      <DropdownMenuItem
                        key={category.id}
                        onClick={() => handleCategoryChange(category.id)}
                        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all select-none border ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs focus:bg-primary focus:text-primary-foreground'
                            : 'bg-transparent hover:bg-muted/70 focus:bg-muted/70 text-foreground border-transparent font-medium'
                        }`}
                      >
                        <div className='flex items-center gap-2 min-w-0'>
                          <div
                            className={`flex items-center justify-center size-6 rounded-md shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            <Icon className='size-3' />
                          </div>
                          <div className='flex flex-col text-right min-w-0'>
                            <span
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-primary-foreground' : 'text-foreground'
                              }`}
                            >
                              {category.label}
                            </span>
                            <span
                              className={`text-[10px] truncate leading-none mt-0.5 ${
                                isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                              }`}
                            >
                              {category.badgeText}
                            </span>
                          </div>
                        </div>

                        <div className='flex items-center gap-1.5 shrink-0'>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              isSelected
                                ? 'bg-primary-foreground/20 text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            {toPersianDigits(count)}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Category Pills Filter Bar (hidden sm:flex) */}
          <div className='hidden sm:flex items-center gap-2 sm:gap-2.5 overflow-visible pb-2 pt-1 px-0 justify-center flex-wrap'>
            {featureCategories.map((category) => {
              const isSelected = activeCategory === category.id
              const Icon = categoryIcons[category.id]
              const count = categoryCounts[category.id]

              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`relative group inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 md:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 shrink-0 select-none cursor-pointer border ${
                    isSelected
                      ? 'text-primary-foreground border-transparent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/70 border-border/50 bg-card/40 backdrop-blur-xs'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId='activeCategoryPill'
                      className='absolute inset-0 rounded-xl bg-primary shadow-md shadow-primary/25'
                      transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.8 }}
                    />
                  )}

                  <span className='relative z-10 flex items-center gap-1.5'>
                    <Icon
                      className={`size-3.5 sm:size-4 transition-transform duration-200 group-hover:scale-110 ${
                        isSelected ? 'text-primary-foreground' : 'text-primary'
                      }`}
                    />
                    <span>{category.label}</span>
                  </span>

                  <span
                    className={`relative z-10 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    {toPersianDigits(count)}
                  </span>
                </button>
              )
            })}
          </div>
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
          <div
            className={`relative w-full h-[520px] sm:h-[570px] md:h-[630px] overflow-hidden bg-transparent [mask-image:linear-gradient(to_right,transparent,black_2%,black_98%,transparent)] sm:[mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)] transition-all duration-200 ease-out ${
              isTransitioning
                ? 'opacity-0 scale-[0.98] blur-[0.5px]'
                : 'opacity-100 scale-100 blur-0'
            }`}
          >
            {/* Circular Gallery WebGL canvas */}
            {galleryItems.length > 0 && (
              <CircularGallery
                key={`circular-gallery-${currentTheme}`}
                ref={galleryRef}
                items={galleryItems}
                bend={0.35}
                textColor={currentTheme === 'dark' ? '#ffffff' : '#0f172a'}
                borderRadius={0.05}
                scrollEase={0.05}
                scrollSpeed={2}
                autoRotate={true}
                autoRotateSpeed={0.25}
                onActiveChange={setActiveIndex}
              />
            )}
          </div>

          {/* Dots Indicator & Quick Navigation */}
          <div className='mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2'>
            {currentCategoryFeatures.map((item, idx) => {
              const isActive = idx === activeIndex
              return (
                <button
                  key={`${activeCategory}-${item.id}`}
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

