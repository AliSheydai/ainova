export interface FeatureItem {
  id: number
  tag: string
  title: string
  subtitle: string
  description: string
  highlights: [string, string, string]
}

export const featureItemsData: FeatureItem[] = [
  {
    id: 1,
    tag: 'Next-Gen Models',
    title: 'مدل‌های فوق‌پیشرفته هوش مصنوعی',
    subtitle: 'GPT-5 • Claude 3.7 • Gemini 2.5',
    description:
      'دسترسی به بالاترین قدرت استدلال، تفکر عمیق و کدنویسی؛ امکان تحلیل اسناد حجیم، پروژه‌های فنی و فهم دقیق فایل‌های ویدیویی، متنی و صوتی سنگین.',
    highlights: [
      'استدلال چندمرحله‌ای و حل مسائل پیچیده',
      'تحلیل پروژه‌های سنگین کدنویسی و دیباگ',
      'پنجره متنی ۲ میلیون توکن با فهم دقیق',
    ],
  },
  {
    id: 2,
    tag: 'Deep Research',
    title: 'پژوهش خودکار و قابلیت‌های Agentic',
    subtitle: 'Autonomous Web Agents • Synthesis',
    description:
      'واکاوی مستقل صدها منبع وب با ابزارهای خودکار پژوهشی؛ بررسی عمیق رفرنس‌ها و تهیه گزارش‌های مستند، علمی و کاربردی در کوتاه‌ترین زمان.',
    highlights: [
      'کاوش همزمان صدها منبع وب معتبر',
      'استخراج رفرنس و ارزیابی فکت‌چک علمی',
      'تدوین گزارش تحلیلی مستند و ساختاریافته',
    ],
  },
  {
    id: 3,
    tag: 'Video Studio',
    title: 'استودیوی ویدیوسازی و متحرک‌سازی',
    subtitle: 'Veo 3.1 • Sora • Runway Gen-3',
    description:
      'خلق ویدیوهای باکیفیت و صحنه‌پردازی سینمایی با مدل‌های پیشرو (مانند Veo 3.1 و Flow)؛ تبدیل آنی ایده‌های متنی و تصاویر ثابت به ویدیوهای متحرک.',
    highlights: [
      'تبدیل آنی ایده و عکس به ویدیوهای سینمایی',
      'کیفیت سینمایی 4K با فیزیک و نورپردازی دقیق',
      'حفظ کامل پیوستگی کاراکتر و زوایای دوربین',
    ],
  },
  {
    id: 4,
    tag: 'Image Generation',
    title: 'طراحی گرافیک و تولید تصویر هنری',
    subtitle: 'Midjourney v7 • Imagen 3 • DALL-E',
    description:
      'رندر پیشرفته تصاویر فوق‌واقع‌گرایانه، طراحی پوستر و کانسپت با مدرن‌ترین موتورهای هوش تصویری در بالاترین رزولوشن و دقیق‌ترین جزئیات بصری.',
    highlights: [
      'رندر فوتورئالیستیک با بالاترین جزئیات بصری',
      'طراحی پوستر تبلیغاتی و کانسپت آرت حرفه‌ای',
      'ابزارهای ویرایش و روتوش هوشمند Inpainting',
    ],
  },
  {
    id: 5,
    tag: 'Canvas & Custom Bots',
    title: 'محیط تعاملی کار و ساخت دستیار اختصاصی',
    subtitle: 'Interactive Canvas • Custom GPTs',
    description:
      'فضای کار هوشمند Canvas برای برنامه‌نویسی زنده و نگارش متون تعاملی، همراه با قابلیت شخصی‌سازی دستیارهای اختصاصی متناسب با اهداف کاری شما.',
    highlights: [
      'بوم تعاملی برای کدنویسی زنده و نگارش متن',
      'ساخت دستیاران هوشمند سفارشی با دانش شما',
      'اتصال آسان به پروژه‌ها، مخازن و مستندات',
    ],
  },
  {
    id: 6,
    tag: 'Smart Research',
    title: 'دستیار مطالعاتی و دانشگاهی هوشمند',
    subtitle: 'NotebookLM • Deep Search',
    description:
      'سازمان‌دهی هوشمند مقالات، کتاب‌ها و اسناد دانشگاهی؛ اتصال به منابع دلخواه و تولید خلاصه‌های تحلیلی و پادکست‌های صوتی گفتگو‌محور از روی جزوات.',
    highlights: [
      'سازمان‌دهی هوشمند مقالات و کتب دانشگاهی',
      'تولید خودکار پادکست‌های صوتی گفتگو‌محور',
      'پاسخ‌های تحلیلی و مستند بر پایه منابع شما',
    ],
  },
  {
    id: 7,
    tag: 'Video Analytics',
    title: 'چت و خلاصه‌سازی هوشمند ویدیوها',
    subtitle: 'Video Intelligence • Timestamp Index',
    description:
      'گفتگو و طرح سوال پیرامون محتوای ویدیوهای آموزشی و یوتیوب؛ استخراج سرفصل‌ها، نکات کلیدی و کدهای آموزشی بدون اتلاف وقت.',
    highlights: [
      'خلاصه‌سازی ویدیوهای طولانی آموزشی و یوتیوب',
      'استخراج دقیق سرفصل‌ها، کدها و نکات کلیدی',
      'پرسش و پاسخ تعاملی از محتوای ثانیه‌به‌ثانیه',
    ],
  },
  {
    id: 8,
    tag: 'Workspace & Web',
    title: 'یکپارچگی با ابزارهای اداری و مرورگر',
    subtitle: 'Google Workspace • Browser Extensions',
    description:
      'نگارش و خلاصه‌سازی ایمیل‌ها، تدوین اسناد متنی، ساخت ارائه‌ها و اسلایدها با دستیار هوشمند درون محیط کاربری و مرورگر وب.',
    highlights: [
      'نگارش سریع و بازنویسی حرفه‌ای ایمیل‌ها',
      'تدوین اسناد متنی و ساخت ارائه‌ها و اسلایدها',
      'دستیار هوشمند ادغام‌شده در محیط مرورگر وب',
    ],
  },
  {
    id: 9,
    tag: 'Cloud Storage',
    title: 'فضای ذخیره‌سازی ابری پرظرفیت و امن',
    subtitle: '2TB to 5TB Cloud • Google One',
    description:
      'بهره‌مندی از حجم بالای فضای ابری مطمئن برای پشتیبان‌گیری تمام عکس‌ها، ویدیوها، پروژه‌ها و اسناد اداری بدون دغدغه محدودیت حافظه.',
    highlights: [
      'فضای ابری پرظرفیت چند ترابایتی پرسرعت',
      'پشتیبان‌گیری رمزنگاری‌شده و کاملاً مطمئن',
      'دسترسی همگام و آنی در تمام دستگاه‌ها',
    ],
  },
]

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = ctx.measureText(testLine).width
    if (width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) {
    lines.push(currentLine)
  }
  return lines
}

// Draw a themed vector icon for each feature to give the card identity
function drawFeatureIcon(ctx: CanvasRenderingContext2D, id: number, cx: number, cy: number) {
  ctx.save()
  ctx.strokeStyle = '#60a5fa'
  ctx.fillStyle = '#60a5fa'
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (id) {
    case 1: {
      // AI Brain / Microchip
      ctx.beginPath()
      ctx.strokeRect(cx - 14, cy - 14, 28, 28)
      // Core
      ctx.fillRect(cx - 6, cy - 6, 12, 12)
      // Pins
      const pins = [-10, 0, 10]
      pins.forEach((p) => {
        ctx.beginPath()
        ctx.moveTo(cx + p, cy - 14)
        ctx.lineTo(cx + p, cy - 19)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx + p, cy + 14)
        ctx.lineTo(cx + p, cy + 19)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx - 14, cy + p)
        ctx.lineTo(cx - 19, cy + p)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx + 14, cy + p)
        ctx.lineTo(cx + 19, cy + p)
        ctx.stroke()
      })
      break
    }
    case 2: {
      // Deep Search / Agent Compass
      ctx.beginPath()
      ctx.arc(cx, cy, 16, 0, Math.PI * 2)
      ctx.stroke()
      // Compass needle
      ctx.beginPath()
      ctx.moveTo(cx, cy - 11)
      ctx.lineTo(cx + 5, cy)
      ctx.lineTo(cx, cy + 11)
      ctx.lineTo(cx - 5, cy)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 3: {
      // Cinema / Video Camera
      ctx.beginPath()
      ctx.strokeRect(cx - 15, cy - 11, 20, 22)
      ctx.beginPath()
      ctx.moveTo(cx + 5, cy - 5)
      ctx.lineTo(cx + 15, cy - 11)
      ctx.lineTo(cx + 15, cy + 11)
      ctx.lineTo(cx + 5, cy + 5)
      ctx.closePath()
      ctx.stroke()
      // Reel circle
      ctx.beginPath()
      ctx.arc(cx - 5, cy, 4, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 4: {
      // Art Palette / Image Generation
      ctx.beginPath()
      ctx.arc(cx, cy, 16, 0, Math.PI * 2)
      ctx.stroke()
      const dots = [
        [-6, -6],
        [4, -7],
        [7, 1],
      ]
      dots.forEach(([dx, dy]) => {
        ctx.beginPath()
        ctx.arc(cx + dx, cy + dy, 2.5, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.beginPath()
      ctx.arc(cx - 4, cy + 7, 4, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 5: {
      // Canvas / Interactive Studio & Bot
      ctx.beginPath()
      ctx.strokeRect(cx - 15, cy - 12, 30, 24)
      ctx.beginPath()
      ctx.moveTo(cx - 15, cy - 4)
      ctx.lineTo(cx + 15, cy - 4)
      ctx.stroke()
      // Dot controls
      ctx.beginPath()
      ctx.arc(cx - 9, cy - 8, 2, 0, Math.PI * 2)
      ctx.arc(cx - 3, cy - 8, 2, 0, Math.PI * 2)
      ctx.fill()
      // Terminal prompt
      ctx.beginPath()
      ctx.moveTo(cx - 9, cy + 2)
      ctx.lineTo(cx - 4, cy + 6)
      ctx.lineTo(cx - 9, cy + 10)
      ctx.stroke()
      break
    }
    case 6: {
      // Academic / Smart Research Book
      ctx.beginPath()
      ctx.moveTo(cx, cy - 8)
      ctx.lineTo(cx + 15, cy - 12)
      ctx.lineTo(cx + 15, cy + 10)
      ctx.lineTo(cx, cy + 14)
      ctx.lineTo(cx - 15, cy + 10)
      ctx.lineTo(cx - 15, cy - 12)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy - 8)
      ctx.lineTo(cx, cy + 14)
      ctx.stroke()
      break
    }
    case 7: {
      // Video Analytics & Timestamp
      ctx.beginPath()
      ctx.strokeRect(cx - 16, cy - 11, 32, 22)
      ctx.beginPath()
      ctx.moveTo(cx - 4, cy - 6)
      ctx.lineTo(cx + 6, cy)
      ctx.lineTo(cx - 4, cy + 6)
      ctx.closePath()
      ctx.fill()
      break
    }
    case 8: {
      // Workspace & Cloud Apps
      ctx.beginPath()
      ctx.strokeRect(cx - 14, cy - 14, 12, 12)
      ctx.strokeRect(cx + 2, cy - 14, 12, 12)
      ctx.strokeRect(cx - 14, cy + 2, 12, 12)
      ctx.strokeRect(cx + 2, cy + 2, 12, 12)
      break
    }
    case 9: {
      // Cloud Storage
      ctx.beginPath()
      ctx.arc(cx - 6, cy - 1, 9, Math.PI * 0.8, Math.PI * 2)
      ctx.arc(cx + 5, cy - 4, 10, Math.PI * 1.1, Math.PI * 0.2)
      ctx.arc(cx + 9, cy + 4, 8, Math.PI * 1.5, Math.PI * 0.5)
      ctx.lineTo(cx - 12, cy + 12)
      ctx.arc(cx - 11, cy + 5, 7, Math.PI * 0.5, Math.PI * 1.4)
      ctx.closePath()
      ctx.stroke()
      break
    }
    default: {
      ctx.beginPath()
      ctx.arc(cx, cy, 14, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
  }
  ctx.restore()
}

export function createFeatureCardDataUrl(item: FeatureItem): string {
  if (typeof document === 'undefined') {
    return ''
  }

  // High-resolution canvas for crystal-sharp 3D card display (aspect 3:4)
  const width = 840
  const height = 1120
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // 1. Base card background (Sophisticated obsidian dark gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#0f172a') // deep slate 900
  bgGrad.addColorStop(0.35, '#090d16') // obsidian
  bgGrad.addColorStop(1, '#05070d')

  roundRect(ctx, 16, 16, width - 32, height - 32, 44)
  ctx.fillStyle = bgGrad
  ctx.fill()

  // 2. Ambient glow layers (Primary Blue & Cyan aura)
  const glowTop = ctx.createRadialGradient(width - 120, 120, 10, width - 120, 120, 420)
  glowTop.addColorStop(0, 'rgba(59, 130, 246, 0.22)')
  glowTop.addColorStop(0.6, 'rgba(59, 130, 246, 0.05)')
  glowTop.addColorStop(1, 'rgba(59, 130, 246, 0)')
  ctx.fillStyle = glowTop
  ctx.fill()

  const glowBottom = ctx.createRadialGradient(100, height - 140, 10, 100, height - 140, 360)
  glowBottom.addColorStop(0, 'rgba(14, 165, 233, 0.12)')
  glowBottom.addColorStop(1, 'rgba(14, 165, 233, 0)')
  ctx.fillStyle = glowBottom
  ctx.fill()

  // 3. Card Border (Subtle 2-layer glass border with bright corner specular highlights)
  const borderGrad = ctx.createLinearGradient(0, 0, width, height)
  borderGrad.addColorStop(0, 'rgba(96, 165, 250, 0.65)') // vivid blue at top
  borderGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)')
  borderGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.25)')
  borderGrad.addColorStop(1, 'rgba(14, 165, 233, 0.45)')

  roundRect(ctx, 16, 16, width - 32, height - 32, 44)
  ctx.strokeStyle = borderGrad
  ctx.lineWidth = 3
  ctx.stroke()

  // 4. Header Bar (Tag on Right, Index on Left)
  const tagY = 56
  const tagH = 44

  // 4.1 Tag Pill on Right (ltr text, right aligned)
  ctx.font = '700 20px Vazirmatn, sans-serif'
  const tagText = item.tag
  const tagW = ctx.measureText(tagText).width + 44
  const tagX = width - 52 - tagW

  roundRect(ctx, tagX, tagY, tagW, tagH, 22)
  ctx.fillStyle = 'rgba(59, 130, 246, 0.16)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.50)'
  ctx.lineWidth = 1.6
  ctx.stroke()

  ctx.fillStyle = '#60a5fa'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(tagText, tagX + tagW / 2, tagY + tagH / 2)

  // 4.2 Index Badge on Left
  const indexText = `۰${item.id} / ۰۹`
  const indexW = 96
  roundRect(ctx, 52, tagY, indexW, tagH, 22)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
  ctx.lineWidth = 1.4
  ctx.stroke()

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '700 19px Vazirmatn, sans-serif'
  ctx.fillText(indexText, 52 + indexW / 2, tagY + tagH / 2)

  // 5. Feature Identity Row (Icon Box + Subtitle Pill)
  const iconRowY = 118
  const iconBoxSize = 56
  const iconBoxX = width - 52 - iconBoxSize

  // Glass Icon Box
  roundRect(ctx, iconBoxX, iconRowY, iconBoxSize, iconBoxSize, 18)
  ctx.fillStyle = 'rgba(59, 130, 246, 0.18)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.55)'
  ctx.lineWidth = 1.8
  ctx.stroke()

  // Draw custom vector icon
  drawFeatureIcon(ctx, item.id, iconBoxX + iconBoxSize / 2, iconRowY + iconBoxSize / 2)

  // Subtitle / Models Pill (placed next to icon box)
  const subH = iconBoxSize
  const subW = width - 104 - iconBoxSize - 16
  const subX = 52

  roundRect(ctx, subX, iconRowY, subW, subH, 18)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)'
  ctx.lineWidth = 1.4
  ctx.stroke()

  // Glowing indicator dot
  ctx.beginPath()
  ctx.arc(subX + 24, iconRowY + subH / 2, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#38bdf8'
  ctx.fill()

  ctx.direction = 'ltr'
  ctx.textAlign = 'left'
  ctx.font = '700 22px Vazirmatn, system-ui, sans-serif'
  ctx.fillStyle = '#93c5fd'
  ctx.fillText(item.subtitle, subX + 40, iconRowY + subH / 2 + 1)

  // 6. Title (Persian RTL, Bold, Large and High Contrast)
  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
  ctx.font = '900 44px Vazirmatn, system-ui, sans-serif'
  ctx.fillStyle = '#ffffff'

  const titleLines = wrapText(ctx, item.title, width - 104)
  let currentY = 232
  for (const line of titleLines) {
    ctx.fillText(line, width - 52, currentY)
    currentY += 56
  }

  // 7. Radiant Accent Divider Line
  currentY += 10
  const lineGrad = ctx.createLinearGradient(52, currentY, width - 52, currentY)
  lineGrad.addColorStop(0, 'rgba(59, 130, 246, 0)')
  lineGrad.addColorStop(0.3, 'rgba(96, 165, 250, 0.75)')
  lineGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.75)')
  lineGrad.addColorStop(1, 'rgba(59, 130, 246, 0)')

  ctx.beginPath()
  ctx.moveTo(52, currentY)
  ctx.lineTo(width - 52, currentY)
  ctx.strokeStyle = lineGrad
  ctx.lineWidth = 2.4
  ctx.stroke()

  // Center accent dot on divider
  ctx.beginPath()
  ctx.arc(width / 2, currentY, 4.5, 0, Math.PI * 2)
  ctx.fillStyle = '#60a5fa'
  ctx.fill()

  // 8. Description Paragraph (Persian RTL, Font 29px, High Contrast)
  currentY += 46
  ctx.font = '500 29px Vazirmatn, system-ui, sans-serif'
  ctx.fillStyle = '#f1f5f9' // ultra-clear readable bright slate
  const descLines = wrapText(ctx, item.description, width - 104)
  for (const line of descLines) {
    ctx.fillText(line, width - 52, currentY)
    currentY += 46
  }

  // 9. 3 Key Highlights Cards
  const boxHeight = 84
  const startBoxY = Math.max(currentY + 28, 540)

  item.highlights.forEach((highlight, idx) => {
    const boxY = startBoxY + idx * (boxHeight + 16)
    roundRect(ctx, 52, boxY, width - 104, boxHeight, 22)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.28)'
    ctx.lineWidth = 1.4
    ctx.stroke()

    // Left edge subtle highlight line
    ctx.beginPath()
    ctx.moveTo(width - 52, boxY + 18)
    ctx.lineTo(width - 52, boxY + boxHeight - 18)
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.stroke()

    // Checkmark circle badge
    const checkCircleX = width - 52 - 40
    const checkCircleY = boxY + boxHeight / 2
    ctx.beginPath()
    ctx.arc(checkCircleX, checkCircleY, 18, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)'
    ctx.fill()
    ctx.strokeStyle = '#60a5fa'
    ctx.lineWidth = 1.8
    ctx.stroke()

    // Checkmark tick
    ctx.beginPath()
    ctx.moveTo(checkCircleX + 6, checkCircleY - 1)
    ctx.lineTo(checkCircleX + 1, checkCircleY + 5)
    ctx.lineTo(checkCircleX - 6, checkCircleY - 3)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3.0
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Highlight text
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.font = '700 26px Vazirmatn, system-ui, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(highlight, checkCircleX - 32, checkCircleY + 2)
  })

  // 10. Bottom Footer Status Bar (Guarantee Badge)
  const footerY = height - 90
  const footerH = 50
  roundRect(ctx, 52, footerY, width - 104, footerH, 25)
  ctx.fillStyle = 'rgba(59, 130, 246, 0.12)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Shield / check tick inside footer
  ctx.direction = 'rtl'
  ctx.textAlign = 'center'
  ctx.font = '700 20px Vazirmatn, system-ui, sans-serif'
  ctx.fillStyle = '#93c5fd'
  ctx.fillText('⚡ تحویل آنی و فعال‌سازی قانونی روی حساب شخصی شما', width / 2, footerY + footerH / 2 + 1)

  return canvas.toDataURL('image/png')
}

export function getFeatureGalleryItems() {
  return featureItemsData.map((item) => ({
    image: createFeatureCardDataUrl(item),
    text: '', // Empty text so no duplicate WebGL mesh below card
    tag: item.tag,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    highlights: item.highlights,
  }))
}

