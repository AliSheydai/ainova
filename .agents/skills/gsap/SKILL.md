---
name: gsap
description: >-
  Comprehensive guide and best practices for GreenSock Animation Platform (GSAP v3+).
  Use when designing or implementing animations, interactive timelines, scroll-driven effects
  (ScrollTrigger), layout transitions (Flip), micro-interactions, responsive animation queries
  (matchMedia), and integrating GSAP with modern React and Next.js (App Router & Pages Router).
---

# GSAP (GreenSock Animation Platform) Mastery Guide

This skill provides essential guidelines, battle-tested patterns, and troubleshooting steps for building performant, responsive, and robust animations using **GSAP v3+** in modern web applications (React, Next.js, Vue, vanilla HTML/JS).

---

## 1. Core Architecture & Syntax

### Basic Tweens
Always use GSAP v3 syntax:
```ts
// Move to target state
gsap.to(".element", { x: 100, opacity: 1, duration: 0.8, ease: "power2.out" });

// Animate from initial state to current CSS state
gsap.from(".element", { y: 40, opacity: 0, duration: 0.6, ease: "back.out(1.7)" });

// Explicit start and end states (avoids CSS ambiguity)
gsap.fromTo(".element", 
  { opacity: 0, y: 30, scale: 0.95 },
  { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power3.out" }
);

// Instant state change without animation
gsap.set(".element", { transformOrigin: "50% 50%", autoAlpha: 0 });
```

### Critical Animation Properties
- **Transforms**: Use `x`, `y`, `xPercent`, `yPercent`, `scale`, `rotation`, `skewX`, `skewY` instead of `top`, `left`, `width`, `height`. These animate on the GPU compositor thread without triggering layout reflows.
- **Visibility / FOUC**: Use `autoAlpha` instead of `opacity`. `autoAlpha: 0` automatically sets `opacity: 0` AND `visibility: hidden`, preventing interaction on invisible elements and eliminating Flash of Unstyled Content (FOUC).
- **Easing**: Default is `"power1.out"`. Standard choices:
  - Smooth deceleration: `"power2.out"`, `"power3.out"`, `"expo.out"`
  - Natural bounciness: `"back.out(1.7)"`, `"elastic.out(1, 0.3)"`
  - Scrub / continuous animations: `"none"` (linear)

---

## 2. Timelines & Position Parameter

Never chain loose tweens with manual `delay`. Always use `gsap.timeline()`:

```ts
const tl = gsap.timeline({
  defaults: { duration: 0.6, ease: "power2.out" },
  onComplete: () => console.log("Sequence done")
});

tl.from(".title", { y: -20, autoAlpha: 0 })
  .from(".subtitle", { y: -10, autoAlpha: 0 }, "-=0.3") // Starts 0.3s before previous ends
  .from(".button", { scale: 0.8, autoAlpha: 0 }, "<")   // Starts simultaneously with subtitle
  .from(".features > div", { 
    y: 30, 
    autoAlpha: 0, 
    stagger: 0.1 
  }, "+=0.2");                                         // 0.2s gap after previous
```

### Position Parameter Cheat Sheet
| Syntax | Meaning |
| :--- | :--- |
| *(omitted)* | Directly after the previous animation finishes |
| `"+=0.5"` | 0.5 seconds after previous finishes (gap) |
| `"-=0.5"` | 0.5 seconds before previous finishes (overlap) |
| `"<"` | At the start of the previous animation |
| `"<0.2"` | 0.2 seconds after the start of the previous animation |
| `">"` | At the end of the previous animation |
| `1.5` | Exactly 1.5 seconds from the timeline start |
| `"myLabel"` | At the position of the label `"myLabel"` |

---

## 3. React & Next.js (App Router) Integration

### Required Dependencies
```bash
npm install gsap @gsap/react
```

### The Official `useGSAP` Hook
Always use `@gsap/react`'s `useGSAP` instead of raw `useEffect`. It handles automatic cleanup and prevents memory leaks or double-animation bugs caused by React 18/19 StrictMode.

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugins once outside components (or inside client-safe guard)
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // All selector strings (e.g. ".card") are automatically scoped to containerRef!
      gsap.from(".hero-card", {
        y: 50,
        autoAlpha: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
      });
    },
    { scope: containerRef } // Scoping avoids bleeding selectors into other components
  );

  return (
    <section ref={containerRef} className="hero-section">
      <div className="hero-card">Feature 1</div>
      <div className="hero-card">Feature 2</div>
      <div className="hero-card">Feature 3</div>
    </section>
  );
}
```

### React Dependencies in `useGSAP`
If an animation depends on component state or props, supply `dependencies`:
```tsx
useGSAP(() => {
  gsap.to(".counter", { innerText: count, snap: { innerText: 1 } });
}, { scope: containerRef, dependencies: [count], revertOnUpdate: true });
```

---

## 4. ScrollTrigger

### Basic Scroll Trigger
```ts
gsap.from(".reveal-on-scroll", {
  scrollTrigger: {
    trigger: ".reveal-on-scroll",
    start: "top 80%",       // When top of element hits 80% of viewport height
    end: "bottom 20%",
    toggleActions: "play none none reverse", // onEnter, onLeave, onEnterBack, onLeaveBack
    markers: process.env.NODE_ENV === "development", // debug markers in dev only
  },
  y: 60,
  autoAlpha: 0,
  duration: 1,
  ease: "power2.out"
});
```

### Smooth Scrub & Pinning (Parallax / Progress)
```ts
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".pinned-section",
    start: "top top",
    end: "+=1500",           // Scroll distance for duration
    scrub: 1,                // 1 second smooth catch-up
    pin: true,               // Pins the section in place while scrubbing
    anticipatePin: 1,        // Smoothes out pin snap
  }
});

tl.to(".bg-layer", { scale: 1.2, ease: "none" })
  .to(".foreground-content", { y: -100, autoAlpha: 0, ease: "none" }, "<");
```

### Horizontal Scroll Recipe
```ts
const panels = gsap.utils.toArray<HTMLElement>(".panel");

gsap.to(panels, {
  xPercent: -100 * (panels.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: ".horizontal-container",
    pin: true,
    scrub: 1,
    snap: 1 / (panels.length - 1),
    end: () => `+=${document.querySelector(".horizontal-container")?.scrollWidth ?? 2000}`,
  }
});
```

---

## 5. Responsive Animations with `gsap.matchMedia()`

Never manually calculate screen widths with `window.innerWidth`. Use `gsap.matchMedia()`:

```tsx
useGSAP(() => {
  const mm = gsap.matchMedia();

  // Desktop only
  mm.add("(min-width: 768px)", () => {
    gsap.to(".sidebar", { x: 0, duration: 0.5 });
  });

  // Mobile only
  mm.add("(max-width: 767px)", () => {
    gsap.to(".sidebar", { xPercent: -100, duration: 0.3 });
  });

  // Accessibility: respect reduced motion preferences
  mm.add("(prefers-reduced-motion: reduce)", () => {
    gsap.set("*", { transition: "none", animation: "none" });
  });
}, { scope: containerRef });
```

---

## 6. Performance & Golden Rules

1. **Composite-only properties**: Only animate `transform` (`x`, `y`, `scale`, `rotation`) and `opacity` (`autoAlpha`).
2. **High-frequency updates (Mousemove / Cursor Follower)**: Use `gsap.quickTo()` or `gsap.quickSetter()` instead of instantiating new `gsap.to()` tweens on every mouse event:
   ```ts
   const xTo = gsap.quickTo(".cursor", "x", { duration: 0.2, ease: "power3" });
   const yTo = gsap.quickTo(".cursor", "y", { duration: 0.2, ease: "power3" });
   window.addEventListener("mousemove", (e) => {
     xTo(e.clientX);
     yTo(e.clientY);
   });
   ```
3. **Avoid FOUC (Flash of Unstyled Content)**: Set initial CSS:
   ```css
   .gsap-reveal {
     visibility: hidden;
   }
   ```
   and animate with `gsap.to(".gsap-reveal", { autoAlpha: 1, ... })`.
4. **Recalculating ScrollTrigger**: When DOM elements change height dynamically or asynchronous images load:
   ```ts
   ScrollTrigger.refresh();
   ```

---

## 7. Additional References

- For detailed React 18/19 & Next.js patterns, read [react-nextjs.md](./references/react-nextjs.md).
- For complete ScrollTrigger recipes and layout tricks, read [scrolltrigger-recipes.md](./references/scrolltrigger-recipes.md).
