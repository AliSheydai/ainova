'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  PictureInPicture2,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MinimalVideoPlayerProps {
  src: string
  poster?: string
  title?: string
  autoPlay?: boolean
  className?: string
  type?: 'direct' | 'aparat' | 'youtube'
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const pad = (n: number) => n.toString().padStart(2, '0')

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`
  }
  return `${pad(mins)}:${pad(secs)}`
}

export function MinimalVideoPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  className,
  type = 'direct',
}: MinimalVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // State with lazy initializers
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedTime, setBufferedTime] = useState(0)
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 1
    try {
      const saved = localStorage.getItem('ariowork-player-volume')
      if (saved !== null) {
        const v = parseFloat(saved)
        if (!isNaN(v) && v >= 0 && v <= 1) return v
      }
    } catch {
      // ignore
    }
    return 1
  })
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('ariowork-player-muted') === 'true'
    } catch {
      return false
    }
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPipAvailable] = useState(() => {
    if (typeof document !== 'undefined' && 'pictureInPictureEnabled' in document) {
      return document.pictureInPictureEnabled
    }
    return false
  })
  const [showControls, setShowControls] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [centerFeedback, setCenterFeedback] = useState<{
    type: 'play' | 'pause' | 'seek-forward' | 'seek-backward'
    id: number
  } | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{ percent: number; time: number } | null>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)

  // Auto-hide controls after 2.5s of inactivity when playing (pause auto-hide while scrubbing)
  const handleUserActivity = useCallback(() => {
    setShowControls(true)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)

    if (isPlaying && !isScrubbing) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2500)
    }
  }, [isPlaying, isScrubbing])

  useEffect(() => {
    if (isPlaying && !isScrubbing) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 2500)
    }
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [isPlaying, isScrubbing])

  // Center feedback trigger
  const triggerFeedback = useCallback((feedbackType: 'play' | 'pause' | 'seek-forward' | 'seek-backward') => {
    setCenterFeedback({
      type: feedbackType,
      id: Math.random(),
    })
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = setTimeout(() => {
      setCenterFeedback(null)
    }, 600)
  }, [])

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused || video.ended) {
      video.play().then(() => {
        setIsPlaying(true)
        triggerFeedback('play')
      }).catch(() => {
        // Autoplay policy or user gesture requirement
      })
    } else {
      video.pause()
      setIsPlaying(false)
      triggerFeedback('pause')
    }
  }, [triggerFeedback])

  // Skip time (+10s or -10s)
  const skip = useCallback((seconds: number) => {
    const video = videoRef.current
    if (!video) return
    const target = Math.min(Math.max(video.currentTime + seconds, 0), video.duration || 0)
    video.currentTime = target
    setCurrentTime(target)
    triggerFeedback(seconds > 0 ? 'seek-forward' : 'seek-backward')
    handleUserActivity()
  }, [handleUserActivity, triggerFeedback])

  // Volume & Mute handlers
  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current
    if (!video) return
    const clamped = Math.max(0, Math.min(1, newVolume))
    video.volume = clamped
    setVolume(clamped)
    if (clamped > 0 && isMuted) {
      video.muted = false
      setIsMuted(false)
    }
    try {
      localStorage.setItem('ariowork-player-volume', clamped.toString())
    } catch {
      // ignore
    }
  }, [isMuted])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    const nextMuted = !isMuted
    video.muted = nextMuted
    setIsMuted(nextMuted)
    try {
      localStorage.setItem('ariowork-player-muted', nextMuted.toString())
    } catch {
      // ignore
    }
  }, [isMuted])

  // Picture in Picture
  const togglePip = async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture()
      }
    } catch (err) {
      console.warn('PiP error:', err)
    }
  }

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current
    const video = videoRef.current
    if (!container && !video) return

    const doc = typeof document !== 'undefined' ? (document as Document & { webkitFullscreenElement?: Element | null }) : null
    const isCurrentlyFs = !!doc?.fullscreenElement || !!doc?.webkitFullscreenElement

    try {
      if (!isCurrentlyFs) {
        if (container?.requestFullscreen) {
          await container.requestFullscreen()
        } else if (video && 'webkitEnterFullscreen' in video) {
          // Native iPhone iOS Safari
          (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch {
      // Fallback for mobile devices that throw on element fullscreen
      try {
        if (video && 'webkitEnterFullscreen' in video) {
          (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen()
        }
      } catch {
        // ignore
      }
    }
  }, [])

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null }
      setIsFullscreen(!!doc.fullscreenElement || !!doc.webkitFullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
    }
  }, [])

  // Timeline Scrubbing Logic (Supports both Touch Dragging on Mobile & Mouse Dragging on Desktop)
  const getPercentFromClientX = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0
    const rect = timelineRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    return Math.max(0, Math.min(1, relativeX / rect.width))
  }, [])

  const seekToPercent = useCallback((percent: number) => {
    const video = videoRef.current
    if (!video || !duration) return
    const newTime = percent * duration
    video.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration])

  // Touch handlers for mobile dragging / scrubbing
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!duration || e.touches.length === 0) return
    e.stopPropagation()
    setIsScrubbing(true)
    handleUserActivity()
    const percent = getPercentFromClientX(e.touches[0].clientX)
    seekToPercent(percent)
    setHoverPosition({
      percent: percent * 100,
      time: percent * duration,
    })
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!duration || e.touches.length === 0) return
    e.stopPropagation()
    handleUserActivity()
    const percent = getPercentFromClientX(e.touches[0].clientX)
    seekToPercent(percent)
    setHoverPosition({
      percent: percent * 100,
      time: percent * duration,
    })
  }

  const handleTouchEnd = (e?: React.TouchEvent<HTMLDivElement>) => {
    if (e) e.stopPropagation()
    setIsScrubbing(false)
    setHoverPosition(null)
    handleUserActivity()
  }

  // Mouse handlers for desktop click & drag
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    e.stopPropagation()
    setIsScrubbing(true)
    handleUserActivity()
    const percent = getPercentFromClientX(e.clientX)
    seekToPercent(percent)
    setHoverPosition({
      percent: percent * 100,
      time: percent * duration,
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    const percent = getPercentFromClientX(e.clientX)
    if (isScrubbing) {
      seekToPercent(percent)
    }
    setHoverPosition({
      percent: percent * 100,
      time: percent * duration,
    })
  }

  const handleMouseLeave = () => {
    if (!isScrubbing) {
      setHoverPosition(null)
    }
  }

  // Global mouse & touch listeners while dragging / scrubbing
  useEffect(() => {
    if (!isScrubbing) return

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!duration) return
      const percent = getPercentFromClientX(e.clientX)
      seekToPercent(percent)
      setHoverPosition({
        percent: percent * 100,
        time: percent * duration,
      })
    }

    const handleWindowMouseUp = () => {
      setIsScrubbing(false)
      setHoverPosition(null)
      handleUserActivity()
    }

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (!duration || e.touches.length === 0) return
      const percent = getPercentFromClientX(e.touches[0].clientX)
      seekToPercent(percent)
      setHoverPosition({
        percent: percent * 100,
        time: percent * duration,
      })
    }

    const handleWindowTouchEnd = () => {
      setIsScrubbing(false)
      setHoverPosition(null)
      handleUserActivity()
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: true })
    window.addEventListener('touchend', handleWindowTouchEnd)
    window.addEventListener('touchcancel', handleWindowTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
      window.removeEventListener('touchmove', handleWindowTouchMove)
      window.removeEventListener('touchend', handleWindowTouchEnd)
      window.removeEventListener('touchcancel', handleWindowTouchEnd)
    }
  }, [isScrubbing, duration, getPercentFromClientX, seekToPercent, handleUserActivity])

  // Keyboard accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const activeTag = document.activeElement?.tagName.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(5)
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-5)
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(volume + 0.1)
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(volume - 0.1)
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
      }
    },
    [togglePlay, skip, volume, handleVolumeChange, toggleMute, toggleFullscreen]
  )

  // Progress update & buffer calculation
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setCurrentTime(video.currentTime)

    if (video.buffered.length > 0) {
      try {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        setBufferedTime(bufferedEnd)
      } catch {
        // Safe fallback
      }
    }
  }

  // Double tap / double click detection
  const handleContainerDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width

    if (x < width * 0.3) {
      skip(-5)
    } else if (x > width * 0.7) {
      skip(5)
    } else {
      toggleFullscreen()
    }
  }

  // If embedded iframe video (Aparat / YouTube)
  if (type === 'aparat' || type === 'youtube') {
    return (
      <div
        className={cn(
          'relative w-full aspect-video overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl',
          className
        )}
      >
        <iframe
          src={src}
          title={title || 'ویدئو معرفی'}
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'
          allowFullScreen
          className='size-full border-0'
        />
      </div>
    )
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      role='region'
      aria-label={title || 'پخش‌کننده ویدئو معرفی و آموزش'}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={handleUserActivity}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={cn(
        'group relative w-full aspect-video overflow-hidden rounded-2xl bg-black select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/60 shadow-2xl',
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : '',
        className
      )}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        preload='metadata'
        className='size-full object-contain cursor-pointer'
        onClick={togglePlay}
        onDoubleClick={handleContainerDoubleClick}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false)
          setIsPlaying(true)
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false)
          setShowControls(true)
        }}
        onError={() => {
          setHasError(true)
          setIsBuffering(false)
        }}
      />

      {/* Loading / Buffering Spinner */}
      {isBuffering && !hasError && (
        <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity'>
          <div className='flex size-14 items-center justify-center rounded-2xl bg-black/60 border border-white/10 text-primary shadow-xl'>
            <Loader2 className='size-7 animate-spin' />
          </div>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className='absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/95 p-6 text-center text-white gap-3'>
          <AlertCircle className='size-10 text-rose-500' />
          <h3 className='text-sm sm:text-base font-semibold'>خطا در بارگذاری ویدئو</h3>
          <p className='text-xs text-neutral-400 max-w-sm'>
            امکان پخش این ویدئو در حال حاضر وجود ندارد. می‌توانید مستقیماً فایل را باز کنید یا اتصال اینترنت خود را بررسی نمایید.
          </p>
          <a
            href={src}
            target='_blank'
            rel='noopener noreferrer'
            className='mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition'
          >
            مشاهده مستقیم فایل ویدئو
          </a>
        </div>
      )}

      {/* Center Feedback Animation (Play/Pause/Skip) */}
      {centerFeedback && (
        <div
          key={`${centerFeedback.type}-${centerFeedback.id}`}
          className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center'
        >
          <div className='flex size-11 sm:size-16 items-center justify-center rounded-full bg-black/75 border border-white/15 text-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-75 duration-200'>
            {centerFeedback.type === 'play' && <Play className='size-5 sm:size-7 fill-white' />}
            {centerFeedback.type === 'pause' && <Pause className='size-5 sm:size-7 fill-white' />}
            {centerFeedback.type === 'seek-forward' && <RotateCw className='size-5 sm:size-7' />}
            {centerFeedback.type === 'seek-backward' && <RotateCcw className='size-5 sm:size-7' />}
          </div>
        </div>
      )}

      {/* Initial / Paused Center Hero Button */}
      {!isPlaying && !isBuffering && !hasError && (
        <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all'>
          <button
            type='button'
            onClick={togglePlay}
            aria-label='پخش ویدئو'
            className='pointer-events-auto group/hero flex size-11 sm:size-18 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-2xl backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-110 hover:bg-primary active:scale-95'
          >
            <Play className='size-5 sm:size-8 fill-current transition-transform group-hover/hero:scale-110' />
          </button>
        </div>
      )}

      {/* Bottom Controls Bar (Glassmorphic Floating Pill / Dock) */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-20 px-2.5 pb-2 pt-1 sm:p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-all duration-300',
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {/* Scrubber / Progress Bar */}
        <div
          ref={timelineRef}
          role='slider'
          aria-label='نوار پیشرفت ویدئو'
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          aria-valuetext={formatTime(currentTime)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className='relative mb-0.5 sm:mb-2.5 flex h-6 w-full cursor-pointer items-center group/scrubber touch-none select-none py-1.5'
        >
          {/* Hover / Scrubbing Time Tooltip */}
          {(hoverPosition || isScrubbing) && (
            <div
              style={{ left: `${hoverPosition ? hoverPosition.percent : progressPercent}%` }}
              className='pointer-events-none absolute bottom-6 -translate-x-1/2 rounded-md bg-neutral-900/95 border border-white/10 px-1.5 py-0.5 text-[9px] sm:text-xs font-mono font-medium text-white shadow-lg backdrop-blur-md z-30'
            >
              {formatTime(hoverPosition ? hoverPosition.time : currentTime)}
            </div>
          )}

          {/* Timeline Background Rail */}
          <div
            className={cn(
              'relative w-full rounded-full bg-white/20 transition-all',
              isScrubbing ? 'h-1.5 sm:h-2' : 'h-1 sm:h-1.5 group-hover/scrubber:h-2'
            )}
          >
            {/* Buffered Progress */}
            <div
              style={{ width: `${bufferPercent}%` }}
              className='absolute top-0 left-0 h-full rounded-full bg-white/30 transition-all duration-150'
            />
            {/* Played Progress */}
            <div
              style={{ width: `${progressPercent}%` }}
              className='absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-primary to-primary/90'
            />
          </div>

          {/* Scrubber Pin Head */}
          <div
            style={{ left: `${progressPercent}%` }}
            className={cn(
              'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 sm:size-3.5 rounded-full bg-white shadow-md ring-2 ring-primary transition-transform',
              isScrubbing ? 'scale-125 ring-3 sm:ring-4' : 'group-hover/scrubber:scale-125'
            )}
          />
        </div>

        {/* Controls Row */}
        <div className='flex items-center justify-between gap-1 sm:gap-2 text-white' dir='ltr'>
          {/* Left Group: Play, Skips, Volume, Time */}
          <div className='flex items-center gap-0.5 sm:gap-1.5'>
            {/* Play / Pause Toggle */}
            <button
              type='button'
              onClick={togglePlay}
              aria-label={isPlaying ? 'توقف موقت' : 'پخش'}
              className='flex size-7 sm:size-9 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition backdrop-blur-md'
            >
              {isPlaying ? (
                <Pause className='size-3.5 sm:size-4.5 fill-white' />
              ) : (
                <Play className='size-3.5 sm:size-4.5 fill-white' />
              )}
            </button>

            {/* Skip Back 5s */}
            <button
              type='button'
              onClick={() => skip(-5)}
              aria-label='۵ ثانیه به عقب'
              title='۵ ثانیه عقب‌تر'
              className='flex size-7 sm:size-9 items-center justify-center rounded-lg sm:rounded-xl hover:bg-white/10 active:scale-95 transition'
            >
              <RotateCcw className='size-3 sm:size-4' />
            </button>

            {/* Skip Forward 5s */}
            <button
              type='button'
              onClick={() => skip(5)}
              aria-label='۵ ثانیه به جلو'
              title='۵ ثانیه جلوتر'
              className='flex size-7 sm:size-9 items-center justify-center rounded-lg sm:rounded-xl hover:bg-white/10 active:scale-95 transition'
            >
              <RotateCw className='size-3 sm:size-4' />
            </button>

            {/* Volume Control */}
            <div className='relative flex items-center group/volume'>
              <button
                type='button'
                onClick={toggleMute}
                aria-label={isMuted ? 'فعال کردن صدا' : 'قطع صدا'}
                title={isMuted ? 'با صدا' : 'بی‌صدا'}
                className='flex size-7 sm:size-9 items-center justify-center rounded-lg sm:rounded-xl hover:bg-white/10 active:scale-95 transition'
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className='size-3.5 sm:size-4 text-rose-400' />
                ) : volume < 0.5 ? (
                  <Volume1 className='size-3.5 sm:size-4' />
                ) : (
                  <Volume2 className='size-3.5 sm:size-4' />
                )}
              </button>

              {/* Volume Slider Drawer */}
              <div className='hidden sm:flex items-center w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-200 ease-out ps-1'>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.05'
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  aria-label='میزان بلندی صدا'
                  className='h-1 w-18 accent-primary cursor-pointer'
                />
              </div>
            </div>

            {/* Time Indicator */}
            <div className='ms-1 flex h-7 sm:h-9 items-center text-[10px] sm:text-xs font-mono font-medium text-white/90 tabular-nums select-none leading-none'>
              <span className='inline-flex items-center leading-none'>{formatTime(currentTime)}</span>
              <span className='mx-1 text-white/40 font-sans text-[9px] sm:text-xs select-none'>/</span>
              <span className='inline-flex items-center text-white/60 leading-none'>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Group: PiP (desktop only), Fullscreen */}
          <div className='flex items-center gap-0.5 sm:gap-2'>
            {/* Picture-in-Picture (Hidden on mobile, only on desktop) */}
            {isPipAvailable && (
              <button
                type='button'
                onClick={togglePip}
                aria-label='تصویر در تصویر'
                title='پخش شناور (تصویر در تصویر)'
                className='hidden sm:flex size-8 sm:size-9 items-center justify-center rounded-xl hover:bg-white/10 active:scale-95 transition'
              >
                <PictureInPicture2 className='size-4' />
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type='button'
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'}
              title={isFullscreen ? 'خروج از تمام‌صفحه (F)' : 'تمام‌صفحه (F)'}
              className='flex size-7 sm:size-9 items-center justify-center rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition backdrop-blur-md'
            >
              {isFullscreen ? (
                <Minimize2 className='size-3.5 sm:size-4' />
              ) : (
                <Maximize2 className='size-3.5 sm:size-4' />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
