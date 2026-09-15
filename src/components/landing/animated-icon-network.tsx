'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { gsap, MotionPathPlugin, useGSAP } from '@/lib/gsap-config'
import { Logo } from '@/assets/logo'

// ─── Product Image Items ───────────────────────────────────────────────────────
// Real brand logos from public/images/product for subscriptions offered in store

export interface ProductImageItem {
  id: string
  label: string
  src: string
  glowColor: string
}

export const PRODUCT_IMAGE_ITEMS: ProductImageItem[] = [
  { id: 'chatgpt', label: 'ChatGPT', src: '/images/product/chatgpt.png', glowColor: 'rgba(16, 163, 127, 0.45)' },
  { id: 'claude', label: 'Claude', src: '/images/product/claude.png', glowColor: 'rgba(217, 119, 6, 0.45)' },
  { id: 'gemini', label: 'Gemini', src: '/images/product/gemini.png', glowColor: 'rgba(59, 130, 246, 0.45)' },
  { id: 'cursor', label: 'Cursor', src: '/images/product/cursor.png', glowColor: 'rgba(147, 51, 234, 0.45)' },
  { id: 'canva', label: 'Canva', src: '/images/product/canva.png', glowColor: 'rgba(6, 182, 212, 0.45)' },
  { id: 'lovable', label: 'Lovable', src: '/images/product/lovable.png', glowColor: 'rgba(236, 72, 153, 0.45)' },
  { id: 'perplexiti', label: 'Perplexity', src: '/images/product/perplexiti.png', glowColor: 'rgba(20, 184, 166, 0.45)' },
  { id: 'capcut', label: 'CapCut', src: '/images/product/capcut.png', glowColor: 'rgba(244, 63, 94, 0.45)' },
  { id: 'netflix', label: 'Netflix', src: '/images/product/netflix.png', glowColor: 'rgba(229, 9, 20, 0.45)' },
  { id: 'spotify', label: 'Spotify', src: '/images/product/spotify.png', glowColor: 'rgba(29, 185, 84, 0.45)' },
  { id: 'youtube', label: 'YouTube', src: '/images/product/youtube.png', glowColor: 'rgba(255, 0, 0, 0.45)' },
  { id: 'notion', label: 'Notion', src: '/images/product/notion.png', glowColor: 'rgba(100, 116, 139, 0.45)' },
]

// ─── Configuration ─────────────────────────────────────────────────────────────

interface NetworkConfig {
  pathCount: 9 // Strictly 9 curved paths across mobile, tablet, desktop
  particleCount: number
  boxSize: number
  imgSize: number
  duration: number
}

const NETWORK_CONFIG: Record<'mobile' | 'tablet' | 'desktop', NetworkConfig> = {
  mobile: { pathCount: 9, particleCount: 4, boxSize: 22, imgSize: 14, duration: 9.0 },
  tablet: { pathCount: 9, particleCount: 5, boxSize: 25, imgSize: 16, duration: 10.0 },
  desktop: { pathCount: 9, particleCount: 6, boxSize: 28, imgSize: 18, duration: 11.0 },
}

// ─── Path Generation ───────────────────────────────────────────────────────────

export interface WirePathDef {
  id: string
  laneIndex: number
  fullD: string
  leftD: string
  rightD: string
  strokeOpacity: number
}

/**
 * Generates exactly 9 curved paths across a 1440×360 viewBox.
 * Geometry: Graceful Funnel / Hourglass (پاپیون روان)
 * - Extra-wide vertical spacing at the outer edges (8px to 352px: 344px span, ~43px lane spacing)
 * - Smooth, continuous inward convergence throughout the journey
 * - Maximum compression at the central waist (172px to 188px: 16px span, ~2px lane spacing)
 * - Strict horizontal tangent at center (dy/dx = 0) with seamless C1 continuity
 */
export function generateWirePaths(): WirePathDef[] {
  const TOTAL_PATHS = 9
  const cx = 720
  const cy = 180
  const paths: WirePathDef[] = []

  for (let i = 0; i < TOTAL_PATHS; i++) {
    const t = i / (TOTAL_PATHS - 1) // 0 to 1
    // Extra-wide vertical separation at outer edges (8px to 352px: 344px span, ~43px between adjacent wires)
    const sy = 8 + t * 344
    // Maximum compression at central waist (172px to 188px: 16px total span, ~2px between adjacent wires)
    const ey = (cy - 8) + t * 16

    // Normalized distance from center line (0 at middle, 1 at extreme outer lines)
    const distFromCenter = Math.abs(t - 0.5) * 2

    // Control point 1: gentle progressive inward curve from outer edge
    const cp1x = cx * 0.38
    const cp1y = sy + (ey - sy) * 0.10

    // Control point 2: smooth horizontal convergence approaching central waist
    const cp2x = cx * 0.64
    const cp2y = ey

    // Right-side symmetric control points
    const rcp1x = 1440 - cp1x
    const rcp1y = cp1y
    const rcp2x = 1440 - cp2x
    const rcp2y = ey

    // Left path: starts at Left edge (x=0), moves to center (cx=720, cy=ey)
    const leftD = `M 0,${sy.toFixed(1)} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${cx},${ey.toFixed(1)}`

    // Right path: starts at Right edge (x=1440), moves to center (cx=720, cy=ey)
    const rightD = `M 1440,${sy.toFixed(1)} C ${rcp1x.toFixed(1)},${rcp1y.toFixed(1)} ${rcp2x.toFixed(1)},${rcp2y.toFixed(1)} ${cx},${ey.toFixed(1)}`

    // Full continuous wire from Left edge, through Center, to Right edge
    const fullD = `M 0,${sy.toFixed(1)} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${cx},${ey.toFixed(1)} C ${rcp2x.toFixed(1)},${rcp2y.toFixed(1)} ${rcp1x.toFixed(1)},${rcp1y.toFixed(1)} 1440,${sy.toFixed(1)}`

    // Enhanced luminous opacity for clear, premium recognition
    const strokeOpacity = 0.28 + (1 - distFromCenter) * 0.10

    paths.push({
      id: `wire-${i}`,
      laneIndex: i,
      fullD,
      leftD,
      rightD,
      strokeOpacity,
    })
  }

  return paths
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AnimatedIconNetwork({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const particleRefs = useRef<(HTMLDivElement | null)[]>([])
  const tweenRefs = useRef<(gsap.core.Tween | null)[]>([])
  const isPausedRef = useRef(false)
  const [isMounted, setIsMounted] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  // ── Client-side mount detection ────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // ── Responsive config ──────────────────────────────────────────────────────
  const config = useMemo<NetworkConfig>(() => {
    if (!isMounted || typeof window === 'undefined') return NETWORK_CONFIG.desktop
    const w = window.innerWidth
    if (w < 640) return NETWORK_CONFIG.mobile
    if (w < 1024) return NETWORK_CONFIG.tablet
    return NETWORK_CONFIG.desktop
  }, [isMounted])

  // Exactly 9 wire paths across all viewports
  const paths = useMemo(() => generateWirePaths(), [])

  // Dispersed lane order to keep simultaneous particles well separated vertically
  const DISPERSED_LANES = useMemo(() => [1, 5, 2, 7, 0, 4, 8, 3, 6], [])

  const particles = useMemo(() => {
    const count = config.particleCount
    const interval = config.duration / count // Exactly equal time interval between each particle arrival
    return Array.from({ length: count }, (_, i) => {
      // Alternate entrance side: L, R, L, R...
      const side = i % 2 === 0 ? 'L' : 'R'
      const lane = DISPERSED_LANES[i % DISPERSED_LANES.length] ?? (i * 2) % 9
      const pathId = `${side}${lane}`
      return {
        id: `p${i}`,
        item: PRODUCT_IMAGE_ITEMS[i % PRODUCT_IMAGE_ITEMS.length]!,
        pathId,
        initialDelay: i * interval, // Perfectly synchronized pipeline
      }
    })
  }, [config.particleCount, config.duration, DISPERSED_LANES])

  // Track cycle count per particle to cycle through lanes and product images deterministically
  const cycleCountRef = useRef<number[]>([])

  // ── Core animation per particle (strictly constant velocity, ease: 'none') ─
  const animateParticle = useCallback(
    (index: number, pathId: string, delay: number) => {
      const el = particleRefs.current[index]
      const svgEl = svgRef.current
      if (!el || !svgEl || reducedMotion) return

      const pathEl = svgEl.querySelector<SVGPathElement>(`#anim-path-${pathId}`)
      if (!pathEl) return

      tweenRefs.current[index]?.kill()

      const duration = config.duration

      gsap.set(el, { autoAlpha: 0, scale: 0.8 })

      const tween = gsap.to(el, {
        motionPath: {
          path: pathEl,
          align: pathEl,
          alignOrigin: [0.5, 0.5],
          start: 0,
          end: 1,
          autoRotate: false,
        },
        duration,
        delay,
        ease: 'none', // Strictly linear constant speed throughout the trip
        onUpdate() {
          const p = tween.progress()
          if (p < 0.08) {
            // Smooth entry fade right at the edge
            const f = p / 0.08
            gsap.set(el, { autoAlpha: f * 0.9, scale: 0.8 + 0.2 * f })
          } else if (p > 0.82) {
            // Smooth exit fade as particle gently disappears into the central icon
            const f = (p - 0.82) / 0.18
            gsap.set(el, { autoAlpha: Math.max(0, 0.9 * (1 - f)), scale: 1 - 0.25 * f })
          } else {
            gsap.set(el, { autoAlpha: 0.9, scale: 1 })
          }
        },
        onComplete() {
          gsap.set(el, { autoAlpha: 0, scale: 0.8 })

          // Increment cycle counter for this particle slot
          const currentCycle = (cycleCountRef.current[index] ?? 0) + 1
          cycleCountRef.current[index] = currentCycle

          // Pick the next product image deterministically for high variety
          const imgEl = el.querySelector('img')
          if (imgEl) {
            const nextProdIdx = (index + currentCycle * config.particleCount) % PRODUCT_IMAGE_ITEMS.length
            const nextProduct = PRODUCT_IMAGE_ITEMS[nextProdIdx]
            if (nextProduct) {
              imgEl.src = nextProduct.src
              imgEl.alt = nextProduct.label
            }
          }

          // Pick next lane with alternating sides and dispersed spacing
          const nextSide = (index + currentCycle) % 2 === 0 ? 'L' : 'R'
          const laneIdx = (index + currentCycle * 3) % DISPERSED_LANES.length
          const nextLane = DISPERSED_LANES[laneIdx] ?? (index % 9)
          const nextPathId = `${nextSide}${nextLane}`

          // Immediately restart without random delays to maintain the locked cadence
          animateParticle(index, nextPathId, 0)
        },
      })

      tweenRefs.current[index] = tween
    },
    [config.duration, config.particleCount, DISPERSED_LANES, reducedMotion]
  )

  // ── GSAP bootstrap ─────────────────────────────────────────────────────────
  useGSAP(
    () => {
      if (!isMounted || reducedMotion) return
      gsap.registerPlugin(MotionPathPlugin)
      particles.forEach((p, i) => animateParticle(i, p.pathId, p.initialDelay))
    },
    { scope: containerRef, dependencies: [isMounted, reducedMotion, particles, animateParticle] }
  )

  // ── IntersectionObserver — pause when off-screen ───────────────────────────
  useEffect(() => {
    if (!isMounted || reducedMotion) return
    const el = containerRef.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false
        if (visible && isPausedRef.current) {
          isPausedRef.current = false
          tweenRefs.current.forEach((t) => t?.resume())
        } else if (!visible && !isPausedRef.current) {
          isPausedRef.current = true
          tweenRefs.current.forEach((t) => t?.pause())
        }
      },
      { threshold: 0.01 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [isMounted, reducedMotion])

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(() => () => tweenRefs.current.forEach((t) => t?.kill()), [])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden pointer-events-none select-none ${className ?? ''}`}
      aria-hidden='true'
    >
      {/* Full-width SVG path layer */}
      <svg
        ref={svgRef}
        viewBox='0 0 1440 360'
        preserveAspectRatio='none'
        className='absolute inset-0 w-full h-full'
        xmlns='http://www.w3.org/2000/svg'
        aria-hidden='true'
      >
        <defs>
          {/* Smooth edge fade gradient mask to dissolve the left and right ends */}
          <linearGradient id='ain-edge-fade-gradient' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='#ffffff' stopOpacity='0' />
            <stop offset='7%' stopColor='#ffffff' stopOpacity='1' />
            <stop offset='93%' stopColor='#ffffff' stopOpacity='1' />
            <stop offset='100%' stopColor='#ffffff' stopOpacity='0' />
          </linearGradient>

          <mask id='ain-edge-fade-mask'>
            <rect x='0' y='0' width='1440' height='360' fill='url(#ain-edge-fade-gradient)' />
          </mask>

          {/* GSAP Motion Paths (9 Left + 9 Right routes converging into center) */}
          {paths.map((p) => (
            <g key={`motion-defs-${p.id}`}>
              <path id={`anim-path-L${p.laneIndex}`} d={p.leftD} fill='none' />
              <path id={`anim-path-R${p.laneIndex}`} d={p.rightD} fill='none' />
            </g>
          ))}
        </defs>

        {/* Exactly 9 Curved Paths — Bow-Tie silhouette with smooth edge fade */}
        <g mask='url(#ain-edge-fade-mask)'>
          {paths.map((p) => (
            <path
              key={p.id}
              id={`wire-path-${p.id}`}
              d={p.fullD}
              fill='none'
              stroke='var(--color-primary)'
              strokeWidth='1.25'
              strokeOpacity={p.strokeOpacity}
              strokeLinecap='round'
            />
          ))}
        </g>
      </svg>

      {/* Edge Vignette Overlays for smooth gradual dissolve at viewport edges */}
      <div className='pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-16 md:w-24 bg-gradient-to-r from-background via-background/40 to-transparent z-[5]' />
      <div className='pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-16 md:w-24 bg-gradient-to-l from-background via-background/40 to-transparent z-[5]' />

      {/* Particle product image cards — only rendered client-side */}
      {isMounted &&
        particles.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => { particleRefs.current[i] = el }}
            className='
              absolute top-0 left-0 flex items-center justify-center
              rounded-lg sm:rounded-xl
              border border-border/80 dark:border-border/70
              bg-background/90 dark:bg-background/90
              shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)]
              backdrop-blur-sm
              transition-[border-color,box-shadow]
            '
            style={{
              width: config.boxSize,
              height: config.boxSize,
              opacity: 0,
              visibility: 'hidden',
              willChange: 'transform, opacity',
            }}
          >
            <img
              src={p.item.src}
              alt={p.item.label}
              width={config.imgSize}
              height={config.imgSize}
              className='w-auto h-auto object-contain pointer-events-none select-none rounded-[4px]'
              style={{
                maxWidth: config.imgSize,
                maxHeight: config.imgSize,
              }}
              loading='eager'
              draggable={false}
            />
          </div>
        ))}

      {/* Central brand icon — anchored directly in the central convergence zone */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10'>
        <div
          className='
            flex items-center justify-center rounded-2xl sm:rounded-3xl
            w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]
            border border-border/80 bg-background/95 backdrop-blur-md
            shadow-[0_8px_24px_rgba(0,0,0,0.25)]
            transition-transform duration-300
          '
        >
          <Logo
            className='text-primary w-10 h-10 sm:w-[46px] sm:h-[46px]'
          />
        </div>
      </div>
    </div>
  )
}
