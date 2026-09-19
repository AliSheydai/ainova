'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MarkdownView } from '@/components/ui/markdown-view'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductExpandableDescriptionProps {
  description: string
  collapsedHeight?: number
}

export function ProductExpandableDescription({
  description,
  collapsedHeight = 400,
}: ProductExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  // Initially estimate based on length (> 300 chars is around 7-8 lines of text)
  const [canExpand, setCanExpand] = useState(() => description.trim().length > 300)
  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const checkHeight = () => {
      // If content is taller than collapsedHeight by at least 30px, enable collapsible behavior
      if (el.scrollHeight > collapsedHeight + 30) {
        setCanExpand(true)
      } else {
        setCanExpand(false)
      }
    }

    checkHeight()

    const observer = new ResizeObserver(checkHeight)
    observer.observe(el)
    return () => observer.disconnect()
  }, [description, collapsedHeight])

  const handleToggle = () => {
    if (isExpanded) {
      setIsExpanded(false)
      // Smoothly bring the top of the description section into view if it was scrolled past
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        if (rect.top < 80) {
          containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    } else {
      setIsExpanded(true)
    }
  }

  return (
    <div ref={containerRef} className='space-y-2.5 sm:space-y-3 scroll-mt-24'>
      <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
        توضیحات محصول
      </h2>

      <div className='relative'>
        {/* Expandable content area: shows ~5-6 lines clearly in collapsed state */}
        <div
          ref={contentRef}
          style={{
            maxHeight: canExpand && !isExpanded ? `${collapsedHeight}px` : undefined,
          }}
          className={cn(
            'prose-sm text-xs sm:text-sm leading-relaxed text-foreground/90 transition-[max-height] duration-500 ease-in-out',
            canExpand && !isExpanded && 'overflow-hidden select-none'
          )}
        >
          <MarkdownView content={description} />
        </div>

        {/* Gradient fade overlay without any blur or shadow */}
        {canExpand && !isExpanded && (
          <div
            className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background via-background/80 to-transparent select-none'
            aria-hidden='true'
          />
        )}
      </div>

      {/* Interactive Toggle Text Link */}
      {canExpand && (
        <div className='pt-1 flex items-center justify-start'>
          <button
            type='button'
            onClick={handleToggle}
            aria-expanded={isExpanded}
            className='group inline-flex items-center gap-1 py-1 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer select-none'
          >
            <span>{isExpanded ? 'بستن توضیحات' : 'مشاهده ادامه توضیحات'}</span>
            {isExpanded ? (
              <ChevronUp className='size-4 transition-transform duration-200 group-hover:-translate-y-0.5' />
            ) : (
              <ChevronDown className='size-4 transition-transform duration-200 group-hover:translate-y-0.5' />
            )}
          </button>
        </div>
      )}
    </div>
  )
}
