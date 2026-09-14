'use client';

import {
  useEffect,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

export interface InfiniteSpiralItem {
  id?: string | number;
  src?: string;
  alt?: string;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  label?: string;
  content?: ReactNode;
  [key: string]: any;
}

export interface InfiniteSpiralRef {
  next: (step?: number) => void;
  prev: (step?: number) => void;
  pause: () => void;
  play: () => void;
  setProgress: (progress: number) => void;
}

export interface InfiniteSpiralProps<T = any> {
  items?: T[];
  renderItem?: (item: T, index: number) => ReactNode;
  speed?: number;
  direction?: 'up' | 'down';
  animationMode?: 'auto' | 'drag' | 'scroll' | 'all';
  enableScroll?: boolean;
  radius?: number;
  cardWidth?: number;
  cardHeight?: number;
  verticalSpacing?: number;
  perspective?: number;
  cardsPerTurn?: number;
  rotation?: number;
  cardTilt?: number;
  cardRadius?: number;
  centerScale?: number;
  edgeFade?: number;
  edgeBlur?: number;
  pauseOnHover?: boolean;
  imageFit?: CSSProperties['objectFit'];
  grayscale?: number;
  className?: string;
  itemClassName?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const modulo = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;
const smoothstep = (min: number, max: number, value: number) => {
  const x = clamp((value - min) / (max - min || 1), 0, 1);
  return x * x * (3 - 2 * x);
};

export const InfiniteSpiral = forwardRef<InfiniteSpiralRef, InfiniteSpiralProps>(function InfiniteSpiral(
  {
    items = [],
    renderItem,
    speed = 0.55,
    direction = 'up',
    animationMode = 'auto',
    enableScroll = false,
    radius = 170,
    cardWidth = 100,
    cardHeight = 100,
    verticalSpacing = 60,
    perspective = 1000,
    cardsPerTurn = 7,
    rotation = 0,
    cardTilt = 0,
    cardRadius = 14,
    centerScale = 1.15,
    edgeFade = 0.3,
    edgeBlur = 4,
    pauseOnHover = true,
    imageFit = 'cover',
    grayscale = 0,
    className = '',
    itemClassName = '',
  },
  ref
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLAnchorElement | HTMLDivElement | null>>([]);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const autoSpeedRef = useRef(0);
  const hoveredRef = useRef(false);
  const visibleRef = useRef(true);
  const draggingRef = useRef(false);
  const manualPausedRef = useRef(false);
  const lastPointerYRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const startPointerXRef = useRef(0);
  const startPointerYRef = useRef(0);
  const isTouchDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);

  // Expose imperative methods (next, prev, pause, play, setProgress)
  useImperativeHandle(
    ref,
    () => ({
      next: (step = 1) => {
        targetProgressRef.current += step;
      },
      prev: (step = 1) => {
        targetProgressRef.current -= step;
      },
      pause: () => {
        manualPausedRef.current = true;
      },
      play: () => {
        manualPausedRef.current = false;
      },
      setProgress: (p: number) => {
        targetProgressRef.current = p;
      },
    }),
    []
  );

  const normalizedItems = useMemo(() => {
    return items.map((item, index) => {
      if (typeof item === 'string') {
        return { src: item, alt: `Item ${index + 1}` };
      }
      return (item || {}) as InfiniteSpiralItem;
    });
  }, [items]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || normalizedItems.length === 0) return;

    let frameId = 0;
    let previousTime = performance.now();
    let bounds = root.getBoundingClientRect();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const scrollEnabled = enableScroll && (animationMode === 'scroll' || animationMode === 'all');
    const scrollSpeedMultiplier = Math.max(speed, 0) / 0.55;
    let lastScrollY = window.scrollY;

    const resizeObserver = new ResizeObserver(() => {
      if (root) {
        bounds = root.getBoundingClientRect();
      }
    });
    resizeObserver.observe(root);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    });
    intersectionObserver.observe(root);

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const scrollDelta = nextScrollY - lastScrollY;
      lastScrollY = nextScrollY;
      if (!scrollEnabled || !visibleRef.current || scrollDelta === 0) return;
      targetProgressRef.current += clamp(
        (scrollDelta * scrollSpeedMultiplier) / Math.max(verticalSpacing * 2, 1),
        -1.5,
        1.5
      );
    };
    if (scrollEnabled) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    const render = (time: number) => {
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      const autoEnabled = animationMode === 'auto' || animationMode === 'all';
      const motionPaused =
        draggingRef.current || (pauseOnHover && hoveredRef.current) || manualPausedRef.current;
      const directionMultiplier = direction === 'down' ? -1 : 1;
      const desiredAutoSpeed =
        autoEnabled && visibleRef.current && !reducedMotion.matches && !motionPaused
          ? speed * directionMultiplier
          : 0;
      const speedBlend = 1 - Math.exp(-delta * 7);
      autoSpeedRef.current += (desiredAutoSpeed - autoSpeedRef.current) * speedBlend;
      targetProgressRef.current += autoSpeedRef.current * delta;

      const followBlend = 1 - Math.exp(-delta * (draggingRef.current ? 22 : 11));
      progressRef.current += (targetProgressRef.current - progressRef.current) * followBlend;

      const count = normalizedItems.length;
      const half = count / 2;
      const width = Math.max(bounds.width, 1);
      const height = Math.max(bounds.height, 1);

      // Responsive fit: dynamically scales without shrinking text cards into unreadable sizes on mobile
      const isMobile = width < 640;
      const maxMobileCardWidth = Math.max(200, width - 40);
      const mobileWidthFit = cardWidth > maxMobileCardWidth ? maxMobileCardWidth / cardWidth : 1;
      const widthDivider = isMobile ? Math.max(cardWidth * 1.15, 260) : cardWidth * 2.2;
      const heightDivider = cardHeight * 1.85;
      const rawFit = Math.min(1, width / widthDivider, height / heightDivider, mobileWidthFit);
      const fit = Math.max(0.68, Math.min(1, rawFit));
      const responsiveRadius = isMobile
        ? Math.max(40, Math.min(radius, width * 0.22, 85))
        : Math.max(60, Math.min(radius, width * 0.38)) * fit;

      const fadeStart = clamp(1 - edgeFade, 0, 0.98);
      const turnSize = Math.max(cardsPerTurn, 1);
      const halfHeight = height * 0.5;
      const yFadeStart = halfHeight * 0.42;
      const yFadeEnd = halfHeight * 0.88;

      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const offset = modulo(index - progressRef.current + half, count) - half;
        const yPos = offset * verticalSpacing * (isMobile ? 0.95 : fit);
        const yEdge = clamp((Math.abs(yPos) - yFadeStart) / Math.max(yFadeEnd - yFadeStart, 1), 0, 1);
        const yOpacity = 1 - smoothstep(0, 1, yEdge);

        const edge = Math.min(Math.abs(offset) / Math.max(half, 1), 1);
        const spiralOpacity = 1 - smoothstep(fadeStart, 1, edge);
        const opacity = Math.min(yOpacity, spiralOpacity);

        const focus = 1 - Math.min(Math.abs(offset) / Math.max(turnSize * 0.65, 1), 1);
        const effectiveCenterScale = isMobile ? Math.min(centerScale, 1.06) : centerScale;
        const scale = (1 + (effectiveCenterScale - 1) * focus) * fit;
        const angle = offset * (360 / turnSize) + rotation;
        const angleRadians = (angle * Math.PI) / 180;
        const x = Math.sin(angleRadians) * responsiveRadius;
        const z = Math.cos(angleRadians) * responsiveRadius;
        const depthScale = clamp(
          perspective / Math.max(perspective - z, 1),
          0.72,
          isMobile ? 1.12 : 1.35
        );
        const visualScale = scale * depthScale;
        const depth = (z / Math.max(responsiveRadius, 1) + 1) / 2;
        const blurFactor = Math.max(edge, yEdge);
        const blur = edgeBlur * smoothstep(0.25, 1, blurFactor);

        card.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${yPos}px, 0) rotateZ(${cardTilt}deg) scale(${visualScale})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
        card.style.zIndex = String(Math.round(depth * 100000) + index);
        card.style.pointerEvents = opacity > 0.35 ? 'auto' : 'none';
      });
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      if (scrollEnabled) {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [
    normalizedItems,
    speed,
    direction,
    animationMode,
    enableScroll,
    radius,
    perspective,
    cardWidth,
    cardHeight,
    verticalSpacing,
    cardsPerTurn,
    rotation,
    cardTilt,
    centerScale,
    edgeFade,
    edgeBlur,
    pauseOnHover,
  ]);

  const dragEnabled = animationMode === 'drag' || animationMode === 'all';

  const rootStyle = {
    perspective: `${perspective}px`,
    '--spiral-width': `${cardWidth}px`,
    '--spiral-height': `${cardHeight}px`,
    '--spiral-radius': `${cardRadius}px`,
    cursor: dragEnabled ? 'grab' : 'default',
    // pan-y ensures vertical page scrolling on mobile devices works naturally without being trapped!
    touchAction: dragEnabled ? 'pan-y' : 'auto',
    userSelect: dragEnabled ? 'none' : 'auto',
  } as CSSProperties;

  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current && !isTouchDraggingRef.current) return;
    draggingRef.current = false;
    isTouchDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (_) {}
    }
    event.currentTarget.style.cursor = dragEnabled ? 'grab' : 'default';
  };

  const setCardRef = (index: number) => (node: HTMLAnchorElement | HTMLDivElement | null) => {
    cardRefs.current[index] = node;
  };

  const cardStyle: CSSProperties = {
    width: cardWidth,
    height: cardHeight,
    borderRadius: cardRadius,
  };

  const imageStyle: CSSProperties = {
    width: cardWidth,
    height: cardHeight,
    maxWidth: 'none',
    maxHeight: 'none',
    objectFit: imageFit,
    filter: `grayscale(${Math.min(1, Math.max(0, grayscale))})`,
  };

  const defaultItemClassName =
    'absolute left-1/2 top-1/2 block overflow-hidden rounded-[var(--spiral-radius)] border border-border/80 bg-card/95 dark:bg-card/90 backdrop-blur-md shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)] [backface-visibility:hidden] [transform-style:preserve-3d] [will-change:transform,opacity,filter] motion-reduce:transition-none';

  const combinedItemClassName = `${defaultItemClassName} ${itemClassName}`.trim();

  return (
    <div
      ref={rootRef}
      className={`relative h-full min-h-80 w-full overflow-hidden select-none ${className}`}
      style={rootStyle}
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
      onPointerDown={(event) => {
        if (!dragEnabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
        startPointerXRef.current = event.clientX;
        startPointerYRef.current = event.clientY;
        lastPointerYRef.current = event.clientY;
        lastPointerXRef.current = event.clientX;
        dragMovedRef.current = false;

        if (event.pointerType === 'mouse') {
          draggingRef.current = true;
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch (_) {}
          event.currentTarget.style.cursor = 'grabbing';
        }
      }}
      onPointerMove={(event) => {
        if (event.pointerType === 'mouse') {
          if (!draggingRef.current) return;
          const deltaY = event.clientY - lastPointerYRef.current;
          const deltaX = event.clientX - lastPointerXRef.current;
          lastPointerYRef.current = event.clientY;
          lastPointerXRef.current = event.clientX;
          if (Math.abs(deltaY) > 0.5 || Math.abs(deltaX) > 0.5) {
            dragMovedRef.current = true;
          }
          const delta = deltaY - deltaX * 0.4;
          targetProgressRef.current -= delta / Math.max(verticalSpacing, 1);
        } else {
          // Touch device handling: only capture if intentional horizontal swipe
          const totalX = Math.abs(event.clientX - startPointerXRef.current);
          const totalY = Math.abs(event.clientY - startPointerYRef.current);

          if (!isTouchDraggingRef.current && totalX > 8 && totalX > totalY * 1.2) {
            isTouchDraggingRef.current = true;
            draggingRef.current = true;
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch (_) {}
          }

          if (isTouchDraggingRef.current) {
            const deltaX = event.clientX - lastPointerXRef.current;
            lastPointerXRef.current = event.clientX;
            lastPointerYRef.current = event.clientY;
            if (Math.abs(deltaX) > 0.5) dragMovedRef.current = true;
            targetProgressRef.current -= (deltaX / Math.max(cardWidth * 0.8, 1)) * 1.5;
          }
        }
      }}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onClickCapture={(event) => {
        if (!dragMovedRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        dragMovedRef.current = false;
      }}
    >
      <div
        className="absolute inset-0 [transform-style:preserve-3d]"
        role="list"
        aria-label="3D Infinite review spiral gallery"
      >
        {normalizedItems.map((item, index) => {
          // Determine custom renderItem vs item.content vs standard img
          const hasCustomRender = typeof renderItem === 'function';
          const hasCustomContent = Boolean(item.content);

          let innerContent: ReactNode;
          if (hasCustomRender) {
            innerContent = renderItem(items[index] ?? item, index);
          } else if (hasCustomContent) {
            innerContent = item.content;
          } else if (item.src) {
            innerContent = (
              <img
                className="absolute inset-0 block h-full w-full select-none object-center"
                src={item.src}
                alt={item.alt || `Spiral card ${index + 1}`}
                loading={index < 6 ? 'eager' : 'lazy'}
                draggable={false}
                style={imageStyle}
              />
            );
          } else {
            innerContent = null;
          }

          // If custom render or content is used, render a div (so inner elements can have links safely)
          if (hasCustomRender || hasCustomContent || !item.href) {
            return (
              <div
                key={item.id ? `${item.id}-${index}` : index}
                ref={setCardRef(index)}
                className={combinedItemClassName}
                style={cardStyle}
                role="listitem"
                aria-label={item.label || item.alt}
              >
                {innerContent}
              </div>
            );
          }

          return (
            <a
              key={item.id ? `${item.id}-${index}` : index}
              ref={setCardRef(index)}
              className={combinedItemClassName}
              style={cardStyle}
              href={item.href}
              target={item.target}
              rel={item.target === '_blank' ? 'noreferrer' : undefined}
              role="listitem"
              aria-label={item.label || item.alt}
            >
              {innerContent}
            </a>
          );
        })}
      </div>
    </div>
  );
});

export default InfiniteSpiral;
