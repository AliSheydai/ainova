# GSAP ScrollTrigger Recipes & Techniques

This reference contains production-ready patterns for scroll-driven animations and pinning.

---

## 1. Parallax Image Background

Creates a subtle, smooth depth effect where background elements move slower than scroll speed.

```ts
gsap.to(".parallax-bg", {
  yPercent: 30,
  ease: "none",
  scrollTrigger: {
    trigger: ".parallax-wrapper",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
  },
});
```

---

## 2. Pinned Multi-Step Presentation / Card Stacking

Pins a container while stacking or revealing cards sequentially as the user scrolls.

```ts
const cards = gsap.utils.toArray<HTMLElement>(".stacked-card");

const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".stacking-container",
    start: "top top",
    end: () => `+=${cards.length * 100}%`,
    pin: true,
    scrub: 1,
    anticipatePin: 1,
  },
});

cards.forEach((card, i) => {
  if (i === 0) return; // First card is already visible
  tl.from(card, {
    yPercent: 100,
    opacity: 0,
    scale: 0.9,
    ease: "power1.inOut",
  });
});
```

---

## 3. Horizontal Pinned Showcase

Pins a section and transforms vertical scroll into horizontal movement across panels.

```ts
const panelsContainer = document.querySelector(".horizontal-track") as HTMLElement;
const panels = gsap.utils.toArray<HTMLElement>(".horizontal-panel");

gsap.to(panels, {
  xPercent: -100 * (panels.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: ".horizontal-section",
    pin: true,
    scrub: 1,
    snap: 1 / (panels.length - 1),
    end: () => `+=${panelsContainer.offsetWidth}`,
    invalidateOnRefresh: true,
  },
});
```

---

## 4. Reading / Scroll Progress Bar

A sticky top progress bar that accurately tracks scroll across the page or article.

```ts
gsap.to(".scroll-progress-bar", {
  scaleX: 1,
  transformOrigin: "left center",
  ease: "none",
  scrollTrigger: {
    trigger: document.body,
    start: "top top",
    end: "bottom bottom",
    scrub: 0.3,
  },
});
```

---

## 5. ScrollTrigger Batching for Large Grids

For long product or blog lists, individual ScrollTriggers can hurt performance. Use `ScrollTrigger.batch`:

```ts
ScrollTrigger.batch(".grid-item", {
  interval: 0.1, // time window to batch items
  batchMax: 6,   // max items per batch
  onEnter: (batch) => {
    gsap.to(batch, {
      autoAlpha: 1,
      y: 0,
      stagger: 0.15,
      overwrite: true,
    });
  },
  onLeaveBack: (batch) => {
    gsap.to(batch, {
      autoAlpha: 0,
      y: 40,
      overwrite: true,
    });
  },
});
```
