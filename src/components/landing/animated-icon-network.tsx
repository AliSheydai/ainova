'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { gsap, MotionPathPlugin, useGSAP } from '@/lib/gsap-config'
import { Logo } from '@/assets/logo'

// ─── Product Icon Components ───────────────────────────────────────────────────
// Inline SVG icons for products sold in the store

function IconChatGPT({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className} style={style}>
      <title>ChatGPT</title>
      <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='1.5' />
      <path d='M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
      <path d='M12 8v1m0 6v1m-4-4h1m6 0h1' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    </svg>
  )
}

function IconGemini({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className} style={style}>
      <title>Gemini</title>
      <path d='M12 2C12 2 7 7.5 7 12C7 16.5 12 22 12 22C12 22 17 16.5 17 12C17 7.5 12 2Z' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
      <path d='M2 12C2 12 7.5 7 12 7C16.5 7 22 12 22 12C22 12 16.5 17 12 17C7.5 17 2 12 2 12Z' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
    </svg>
  )
}

function IconNetflix({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className} style={style}>
      <title>Netflix</title>
      <path d='M6 4v16' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
      <path d='M18 4v16' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
      <path d='M6 4l12 16' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
  )
}

function IconLovable({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className} style={style}>
      <title>Lovable</title>
      <path d='M12 20.5C12 20.5 3.5 15 3.5 9.5C3.5 7 5.5 5 8 5C9.5 5 10.8 5.8 12 7C13.2 5.8 14.5 5 16 5C18.5 5 20.5 7 20.5 9.5C20.5 15 12 20.5 12 20.5Z' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
    </svg>
  )
}

function IconYouTube({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className} style={style}>
      <title>YouTube</title>
      <rect x='2' y='5' width='20' height='14' rx='4' stroke='currentColor' strokeWidth='1.5' />
      <path d='M10 9l5 3-5 3V9Z' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
    </svg>
  )
}

function IconSpotify({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className} style={style}>
      <title>Spotify</title>
      <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='1.5' />
      <path d='M7 10c2.5-1 7.5-1 10 0' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
      <path d='M7.5 13c2-0.8 6-0.8 9 0' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
      <path d='M8.5 16c1.5-0.6 4.5-0.6 7 0' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    </svg>
  )
}

function IconMidjourney({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className} style={style}>
      <title>Midjourney</title>
      <path d='M3 17L7.5 7L12 14L14.5 10L21 17' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
      <circle cx='19' cy='8' r='2' stroke='currentColor' strokeWidth='1.5' />
    </svg>
  )
}

function IconGoogleOne({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className={className} style={style}>
      <title>Google One</title>
      <circle cx='12' cy='12' r='9.5' stroke='currentColor' strokeWidth='1.5' />
      <path d='M12 7.5V12H16.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

// ─── Icon Pool ─────────────────────────────────────────────────────────────────

type IconComponent = (props: { className?: string; style?: React.CSSProperties }) => React.ReactElement

const PRODUCT_ICONS: { id: string; label: string; component: IconComponent }[] = [
  { id: 'chatgpt', label: 'ChatGPT', component: IconChatGPT },
  { id: 'gemini', label: 'Gemini', component: IconGemini },
  { id: 'netflix', label: 'Netflix', component: IconNetflix },
  { id: 'lovable', label: 'Lovable', component: IconLovable },
  { id: 'youtube', label: 'YouTube', component: IconYouTube },
  { id: 'spotify', label: 'Spotify', component: IconSpotify },
  { id: 'midjourney', label: 'Midjourney', component: IconMidjourney },
  { id: 'googleone', label: 'Google One', component: IconGoogleOne },
]

// ─── Configuration ─────────────────────────────────────────────────────────────

// ─── Configuration ─────────────────────────────────────────────────────────────

interface NetworkConfig {
  pathCount: 9 // Strictly 9 curved paths across mobile, tablet, desktop
  particleCount: number
  iconSize: number
  duration: number
}

const NETWORK_CONFIG: Record<'mobile' | 'tablet' | 'desktop', NetworkConfig> = {
  mobile: { pathCount: 9, particleCount: 4, iconSize: 15, duration: 5.5 },
  tablet: { pathCount: 9, particleCount: 6, iconSize: 18, duration: 6.5 },
  desktop: { pathCount: 9, particleCount: 8, iconSize: 20, duration: 7.0 },
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

  // Motion route pool: 9 Left routes (L0-L8) and 9 Right routes (R0-R8)
  const allMotionRoutes = useMemo(() => {
    const routes: string[] = []
    for (let i = 0; i < 9; i++) {
      routes.push(`L${i}`)
      routes.push(`R${i}`)
    }
    return routes
  }, [])

  const particles = useMemo(
    () =>
      Array.from({ length: config.particleCount }, (_, i) => {
        // Distribute alternating from Left and Right sides
        const side = i % 2 === 0 ? 'L' : 'R'
        const lane = (i * 2 + 1) % 9
        const pathId = `${side}${lane}`
        return {
          id: `p${i}`,
          icon: PRODUCT_ICONS[i % PRODUCT_ICONS.length]!,
          pathId,
          initialDelay: i * 0.75, // Staggered entry for a continuous, steady stream
        }
      }),
    [config.particleCount]
  )

  // ── Core animation per particle (strictly constant velocity, ease: 'none') ─
  const animateParticle = useCallback(
    (index: number, pathId: string, delay: number) => {
      const el = particleRefs.current[index]
      const svgEl = svgRef.current
      if (!el || !svgEl || reducedMotion) return

      const pathEl = svgEl.querySelector<SVGPathElement>(`#anim-path-${pathId}`)
      if (!pathEl) return

      tweenRefs.current[index]?.kill()

      // Constant duration ensures uniform physical velocity across all particles
      const duration = config.duration

      gsap.set(el, { autoAlpha: 0 })

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
        ease: 'none', // Strictly constant speed throughout the entire trip
        onUpdate() {
          const p = tween.progress()
          if (p < 0.08) {
            // Smooth entry fade right at the edge without affecting linear velocity
            gsap.set(el, { autoAlpha: (p / 0.08) * 0.85 })
          } else if (p > 0.82) {
            // Smooth exit fade as particle reaches the central icon
            const f = (p - 0.82) / 0.18
            gsap.set(el, { autoAlpha: 0.85 * (1 - f) })
          } else {
            gsap.set(el, { autoAlpha: 0.85 })
          }
        },
        onComplete() {
          gsap.set(el, { autoAlpha: 0 })
          // Re-pick next path randomly from the 18 left/right routes
          const nextIdx = Math.floor(Math.random() * allMotionRoutes.length)
          const nextPathId = allMotionRoutes[nextIdx] ?? pathId
          const nextDelay = 0.3 + Math.random() * 0.7
          animateParticle(index, nextPathId, nextDelay)
        },
      })

      tweenRefs.current[index] = tween
    },
    [config.duration, allMotionRoutes, reducedMotion]
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
          <radialGradient id='ain-center-glow' cx='50%' cy='50%' r='50%'>
            <stop offset='0%' stopColor='var(--color-primary)' stopOpacity='0.30' />
            <stop offset='45%' stopColor='var(--color-primary)' stopOpacity='0.12' />
            <stop offset='75%' stopColor='var(--color-primary)' stopOpacity='0.03' />
            <stop offset='100%' stopColor='var(--color-primary)' stopOpacity='0' />
          </radialGradient>

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

        {/* Central convergence glow */}
        <ellipse cx='720' cy='180' rx='240' ry='75' fill='url(#ain-center-glow)' />

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

      {/* Particle icons (smaller, subtle) — only rendered client-side */}
      {isMounted &&
        particles.map((p, i) => {
          const Icon = p.icon.component
          return (
            <div
              key={p.id}
              ref={(el) => { particleRefs.current[i] = el }}
              className='absolute top-0 left-0 flex items-center justify-center rounded-lg border border-primary/25 bg-background/85 shadow-sm backdrop-blur-sm'
              style={{
                width: config.iconSize + 8,
                height: config.iconSize + 8,
                opacity: 0,
                visibility: 'hidden',
                willChange: 'transform, opacity',
              }}
            >
              <Icon
                className='text-primary/80'
                style={{ width: config.iconSize, height: config.iconSize }}
              />
            </div>
          )
        })}

      {/* Central brand icon — anchored directly in the central convergence zone */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10'>
        <div
          className='
            flex items-center justify-center rounded-2xl sm:rounded-3xl
            w-[72px] h-[72px] sm:w-[84px] sm:h-[84px]
            border border-primary/35 bg-background/95 backdrop-blur-md
            shadow-[0_0_55px_rgba(66,133,244,0.32),0_8px_24px_rgba(0,0,0,0.25)]
            ring-1 ring-primary/25
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
