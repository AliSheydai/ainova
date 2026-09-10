'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register all plugins once — safe for SSR (guarded by typeof window)
if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger)
}

export { gsap, ScrollTrigger, useGSAP }

// ─── Shared Eases ────────────────────────────────────────────────────────────
export const EASE_SMOOTH = 'power3.out'
export const EASE_SOFT = 'power2.out'
export const EASE_ELASTIC = 'elastic.out(1, 0.5)'
export const EASE_BACK = 'back.out(1.2)'

// ─── Default ScrollTrigger config factory ────────────────────────────────────
export function scrollTriggerDefaults(
  trigger: Element | string,
  options?: Partial<ScrollTrigger.Vars>
): ScrollTrigger.Vars {
  return {
    trigger,
    start: 'top 82%',
    toggleActions: 'play none none reverse',
    ...options,
  }
}
