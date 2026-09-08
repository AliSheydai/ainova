'use client'

import * as React from 'react'
import Link from 'next/link'
import { PanelLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function SidebarBrand() {
  const { toggleSidebar } = useSidebar()

  return (
    <div className='flex h-14 w-full items-center justify-between px-2 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'>
      {/* باز بودن سایدبار: لوگو + نام (لینک به صفحه اصلی) */}
      <Link
        href='/'
        className='group/brand flex items-center gap-2.5 overflow-hidden rounded-lg p-1 -m-1 transition-colors hover:bg-sidebar-accent/70 group-data-[collapsible=icon]:hidden'
        title='مشاهده صفحه اصلی'
      >
        <div className='flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform duration-200 group-hover/brand:scale-105'>
          <Sparkles className='size-4' />
        </div>
        <div className='flex flex-col overflow-hidden text-start leading-none'>
          <span className='truncate text-sm font-bold text-foreground transition-colors group-hover/brand:text-primary'>
            جمینای
          </span>
          <span className='mt-0.5 truncate text-xs text-muted-foreground'>
            پنل کاربری
          </span>
        </div>
      </Link>

      {/* دکمه بستن — حالت باز */}
      <div className='group-data-[collapsible=icon]:hidden'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-8 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
              onClick={toggleSidebar}
              aria-label='بستن سایدبار'
            >
              <PanelLeft className='size-4 rtl:rotate-180' />
            </Button>
          </TooltipTrigger>
          <TooltipContent side='left'>بستن سایدبار</TooltipContent>
        </Tooltip>
      </div>

      {/* حالت بسته: نمایش لوگو + دکمه باز کردن */}
      <div className='hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className={cn(
                'group/toggle-btn relative size-9 rounded-xl p-0',
                'hover:bg-sidebar-accent'
              )}
              onClick={toggleSidebar}
              aria-label='باز کردن سایدبار'
            >
              {/* لوگو در حالت عادی */}
              <div className='flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all duration-200 group-hover/toggle-btn:hidden'>
                <Sparkles className='size-4' />
              </div>
              {/* آیکون expand هنگام hover */}
              <div className='hidden size-8 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground group-hover/toggle-btn:flex'>
                <PanelLeft className='size-4 rtl:rotate-180' />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side='left' align='center'>
            باز کردن سایدبار
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
