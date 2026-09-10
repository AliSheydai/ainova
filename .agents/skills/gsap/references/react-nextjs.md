# GSAP in React & Next.js (App Router / Pages Router)

This reference covers deep integration patterns, edge cases, and best practices when using GSAP within React (18 and 19) and Next.js applications.

---

## 1. Why `useGSAP` instead of `useEffect`?

React 18 introduced Strict Mode behavior where effects mount, unmount, and mount again in development. With raw `useEffect`, tweens and timelines created on the first mount often get stranded or conflict with the second mount, leading to:
- Broken animations
- Doubled values (e.g. animating `x: "+=100"` triggers twice to 200)
- Memory leaks
- Non-functioning `ScrollTrigger` instances

The `@gsap/react` hook `useGSAP`:
1. Creates a `gsap.context()` under the hood.
2. Automatically calls `context.revert()` when the component unmounts.
3. Automatically scopes selector queries to a given `ref` container.

---

## 2. Standard Pattern with `useGSAP` and Scope

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export function FeatureCards() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    (context, contextSafe) => {
      // Scoped selection: automatically targets elements with class .card INSIDE container
      gsap.from(".card", {
        y: 40,
        autoAlpha: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container.current,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
      });
    },
    { scope: container }
  );

  return (
    <div ref={container} className="grid grid-cols-3 gap-6">
      <div className="card">Card A</div>
      <div className="card">Card B</div>
      <div className="card">Card C</div>
    </div>
  );
}
```

---

## 3. Event Listeners & Interactive Handlers (`contextSafe`)

Animations created inside event handlers (such as `onClick`, `onMouseEnter`) are outside the initial execution scope of `useGSAP`. To ensure they are tracked and cleaned up on unmount, wrap them with `contextSafe`:

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function InteractiveButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { contextSafe } = useGSAP({ scope: buttonRef });

  const handleClick = contextSafe(() => {
    gsap.to(buttonRef.current, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power1.inOut",
    });
  });

  return (
    <button ref={buttonRef} onClick={handleClick} className="btn-primary">
      Click Me
    </button>
  );
}
```

---

## 4. Next.js App Router Page Transitions & Route Changes

When navigating between routes in Next.js App Router, old `ScrollTrigger` instances might remain pinned or misaligned with the new scroll position.

Add a route change refresher:

```tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function GSAPRouteSync() {
  const pathname = usePathname();

  useEffect(() => {
    // Wait for DOM paint after route transition
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
```

Include `<GSAPRouteSync />` inside your root layout or template.

---

## 5. Avoiding Flash of Unstyled Content (FOUC)

In SSR frameworks like Next.js, HTML is rendered before GSAP initializes on the client. If an element is supposed to animate from `opacity: 0`, users might see a quick flash of the element before GSAP hides and animates it.

**Recommended Solution**:
1. Add an initial CSS rule:
   ```css
   .gsap-init-hidden {
     visibility: hidden;
     opacity: 0;
   }
   ```
2. When triggering the animation:
   ```ts
   gsap.to(".gsap-init-hidden", {
     autoAlpha: 1,
     duration: 0.6,
     stagger: 0.1,
   });
   ```
   `autoAlpha` takes care of switching `visibility: visible` and animating `opacity`.
