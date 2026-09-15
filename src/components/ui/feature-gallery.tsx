'use client';

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

type GL = Renderer['gl'];

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: number;
  return function (this: any, ...args: Parameters<T>) {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance: any): void {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key !== 'constructor' && typeof instance[key] === 'function') {
      instance[key] = instance[key].bind(instance);
    }
  });
}

const DEFAULT_FONT = 'bold 24px Vazirmatn, Orbitron, Figtree, sans-serif';

function deriveFontFamilyFromUrl(url: string): string {
  const fileName = (url.split('/').pop() || 'custom-font').split('?')[0];
  const base = fileName.replace(/\.(woff2?|ttf|otf|eot)$/i, '');
  return base.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'CircularGalleryFont';
}

async function loadFontFromStylesheet(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font stylesheet (${response.status})`);
  const cssText = await response.text();
  const faceBlocks = cssText.match(/@font-face\s*{[^}]*}/g) || [];
  let family: string | null = null;
  const fontFaces: FontFace[] = [];
  for (const block of faceBlocks) {
    const familyMatch = block.match(/font-family:\s*['"]?([^;'"]+)['"]?/);
    const urlMatch = block.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/);
    if (!familyMatch || !urlMatch) continue;
    family = familyMatch[1].trim();
    const descriptors: FontFaceDescriptors = {};
    const weightMatch = block.match(/font-weight:\s*([^;]+);/);
    const styleMatch = block.match(/font-style:\s*([^;]+);/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);
    if (weightMatch) descriptors.weight = weightMatch[1].trim();
    if (styleMatch) descriptors.style = styleMatch[1].trim();
    if (rangeMatch) descriptors.unicodeRange = rangeMatch[1].trim();
    fontFaces.push(new FontFace(family, `url(${urlMatch[1]})`, descriptors));
  }
  if (!family) throw new Error('No @font-face rule found in the stylesheet');
  await Promise.allSettled(
    fontFaces.map(async (face) => {
      await face.load();
      document.fonts.add(face);
    })
  );
  return family;
}

async function loadFontFromFile(url: string): Promise<string> {
  const family = deriveFontFamilyFromUrl(url);
  const fontFace = new FontFace(family, `url(${url})`);
  await fontFace.load();
  document.fonts.add(fontFace);
  return family;
}

async function loadCustomFont(fontUrl: string): Promise<string> {
  const isStylesheet = fontUrl.includes('fonts.googleapis.com') || /\.css(\?.*)?$/i.test(fontUrl);
  return isStylesheet ? loadFontFromStylesheet(fontUrl) : loadFontFromFile(fontUrl);
}

async function resolveFont(font: string, fontUrl?: string): Promise<string> {
  if (!fontUrl) {
    if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
      try {
        await document.fonts.load(font);
        await document.fonts.ready;
      } catch {
        // Fallback silently
      }
    }
    return font;
  }
  try {
    const family = await loadCustomFont(fontUrl);
    const sizeMatch = font.match(/^\s*(.*?\d+px)/);
    const prefix = sizeMatch ? sizeMatch[1].trim() : 'bold 24px';
    const resolved = `${prefix} "${family}"`;
    if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
      try {
        await document.fonts.load(resolved);
      } catch {
        // Fallback silently
      }
    }
    return resolved;
  } catch (error) {
    console.warn('CircularGallery: unable to load font from', fontUrl, error);
    return font;
  }
}

function getFontSize(font: string): number {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 24;
}

function createTextTexture(
  gl: GL,
  text: string,
  font: string = 'bold 24px Vazirmatn, system-ui, sans-serif',
  color: string = '#ffffff'
): { texture: Texture; width: number; height: number } {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2d context');

  context.font = font;
  if ('direction' in context) {
    context.direction = 'rtl';
  }
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const fontSize = getFontSize(font);
  const textHeight = Math.ceil(fontSize * 1.3);

  canvas.width = Math.max(textWidth + 30, 2);
  canvas.height = Math.max(textHeight + 20, 2);

  context.font = font;
  if ('direction' in context) {
    context.direction = 'rtl';
  }
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (text) {
    context.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

interface TitleProps {
  gl: GL;
  plane: Mesh;
  renderer: Renderer;
  text: string;
  textColor?: string;
  font?: string;
}

class Title {
  gl: GL;
  plane: Mesh;
  renderer: Renderer;
  text: string;
  textColor: string;
  font: string;
  mesh!: Mesh;

  constructor({ gl, plane, renderer, text, textColor = '#ffffff', font = 'bold 24px Vazirmatn, system-ui, sans-serif' }: TitleProps) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    if (this.text && this.text.trim().length > 0) {
      this.createMesh();
    }
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.1) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeightScaled = this.plane.scale.y * 0.085;
    const textWidthScaled = textHeightScaled * aspect;
    this.mesh.scale.set(textWidthScaled, textHeightScaled, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - 0.04;
    this.mesh.setParent(this.plane);
  }
}

interface ScreenSize {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

interface MediaProps {
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius?: number;
  font?: string;
}

class Media {
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius: number;
  font?: string;
  program!: Program;
  plane!: Mesh;
  title?: Title;
  scale!: number;
  padding!: number;
  width!: number;
  widthTotal!: number;
  x!: number;
  speed: number = 0;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0.05,
    font,
  }: MediaProps) {
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.createShader();
    this.createMesh();
    if (this.text) {
      this.createTitle();
    }
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: true,
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.05 + uSpeed * 0.15);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );
          vec4 color = texture2D(tMap, uv);
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          
          // Smooth antialiasing for edges
          float edgeSmooth = 0.003;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          
          gl_FragColor = vec4(color.rgb, color.a * alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [840, 1120] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
      },
      transparent: true,
    });
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [
        img.naturalWidth || img.width || 840,
        img.naturalHeight || img.height || 1120,
      ];
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      text: this.text,
      textColor: this.textColor,
      font: this.font,
    });
  }

  update(scroll: { current: number; last: number }, _direction?: 'right' | 'left') {
    // True circular modular wrap: positions cards symmetrically around 0 in [-halfTotal, halfTotal].
    // From frame 0, Card 0 is at 0 (center), Card 1 is at +width (right), and the previous card (Card length-1)
    // is immediately placed at -width (left), so all 3 cards are visible without needing any initial scroll.
    const halfTotal = this.widthTotal / 2;
    const rawX = this.x - scroll.current;
    this.plane.position.x =
      ((((rawX + halfTotal) % this.widthTotal) + this.widthTotal) % this.widthTotal) - halfTotal;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const ratio = Math.min(Math.max(effectiveX / R, -1), 1);
      const arc = R - Math.sqrt(Math.max(R * R - effectiveX * effectiveX, 0));
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(ratio);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(ratio);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.03;
    this.program.uniforms.uSpeed.value = Math.min(Math.abs(this.speed), 2.0);

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    // Hide plane when far outside visible viewport to conserve GPU cycles
    this.plane.visible = Math.abs(this.plane.position.x) - planeOffset < viewportOffset + this.width;
  }

  onResize({ screen, viewport }: { screen?: ScreenSize; viewport?: Viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    const isMobile = this.screen.width < 640;
    const isTablet = this.screen.width < 1024;

    // Card height fraction relative to viewport - balanced padding and optimal legibility
    const cardHeightFrac = isMobile ? 0.76 : isTablet ? 0.76 : 0.78;
    const aspect = 0.75; // precise 840:1120 (3:4) card aspect ratio

    this.plane.scale.y = this.viewport.height * cardHeightFrac;
    this.plane.scale.x = this.plane.scale.y * aspect;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];

    // Responsive padding between cards
    this.padding = isMobile ? this.plane.scale.x * 0.14 : this.plane.scale.x * 0.18;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

export interface CircularGalleryItem {
  image: string;
  text: string;
  [key: string]: any;
}

export interface AppConfig {
  items?: CircularGalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  onActiveChange?: (index: number) => void;
}

class App {
  container: HTMLElement;
  scrollSpeed: number;
  scroll: {
    ease: number;
    current: number;
    target: number;
    last: number;
    position?: number;
  };
  onCheckDebounce: (...args: any[]) => void;
  renderer!: Renderer;
  gl!: GL;
  camera!: Camera;
  scene!: Transform;
  planeGeometry!: Plane;
  medias: Media[] = [];
  mediasImages: CircularGalleryItem[] = [];
  screen!: { width: number; height: number };
  viewport!: { width: number; height: number };
  raf: number = 0;
  itemsCount: number = 0;
  currentActiveIndex: number = -1;
  autoRotate: boolean;
  autoRotateSpeed: number;
  isHovered: boolean = false;
  isVisible: boolean = true;
  onActiveChange?: (index: number) => void;

  resizeObserver?: ResizeObserver;
  intersectionObserver?: IntersectionObserver;

  boundOnResize!: () => void;
  boundOnWheel!: (e: Event) => void;
  boundOnTouchDown!: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchMove!: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchUp!: () => void;
  boundOnKeyDown!: (e: KeyboardEvent) => void;
  boundOnMouseEnter!: () => void;
  boundOnMouseLeave!: () => void;

  isDown: boolean = false;
  startX: number = 0;
  startY: number = 0;
  isTouch: boolean = false;
  touchDirectionLocked: boolean = false;
  isVerticalScroll: boolean = false;

  constructor(
    container: HTMLElement,
    {
      items,
      bend = 1,
      textColor = '#ffffff',
      borderRadius = 0.05,
      font = DEFAULT_FONT,
      scrollSpeed = 2,
      scrollEase = 0.05,
      autoRotate = true,
      autoRotateSpeed = 0.35,
      onActiveChange,
    }: AppConfig
  ) {
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.autoRotate = autoRotate;
    this.autoRotateSpeed = autoRotateSpeed;
    this.onActiveChange = onActiveChange;
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);

    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.update();
    this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.renderer.gl.canvas as HTMLCanvasElement);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 40,
      widthSegments: 70,
    });
  }

  createMedias(
    items: CircularGalleryItem[] | undefined,
    bend: number = 1,
    textColor: string,
    borderRadius: number,
    font: string
  ) {
    const galleryItems = items && items.length ? items : [];
    this.itemsCount = galleryItems.length;
    // Duplicate items to form a seamless loop
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: data.text || '',
        viewport: this.viewport,
        bend,
        textColor,
        borderRadius,
        font,
      });
    });
  }

  onTouchDown(e: MouseEvent | TouchEvent) {
    this.isDown = true;
    this.isHovered = true;
    this.scroll.position = this.scroll.current;
    if ('touches' in e) {
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.isTouch = true;
      this.touchDirectionLocked = false;
      this.isVerticalScroll = false;
    } else {
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.isTouch = false;
    }
  }

  onTouchMove(e: MouseEvent | TouchEvent) {
    if (!this.isDown) return;
    const currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if ('touches' in e && !this.touchDirectionLocked) {
      const dx = Math.abs(currentX - this.startX);
      const dy = Math.abs(currentY - this.startY);
      if (dx > 7 || dy > 7) {
        this.touchDirectionLocked = true;
        if (dy > dx * 1.25) {
          // Vertical swipe detected: unlock page scroll and do not capture touch for gallery
          this.isVerticalScroll = true;
          this.isDown = false;
          return;
        }
      } else {
        return;
      }
    }

    if (this.isVerticalScroll) return;

    const distance = (this.startX - currentX) * (this.scrollSpeed * 0.025);
    this.scroll.target = (this.scroll.position ?? 0) + distance;
  }

  onTouchUp() {
    this.isDown = false;
    this.isTouch = false;
    this.isVerticalScroll = false;
    this.onCheck();
  }

  onWheel(e: Event) {
    const wheelEvent = e as WheelEvent;
    // If trackpad horizontal scroll or shift+scroll, scroll smoothly
    const delta =
      Math.abs(wheelEvent.deltaX) > Math.abs(wheelEvent.deltaY)
        ? wheelEvent.deltaX
        : wheelEvent.deltaY;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.12;
    this.onCheckDebounce();
  }

  onKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        this.next();
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.prev();
        break;
    }
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(this.scroll.target / width);
    this.scroll.target = width * itemIndex;
  }

  onResize() {
    if (!this.container) return;
    this.screen = {
      width: Math.max(this.container.clientWidth, 100),
      height: Math.max(this.container.clientHeight, 100),
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({
      aspect: this.screen.width / this.screen.height,
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach((media) =>
        media.onResize({ screen: this.screen, viewport: this.viewport })
      );
    }
  }

  next() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const currentItem = Math.round(this.scroll.target / width);
    this.scroll.target = (currentItem + 1) * width;
    this.onCheckDebounce();
  }

  prev() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const currentItem = Math.round(this.scroll.target / width);
    this.scroll.target = (currentItem - 1) * width;
    this.onCheckDebounce();
  }

  goTo(index: number) {
    if (!this.medias || !this.medias[0] || this.itemsCount <= 0) return;
    const width = this.medias[0].width;
    const currentTurn = Math.floor(this.scroll.target / (width * this.itemsCount));
    this.scroll.target = (currentTurn * this.itemsCount + index) * width;
    this.onCheckDebounce();
  }

  update() {
    if (!this.isVisible) {
      this.raf = window.requestAnimationFrame(this.update.bind(this));
      return;
    }

    if (this.autoRotate && !this.isDown && !this.isHovered) {
      this.scroll.target += this.autoRotateSpeed * 0.02;
    }

    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;

    // Report active index
    if (this.medias && this.medias[0] && this.onActiveChange && this.itemsCount > 0) {
      const width = this.medias[0].width;
      const rawIndex = Math.round(this.scroll.current / width);
      const normalizedIndex = ((rawIndex % this.itemsCount) + this.itemsCount) % this.itemsCount;
      if (normalizedIndex !== this.currentActiveIndex) {
        this.currentActiveIndex = normalizedIndex;
        this.onActiveChange(normalizedIndex);
      }
    }

    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnMouseEnter = () => {
      this.isHovered = true;
    };
    this.boundOnMouseLeave = () => {
      this.isHovered = false;
    };

    // Resize observer on container
    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(this.container);

    // Pause animation loop when off-screen to save battery & GPU
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.isVisible = entry.isIntersecting;
    });
    this.intersectionObserver.observe(this.container);

    window.addEventListener('resize', this.boundOnResize);

    // Mouse and touch interaction starts strictly on container
    this.container.addEventListener('mousedown', this.boundOnTouchDown);
    this.container.addEventListener('touchstart', this.boundOnTouchDown, { passive: true });
    this.container.addEventListener('wheel', this.boundOnWheel, { passive: true });
    this.container.addEventListener('keydown', this.boundOnKeyDown);
    this.container.addEventListener('mouseenter', this.boundOnMouseEnter);
    this.container.addEventListener('mouseleave', this.boundOnMouseLeave);

    // Drag tracking on window
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true });
    window.addEventListener('touchend', this.boundOnTouchUp);
    window.addEventListener('touchcancel', this.boundOnTouchUp);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();

    window.removeEventListener('resize', this.boundOnResize);
    window.removeEventListener('mousemove', this.boundOnTouchMove);
    window.removeEventListener('mouseup', this.boundOnTouchUp);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchUp);
    window.removeEventListener('touchcancel', this.boundOnTouchUp);

    if (this.container) {
      this.container.removeEventListener('mousedown', this.boundOnTouchDown);
      this.container.removeEventListener('touchstart', this.boundOnTouchDown);
      this.container.removeEventListener('wheel', this.boundOnWheel);
      this.container.removeEventListener('keydown', this.boundOnKeyDown);
      this.container.removeEventListener('mouseenter', this.boundOnMouseEnter);
      this.container.removeEventListener('mouseleave', this.boundOnMouseLeave);
    }

    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas as HTMLCanvasElement);
    }
  }
}

export interface CircularGalleryRef {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  pause: () => void;
  play: () => void;
}

export interface CircularGalleryProps {
  items?: CircularGalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  fontUrl?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  className?: string;
  onActiveChange?: (index: number) => void;
}

export const CircularGallery = forwardRef<CircularGalleryRef, CircularGalleryProps>(
  function CircularGallery(
    {
      items,
      bend = 1,
      textColor = '#ffffff',
      borderRadius = 0.05,
      font = DEFAULT_FONT,
      fontUrl,
      scrollSpeed = 2,
      scrollEase = 0.05,
      autoRotate = true,
      autoRotateSpeed = 0.35,
      className = '',
      onActiveChange,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<App | null>(null);

    useImperativeHandle(ref, () => ({
      next: () => appRef.current?.next(),
      prev: () => appRef.current?.prev(),
      goTo: (idx: number) => appRef.current?.goTo(idx),
      pause: () => {
        if (appRef.current) appRef.current.autoRotate = false;
      },
      play: () => {
        if (appRef.current) appRef.current.autoRotate = true;
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;
      let app: App | undefined;
      let isMounted = true;

      resolveFont(font, fontUrl).then((resolvedFont) => {
        if (!isMounted || !containerRef.current) return;
        app = new App(containerRef.current, {
          items,
          bend,
          textColor,
          borderRadius,
          font: resolvedFont,
          scrollSpeed,
          scrollEase,
          autoRotate,
          autoRotateSpeed,
          onActiveChange,
        });
        appRef.current = app;
      });

      return () => {
        isMounted = false;
        if (app) {
          app.destroy();
          appRef.current = null;
        }
      };
    }, [
      items,
      bend,
      textColor,
      borderRadius,
      font,
      fontUrl,
      scrollSpeed,
      scrollEase,
      autoRotate,
      autoRotateSpeed,
      onActiveChange,
    ]);

    return (
      <div
        className={`relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y ${className}`}
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label="Circular image gallery. Use Left and Right Arrow keys or drag to navigate."
      />
    );
  }
);

export default CircularGallery;
