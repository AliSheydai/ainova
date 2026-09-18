export type FeatureCategory = 'all' | 'coding' | 'education' | 'research' | 'design' | 'media'

export interface FeatureCategoryInfo {
  id: FeatureCategory
  label: string
  shortLabel: string
  description: string
  badgeText: string
}

export const featureCategories: FeatureCategoryInfo[] = [
  {
    id: 'all',
    label: 'همه امکانات',
    shortLabel: 'همه',
    description: 'نگاهی جامع به برجسته‌ترین قابلیت‌های اشتراک‌های نسل جدید هوش مصنوعی',
    badgeText: 'پوشش کامل',
  },
  {
    id: 'coding',
    label: 'کدنویسی و توسعه',
    shortLabel: 'برنامه‌نویسی',
    description: 'ابزارهای تخصصی برای برنامه‌نویسان، تحلیل معماری کد، اجرای زنده و عیب‌یابی',
    badgeText: 'ویژه توسعه‌دهندگان',
  },
  {
    id: 'education',
    label: 'تحصیل و یادگیری',
    shortLabel: 'دانشگاه و تحصیل',
    description: 'خلاصه‌سازی کتب و مقالات دانشگاهی، حل تمرین، پادکست‌های علمی و یادگیری سریع',
    badgeText: 'ویژه دانشجویان و اساتید',
  },
  {
    id: 'research',
    label: 'پژوهش و تحقیق عمیق',
    shortLabel: 'تحقیق و سرچ',
    description: 'عامل‌های کاوشگر خودکار وب، فکت‌چک علمی و پردازش اسناد هزار صفحه‌ای',
    badgeText: 'ویژه پژوهشگران',
  },
  {
    id: 'design',
    label: 'طراحی و هنر دیجیتال',
    shortLabel: 'طراحی و گرافیک',
    description: 'تولید تصاویر فوق‌واقع‌گرایانه، طراحی پوستر، کانسپت آرت و ادیت هوشمند بصری',
    badgeText: 'ویژه طراحان و هنرمندان',
  },
  {
    id: 'media',
    label: 'ویدیو، فیلم و رسانه',
    shortLabel: 'ویدیو و فیلم',
    description: 'ساخت ویدیوهای سینمایی 4K با هوش مصنوعی، چت با فیلم‌ها و دوبله چندزبانه',
    badgeText: 'ویژه فیلم‌سازان و مدیا',
  },
]

export interface FeatureItem {
  id: number
  categories: FeatureCategory[]
  tag: string
  title: string
  subtitle: string
  description: string
  highlights: [string, string, string]
  iconType: string
}

export const featureItemsData: FeatureItem[] = [
  {
    id: 1,
    categories: ['all', 'coding', 'research'],
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
    iconType: 'chip',
  },
  {
    id: 2,
    categories: ['all', 'research'],
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
    iconType: 'compass',
  },
  {
    id: 3,
    categories: ['all', 'media', 'design'],
    tag: 'Video Studio',
    title: 'استودیوی ویدیوسازی و متحرک‌سازی',
    subtitle: 'Veo 3.1 • Sora • Runway Gen-3',
    description:
      'خلق ویدیوهای باکیفیت و صحنه‌پردازی سینمایی با مدل‌های پیشرو؛ تبدیل آنی ایده‌های متنی و تصاویر ثابت به ویدیوهای متحرک 4K با افکت‌های واقع‌گرایانه.',
    highlights: [
      'تبدیل آنی ایده و عکس به ویدیوهای سینمایی',
      'کیفیت سینمایی 4K با فیزیک و نورپردازی دقیق',
      'حفظ کامل پیوستگی کاراکتر و زوایای دوربین',
    ],
    iconType: 'camera',
  },
  {
    id: 4,
    categories: ['all', 'design'],
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
    iconType: 'palette',
  },
  {
    id: 5,
    categories: ['all', 'coding'],
    tag: 'Canvas & Custom Bots',
    title: 'محیط تعاملی کار و ساخت دستیار اختصاصی',
    subtitle: 'Interactive Canvas • Custom GPTs',
    description:
      'فضای کار هوشمند Canvas برای برنامه‌نویسی زنده و نگارش متون تعاملی، همراه با قابلیت شخصی‌سازی دستیارهای اختصاصی متناسب با داکیومنت‌های کاری شما.',
    highlights: [
      'بوم تعاملی برای کدنویسی زنده و نگارش متن',
      'ساخت دستیاران هوشمند سفارشی با دانش شما',
      'اتصال آسان به پروژه‌ها، مخازن و مستندات',
    ],
    iconType: 'terminal',
  },
  {
    id: 6,
    categories: ['all', 'education', 'research'],
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
    iconType: 'academic',
  },
  {
    id: 7,
    categories: ['all', 'media', 'education'],
    tag: 'Video Analytics',
    title: 'چت و خلاصه‌سازی هوشمند ویدیوها',
    subtitle: 'Video Intelligence • Timestamp Index',
    description:
      'گفتگو و طرح سوال پیرامون محتوای ویدیوهای آموزشی و یوتیوب؛ استخراج سرفصل‌ها، نکات کلیدی و کدهای آموزشی بدون اتلاف وقت در تماشای ساعت‌ها فیلم.',
    highlights: [
      'خلاصه‌سازی ویدیوهای طولانی آموزشی و یوتیوب',
      'استخراج دقیق سرفصل‌ها، کدها و نکات کلیدی',
      'پرسش و پاسخ تعاملی از محتوای ثانیه‌به‌ثانیه',
    ],
    iconType: 'youtube',
  },
  {
    id: 8,
    categories: ['all', 'education', 'research'],
    tag: 'Workspace & Web',
    title: 'یکپارچگی با ابزارهای اداری و مرورگر',
    subtitle: 'Google Workspace • Browser Extensions',
    description:
      'نگارش و خلاصه‌سازی ایمیل‌ها، تدوین اسناد متنی، ساخت ارائه‌ها و اسلایدها با دستیار هوشمند درون محیط کاربری، Docs ،Gmail و مرورگر وب.',
    highlights: [
      'نگارش سریع و بازنویسی حرفه‌ای ایمیل‌ها',
      'تدوین اسناد متنی و ساخت ارائه‌ها و اسلایدها',
      'دستیار هوشمند ادغام‌شده در محیط مرورگر وب',
    ],
    iconType: 'workspace',
  },
  {
    id: 9,
    categories: ['all', 'media', 'coding'],
    tag: 'Cloud Storage',
    title: 'فضای ذخیره‌سازی ابری پرظرفیت و امن',
    subtitle: '2TB to 5TB Cloud • Google One',
    description:
      'بهره‌مندی از حجم بالای فضای ابری مطمئن برای پشتیبان‌گیری تمام عکس‌ها، ویدیوها، پروژه‌های کدنویسی و اسناد اداری بدون دغدغه محدودیت حافظه.',
    highlights: [
      'فضای ابری پرظرفیت چند ترابایتی پرسرعت',
      'پشتیبان‌گیری رمزنگاری‌شده و کاملاً مطمئن',
      'دسترسی همگام و آنی در تمام دستگاه‌ها',
    ],
    iconType: 'cloud',
  },
  {
    id: 10,
    categories: ['coding'],
    tag: 'Code Architecture',
    title: 'تحلیل معماری نرم‌افزار و رفع باگ',
    subtitle: 'Full-Stack Debugging • Code Refactor',
    description:
      'بررسی عمیق پول‌ریکوئست‌ها، ساختار پایگاه داده و پیدا کردن گلوگاه‌های کارایی و امنیتی در پروژه‌های پیچیده و بزرگ با ارائه کدهای بهینه.',
    highlights: [
      'کشف خودکار خطاهای منطقی و امنیتی نرم‌افزار',
      'پیشنهاد ریفکتور تمیز و بهینه‌سازی دیتابیس',
      'تولید خودکار یونیت‌تست‌ها و داکیومنت فنی',
    ],
    iconType: 'bug-check',
  },
  {
    id: 11,
    categories: ['education'],
    tag: 'Step-by-Step Tutor',
    title: 'مدرس خصوصی و حل‌کننده گام‌به‌گام',
    subtitle: 'Interactive STEM Tutor • Exam Prep',
    description:
      'آموزش تعاملی مباحث سنگین ریاضی، فیزیک، مهندسی و علوم کامپیوتر با حل گام‌به‌گام و شیوه تدریس سقراطی متناسب با سطح درک هر دانشجو.',
    highlights: [
      'حل تشریحی مسائل ریاضی و مهندسی با فرمول',
      'شبیه‌سازی سناریوهای امتحانی و آزمون‌یار هوشمند',
      'توضیح مفهومی مباحث با مثال‌های بصری و ساده',
    ],
    iconType: 'tutor',
  },
  {
    id: 12,
    categories: ['research', 'education'],
    tag: 'Massive Context',
    title: 'تحلیل اسناد حجیم با ۲ میلیون توکن',
    subtitle: 'Long Context Engine • Cross-Document',
    description:
      'آپلود صدها صفحه کتاب، قراردادهای پیچیده و مقالات ژورنال بدون افت کیفیت فهم؛ پاسخ‌دهی دقیق به سوالات موشکافانه با ذکر شماره صفحه و پاراگراف.',
    highlights: [
      'تحلیل همزمان چندین جلد کتاب و پایان‌نامه',
      'جستجوی مفهومی فوق‌سریع در هزاران صفحه سند',
      'استخراج دقیق جدول‌ها، نمودارها و ارقام کلیدی',
    ],
    iconType: 'doc-search',
  },
  {
    id: 13,
    categories: ['design'],
    tag: 'Brand & Marketing',
    title: 'طراحی هویت بصری و گرافیک تبلیغاتی',
    subtitle: 'Visual Identity • Marketing Assets',
    description:
      'خلق لوگو، بنرهای شبکه‌های اجتماعی، پالت‌های رنگی برند و موکاپ‌های محصول با بالاترین رزولوشن چاپی و دیجیتال متناسب با استراتژی بازاریابی.',
    highlights: [
      'طراحی بنرهای چشم‌نواز اینستاگرام و وب‌سایت',
      'تولید هویت بصری یکپارچه و استایل‌گاید برند',
      'خروجی باکیفیت وکتوری و بدون افت رزولوشن',
    ],
    iconType: 'brand-art',
  },
  {
    id: 14,
    categories: ['media'],
    tag: 'AI Dubbing & Voice',
    title: 'دوبله هوشمند، زیرنویس و ترجمه فیلم',
    subtitle: 'Multilingual Audio • Voice Match',
    description:
      'ترجمه و دوبله صوتی ویدیوهای یوتیوب و دوره‌های آموزشی با بازسازی تن صدا، احساس و زیرنویس هماهنگ ثانیه‌به‌ثانیه به ده‌ها زبان زنده دنیا.',
    highlights: [
      'دوبله طبیعی با حفظ لحن و هیجان گوینده اصلی',
      'تولید فایل زیرنویس SRT بی‌نقص و تایم‌کد دقیق',
      'پشتیبانی جامع از فیلم‌ها، مصاحبه‌ها و پادکست‌ها',
    ],
    iconType: 'soundwave',
  },
  {
    id: 15,
    categories: ['coding', 'research'],
    tag: 'Custom Knowledge Bots',
    title: 'ساخت ایجنت‌های متصل به پایگاه دانش',
    subtitle: 'RAG Systems • API Agents',
    description:
      'توسعه بات‌های هوشمند اختصاصی که به APIها، مستندات شرکتی و دیتابیس‌های شما متصل شده و امور پرتکرار را به صورت خودکار و دقیق مدیریت می‌کنند.',
    highlights: [
      'اتصال مستقیم به داده‌ها و مستندات محلی شما',
      'فراخوانی توابع و وب‌هوک‌ها به صورت خودکار',
      'حفظ کامل محرمانگی داده‌ها و حریم خصوصی',
    ],
    iconType: 'bot-agent',
  },
  {
    id: 16,
    categories: ['media'],
    tag: 'Media Archive & Streaming',
    title: 'آرشیو و استریم اختصاصی فیلم و محتوا',
    subtitle: 'High-Bitrate Media • Fast Sync',
    description:
      'نگهداری و پخش روان ساعت‌ها فیلم باکیفیت بالا، مستندها و دوره‌های ویدیویی روی فضای ابری اختصاصی بدون افت کیفیت در موبایل، تبلت و لپ‌تاپ.',
    highlights: [
      'استریم پرسرعت بدون قطعی و بافرینگ آزاردهنده',
      'دسترسی همگام به کلکسیون فیلم‌ها در تمام پلتفرم‌ها',
      'فضای ابری حجیم اختصاصی بدون ریسک مسدودی',
    ],
    iconType: 'media-vault',
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
function drawFeatureIcon(
  ctx: CanvasRenderingContext2D,
  iconType: string,
  cx: number,
  cy: number,
  isDark: boolean = true
) {
  ctx.save()
  const iconColor = isDark ? '#60a5fa' : '#2563eb'
  ctx.strokeStyle = iconColor
  ctx.fillStyle = iconColor
  ctx.lineWidth = 2.4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (iconType) {
    case 'chip': {
      // AI Brain / Microchip
      ctx.beginPath()
      ctx.strokeRect(cx - 14, cy - 14, 28, 28)
      ctx.fillRect(cx - 6, cy - 6, 12, 12)
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
    case 'compass': {
      // Deep Search / Agent Compass
      ctx.beginPath()
      ctx.arc(cx, cy, 16, 0, Math.PI * 2)
      ctx.stroke()
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
    case 'camera': {
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
      ctx.beginPath()
      ctx.arc(cx - 5, cy, 4, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'palette': {
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
    case 'terminal': {
      // Canvas / Interactive Studio & Bot
      ctx.beginPath()
      ctx.strokeRect(cx - 15, cy - 12, 30, 24)
      ctx.beginPath()
      ctx.moveTo(cx - 15, cy - 4)
      ctx.lineTo(cx + 15, cy - 4)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx - 9, cy - 8, 2, 0, Math.PI * 2)
      ctx.arc(cx - 3, cy - 8, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(cx - 9, cy + 2)
      ctx.lineTo(cx - 4, cy + 6)
      ctx.lineTo(cx - 9, cy + 10)
      ctx.stroke()
      break
    }
    case 'academic': {
      // Academic Hat & Book
      ctx.beginPath()
      ctx.moveTo(cx, cy - 12)
      ctx.lineTo(cx + 15, cy - 5)
      ctx.lineTo(cx, cy + 2)
      ctx.lineTo(cx - 15, cy - 5)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - 10, cy - 3)
      ctx.lineTo(cx - 10, cy + 8)
      ctx.quadraticCurveTo(cx, cy + 14, cx + 10, cy + 8)
      ctx.lineTo(cx + 10, cy - 3)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 15, cy - 5)
      ctx.lineTo(cx + 15, cy + 7)
      ctx.stroke()
      break
    }
    case 'youtube': {
      // Video Analytics & Play
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
    case 'workspace': {
      // Workspace & Cloud Apps
      ctx.beginPath()
      ctx.strokeRect(cx - 14, cy - 14, 12, 12)
      ctx.strokeRect(cx + 2, cy - 14, 12, 12)
      ctx.strokeRect(cx - 14, cy + 2, 12, 12)
      ctx.strokeRect(cx + 2, cy + 2, 12, 12)
      break
    }
    case 'cloud': {
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
    case 'bug-check': {
      // Code Inspection / Bug / Shield
      ctx.beginPath()
      ctx.arc(cx, cy - 1, 10, 0, Math.PI * 2)
      ctx.stroke()
      // Bug antennae & legs
      ctx.beginPath()
      ctx.moveTo(cx - 10, cy - 4)
      ctx.lineTo(cx - 16, cy - 8)
      ctx.moveTo(cx + 10, cy - 4)
      ctx.lineTo(cx + 16, cy - 8)
      ctx.moveTo(cx - 10, cy + 2)
      ctx.lineTo(cx - 16, cy + 4)
      ctx.moveTo(cx + 10, cy + 2)
      ctx.lineTo(cx + 16, cy + 4)
      ctx.stroke()
      // Inner checkmark
      ctx.beginPath()
      ctx.moveTo(cx - 4, cy)
      ctx.lineTo(cx - 1, cy + 3)
      ctx.lineTo(cx + 4, cy - 3)
      ctx.stroke()
      break
    }
    case 'tutor': {
      // Smart Step-by-Step Solver (Atom / Math Formula)
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(cx, cy, 15, 6, Math.PI / 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(cx, cy, 15, 6, -Math.PI / 4, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'doc-search': {
      // Massive Document Context
      ctx.beginPath()
      ctx.strokeRect(cx - 12, cy - 14, 18, 24)
      ctx.beginPath()
      ctx.moveTo(cx - 8, cy - 7)
      ctx.lineTo(cx + 2, cy - 7)
      ctx.moveTo(cx - 8, cy - 1)
      ctx.lineTo(cx + 2, cy - 1)
      ctx.moveTo(cx - 8, cy + 5)
      ctx.lineTo(cx, cy + 5)
      ctx.stroke()
      // Magnifying glass on corner
      ctx.beginPath()
      ctx.arc(cx + 7, cy + 6, 6, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx + 11, cy + 10)
      ctx.lineTo(cx + 16, cy + 15)
      ctx.stroke()
      break
    }
    case 'brand-art': {
      // Visual Brand & Vector Pen Tool
      ctx.beginPath()
      ctx.moveTo(cx, cy - 14)
      ctx.lineTo(cx + 11, cy)
      ctx.lineTo(cx, cy + 14)
      ctx.lineTo(cx - 11, cy)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'soundwave': {
      // Voice / Sound Waves / AI Dubbing
      const heights = [6, 12, 18, 14, 8]
      const xs = [-12, -6, 0, 6, 12]
      xs.forEach((x, i) => {
        const h = heights[i]
        ctx.beginPath()
        ctx.moveTo(cx + x, cy - h)
        ctx.lineTo(cx + x, cy + h)
        ctx.stroke()
      })
      break
    }
    case 'bot-agent': {
      // Autonomous Bot / Custom Agent
      ctx.beginPath()
      ctx.strokeRect(cx - 12, cy - 8, 24, 18)
      // Antennas
      ctx.beginPath()
      ctx.moveTo(cx, cy - 8)
      ctx.lineTo(cx, cy - 14)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy - 15, 2.5, 0, Math.PI * 2)
      ctx.fill()
      // Eyes
      ctx.beginPath()
      ctx.arc(cx - 5, cy - 1, 2.5, 0, Math.PI * 2)
      ctx.arc(cx + 5, cy - 1, 2.5, 0, Math.PI * 2)
      ctx.fill()
      // Smile
      ctx.beginPath()
      ctx.arc(cx, cy + 4, 4, 0, Math.PI)
      ctx.stroke()
      break
    }
    case 'media-vault': {
      // Film Reel / Media Vault
      ctx.beginPath()
      ctx.arc(cx, cy, 14, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.stroke()
      const holeAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]
      holeAngles.forEach((ang) => {
        const hx = cx + Math.cos(ang) * 8.5
        const hy = cy + Math.sin(ang) * 8.5
        ctx.beginPath()
        ctx.arc(hx, hy, 2, 0, Math.PI * 2)
        ctx.fill()
      })
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

const featureCardDataUrlCache = new Map<string, string>()

export function preloadFeatureCardsCache(theme: 'dark' | 'light' = 'dark') {
  if (typeof document === 'undefined') return
  featureItemsData.forEach((item) => {
    createFeatureCardDataUrl(item, theme)
  })
}

export function createFeatureCardDataUrl(
  item: FeatureItem,
  theme: 'dark' | 'light' = 'dark'
): string {
  if (typeof document === 'undefined') {
    return ''
  }

  const cacheKey = `${item.id}-${theme}`
  const cached = featureCardDataUrlCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const isDark = theme === 'dark'

  // High-resolution canvas for crystal-sharp 3D card display (aspect 3:4)
  const width = 840
  const height = 1120
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // 1. Base card background
  if (isDark) {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height)
    bgGrad.addColorStop(0, '#0f172a') // deep slate 900
    bgGrad.addColorStop(0.35, '#090d16') // obsidian
    bgGrad.addColorStop(1, '#05070d')

    roundRect(ctx, 16, 16, width - 32, height - 32, 44)
    ctx.fillStyle = bgGrad
    ctx.fill()
  } else {
    // Ultra-clean modern light gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height)
    bgGrad.addColorStop(0, '#ffffff')
    bgGrad.addColorStop(0.45, '#f8fafc') // subtle cool slate 50
    bgGrad.addColorStop(1, '#f1f5f9') // slate 100

    roundRect(ctx, 16, 16, width - 32, height - 32, 44)
    ctx.fillStyle = bgGrad
    ctx.fill()
  }

  // 2. Ambient glow layers
  const glowTop = ctx.createRadialGradient(width - 120, 120, 10, width - 120, 120, 420)
  glowTop.addColorStop(0, isDark ? 'rgba(59, 130, 246, 0.22)' : 'rgba(59, 130, 246, 0.10)')
  glowTop.addColorStop(0.6, isDark ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.02)')
  glowTop.addColorStop(1, 'rgba(59, 130, 246, 0)')
  ctx.fillStyle = glowTop
  ctx.fill()

  const glowBottom = ctx.createRadialGradient(100, height - 140, 10, 100, height - 140, 360)
  glowBottom.addColorStop(0, isDark ? 'rgba(14, 165, 233, 0.12)' : 'rgba(14, 165, 233, 0.08)')
  glowBottom.addColorStop(1, 'rgba(14, 165, 233, 0)')
  ctx.fillStyle = glowBottom
  ctx.fill()

  // 3. Card Border (Subtle 2-layer glass border with specular highlights)
  const borderGrad = ctx.createLinearGradient(0, 0, width, height)
  if (isDark) {
    borderGrad.addColorStop(0, 'rgba(96, 165, 250, 0.65)') // vivid blue at top
    borderGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)')
    borderGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.25)')
    borderGrad.addColorStop(1, 'rgba(14, 165, 233, 0.45)')
  } else {
    borderGrad.addColorStop(0, 'rgba(59, 130, 246, 0.55)') // blue corner at top
    borderGrad.addColorStop(0.35, 'rgba(203, 213, 225, 0.85)') // soft slate-300
    borderGrad.addColorStop(0.7, 'rgba(226, 232, 240, 0.90)') // slate-200
    borderGrad.addColorStop(1, 'rgba(14, 165, 233, 0.45)') // sky corner at bottom
  }

  roundRect(ctx, 16, 16, width - 32, height - 32, 44)
  ctx.strokeStyle = borderGrad
  ctx.lineWidth = isDark ? 3 : 2.5
  ctx.stroke()

  // 4. Feature Identity Row (Icon Box + Subtitle Pill)
  const iconRowY = 64
  const iconBoxSize = 58
  const iconBoxX = width - 52 - iconBoxSize

  // Glass Icon Box
  roundRect(ctx, iconBoxX, iconRowY, iconBoxSize, iconBoxSize, 18)
  ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(59, 130, 246, 0.10)'
  ctx.fill()
  ctx.strokeStyle = isDark ? 'rgba(96, 165, 250, 0.55)' : 'rgba(37, 99, 235, 0.35)'
  ctx.lineWidth = 1.8
  ctx.stroke()

  // Draw custom vector icon
  drawFeatureIcon(ctx, item.iconType, iconBoxX + iconBoxSize / 2, iconRowY + iconBoxSize / 2, isDark)

  // Subtitle / Models Pill (placed next to icon box)
  const subH = iconBoxSize
  const subW = width - 104 - iconBoxSize - 16
  const subX = 52

  roundRect(ctx, subX, iconRowY, subW, subH, 18)
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(241, 245, 249, 0.90)'
  ctx.fill()
  ctx.strokeStyle = isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.22)'
  ctx.lineWidth = 1.4
  ctx.stroke()

  // Glowing indicator dot & Subtitle text (items-center aligned)
  const subCenterY = iconRowY + subH / 2

  ctx.beginPath()
  ctx.arc(subX + 24, subCenterY, 6, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7'
  ctx.fill()

  // Subtle outer aura for the blue dot
  ctx.beginPath()
  ctx.arc(subX + 24, subCenterY, 10, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(2, 132, 199, 0.20)'
  ctx.fill()

  ctx.direction = 'ltr'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = '700 22px Vazirmatn, system-ui, sans-serif'
  ctx.fillStyle = isDark ? '#93c5fd' : '#1d4ed8'
  ctx.fillText(item.subtitle, subX + 44, subCenterY)

  // 5. Title (Persian RTL, Bold, Large and High Contrast)
  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
  ctx.font = '900 44px Vazirmatn, system-ui, sans-serif'
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a'

  const titleLines = wrapText(ctx, item.title, width - 104)
  let currentY = 178
  for (const line of titleLines) {
    ctx.fillText(line, width - 52, currentY)
    currentY += 56
  }

  // 6. Radiant Accent Divider Line
  currentY += 10
  const lineGrad = ctx.createLinearGradient(52, currentY, width - 52, currentY)
  if (isDark) {
    lineGrad.addColorStop(0, 'rgba(59, 130, 246, 0)')
    lineGrad.addColorStop(0.3, 'rgba(96, 165, 250, 0.75)')
    lineGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.75)')
    lineGrad.addColorStop(1, 'rgba(59, 130, 246, 0)')
  } else {
    lineGrad.addColorStop(0, 'rgba(59, 130, 246, 0)')
    lineGrad.addColorStop(0.3, 'rgba(37, 99, 235, 0.65)')
    lineGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.65)')
    lineGrad.addColorStop(1, 'rgba(59, 130, 246, 0)')
  }

  ctx.beginPath()
  ctx.moveTo(52, currentY)
  ctx.lineTo(width - 52, currentY)
  ctx.strokeStyle = lineGrad
  ctx.lineWidth = 2.4
  ctx.stroke()

  // Center accent dot on divider
  ctx.beginPath()
  ctx.arc(width / 2, currentY, 4.5, 0, Math.PI * 2)
  ctx.fillStyle = isDark ? '#60a5fa' : '#2563eb'
  ctx.fill()

  // 7. Description Paragraph (Persian RTL, Font 29px, High Contrast)
  currentY += 46
  ctx.font = '500 29px Vazirmatn, system-ui, sans-serif'
  ctx.fillStyle = isDark ? '#f1f5f9' : '#334155'
  const descLines = wrapText(ctx, item.description, width - 104)
  for (const line of descLines) {
    ctx.fillText(line, width - 52, currentY)
    currentY += 46
  }

  // 8. 3 Key Highlights Cards
  const boxHeight = 84
  const startBoxY = Math.max(currentY + 32, 484)

  item.highlights.forEach((highlight, idx) => {
    const boxY = startBoxY + idx * (boxHeight + 16)
    roundRect(ctx, 52, boxY, width - 104, boxHeight, 22)
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff'
    ctx.fill()
    ctx.strokeStyle = isDark ? 'rgba(59, 130, 246, 0.28)' : 'rgba(203, 213, 225, 0.85)'
    ctx.lineWidth = 1.4
    ctx.stroke()

    // Left edge subtle highlight line
    ctx.beginPath()
    ctx.moveTo(width - 52, boxY + 18)
    ctx.lineTo(width - 52, boxY + boxHeight - 18)
    ctx.strokeStyle = isDark ? '#3b82f6' : '#2563eb'
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.stroke()

    // Checkmark circle badge
    const checkCircleX = width - 52 - 40
    const checkCircleY = boxY + boxHeight / 2
    ctx.beginPath()
    ctx.arc(checkCircleX, checkCircleY, 18, 0, Math.PI * 2)
    ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(37, 99, 235, 0.12)'
    ctx.fill()
    ctx.strokeStyle = isDark ? '#60a5fa' : 'rgba(37, 99, 235, 0.35)'
    ctx.lineWidth = 1.8
    ctx.stroke()

    // Checkmark tick
    ctx.beginPath()
    ctx.moveTo(checkCircleX + 6, checkCircleY - 1)
    ctx.lineTo(checkCircleX + 1, checkCircleY + 5)
    ctx.lineTo(checkCircleX - 6, checkCircleY - 3)
    ctx.strokeStyle = isDark ? '#ffffff' : '#2563eb'
    ctx.lineWidth = 3.0
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Highlight text
    ctx.direction = 'rtl'
    ctx.textAlign = 'right'
    ctx.font = '700 26px Vazirmatn, system-ui, sans-serif'
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a'
    ctx.fillText(highlight, checkCircleX - 32, checkCircleY + 2)
  })

  // 9. Bottom Footer Status Bar (Guarantee Badge)
  const footerY = height - 90
  const footerH = 50
  roundRect(ctx, 52, footerY, width - 104, footerH, 25)
  ctx.fillStyle = isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 246, 255, 0.95)'
  ctx.fill()
  ctx.strokeStyle = isDark ? 'rgba(96, 165, 250, 0.35)' : 'rgba(59, 130, 246, 0.28)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.direction = 'rtl'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 24px Vazirmatn, system-ui, sans-serif'
  ctx.fillStyle = isDark ? '#93c5fd' : '#1d4ed8'
  ctx.fillText('تحویل آنی و فعال‌سازی قانونی روی حساب شخصی شما', width / 2, footerY + footerH / 2 + 1)

  const dataUrl = canvas.toDataURL('image/png')
  featureCardDataUrlCache.set(cacheKey, dataUrl)
  return dataUrl
}

export function getFeaturesByCategory(category: FeatureCategory): FeatureItem[] {
  if (category === 'all') {
    return featureItemsData
  }
  return featureItemsData.filter((item) => item.categories.includes(category))
}

export function getFeatureGalleryItems(
  theme: 'dark' | 'light' = 'dark',
  category: FeatureCategory = 'all'
) {
  const items = getFeaturesByCategory(category)
  return items.map((item) => ({
    image: createFeatureCardDataUrl(item, theme),
    text: '', // Empty text so no duplicate WebGL mesh below card
    tag: item.tag,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    highlights: item.highlights,
  }))
}


