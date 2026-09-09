'use client'

import type { Variants, Transition } from 'framer-motion'

export const standardEase = [0.25, 0.1, 0.25, 1] as const

export const defaultTransition: Transition = {
  duration: 0.35,
  ease: standardEase,
}

// Fade up animation (for headings, cards, text blocks)
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
}

// Fade in animation (subtle appearance)
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
}

// Scale in animation (for badges, icons, dialog-like elements)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: defaultTransition,
  },
}

// Stagger container
export const staggerContainer = (
  staggerChildren = 0.06,
  delayChildren = 0
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
})

// Standard viewport trigger settings to ensure lightweight one-off trigger
export const viewportOnce = {
  once: true,
  amount: 0.2,
} as const

// Micro interaction hover settings for cards and buttons
export const cardHover = {
  whileHover: { y: -3, transition: { duration: 0.2, ease: 'easeOut' } },
  whileTap: { scale: 0.99 },
}

export const buttonHover = {
  whileTap: { scale: 0.98 },
}
