import { PrismaClient, FulfillmentType, InventoryType } from '@prisma/client'

const prisma = new PrismaClient()

interface PlanInput {
  name: string
  duration: number
  price: number
  fulfillmentType: FulfillmentType
  sortOrder?: number
}

interface ProductInput {
  title: string
  slug: string
  shortDescription: string
  description: string
  price: number
  sortOrder: number
  features: string[]
  plans: PlanInput[]
}

const FAKE_PRODUCTS: ProductInput[] = [
  {
    title: 'Google AI Pro ۱۸ ماهه (جمینای پیشرفته)',
    slug: 'google-ai-pro',
    shortDescription: 'اشتراک اختصاصی ۱۸ ماهه هوش مصنوعی گوگل با ۲ ترابایت فضای ابری گوگل وان',
    description:
      'اشتراک قانونی ۱۸ ماهه Google AI Pro را روی اکانت شخصی گوگل خود فعال کنید. دسترسی نامحدود به Gemini 1.5 Pro، دو ترابایت فضای ابری گوگل درایو و گوگل فوتوز، و یکپارچگی کامل با جیمیل و داکس بدون نیاز به پسورد.',
    price: 390000,
    sortOrder: 1,
    features: [
      'فعال‌سازی ۱۰۰٪ قانونی روی ایمیل شخصی شما',
      'دسترسی کامل به مدل پیشرفته Gemini 1.5 Pro',
      '۲ ترابایت فضای ابری Google One با اشتراک فمیلی',
      'تحویل آنی از طریق لینک اختصاصی رسمی گوگل',
    ],
    plans: [
      {
        name: '۱۸ ماهه اختصاصی',
        duration: 18,
        price: 390000,
        fulfillmentType: 'ACTIVATION_LINK',
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'اشتراک چت‌جی‌پی‌تی پلاس (ChatGPT Plus)',
    slug: 'chatgpt-plus-official',
    shortDescription: 'دسترسی نامحدود به مدل‌های GPT-4o، o1 و تولید تصویر پیشرفته DALL-E',
    description:
      'با خرید اشتراک ChatGPT Plus به قوی‌ترین و سریع‌ترین مدل‌های هوش مصنوعی شرکت OpenAI شامل GPT-4o و مدل استدلالی o1 دسترسی پیدا کنید. امکان آپلود فایل، تحلیل داده، ساخت Custom GPT و وب‌گردی لحظه‌ای.',
    price: 1350000,
    sortOrder: 2,
    features: [
      'دسترسی نامحدود به GPT-4o و مدل استدلالی o1',
      'سرعت پاسخ‌دهی اولویت‌دار و بدون قطعی',
      'تولید تصویر با کیفیت فوق‌العاده DALL-E 3',
      'امکان ساخت و استفاده از ابزارهای سفارشی GPTs',
    ],
    plans: [
      {
        name: '۱ ماهه (اکانت آماده اختصاصی)',
        duration: 1,
        price: 1350000,
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        sortOrder: 1,
      },
      {
        name: '۳ ماهه با تخفیف ویژه',
        duration: 3,
        price: 3850000,
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        sortOrder: 2,
      },
    ],
  },
  {
    title: 'اشتراک کلود پرو اختصاصی (Claude Pro)',
    slug: 'claude-pro-subscription',
    shortDescription: 'دسترسی ۵ برابری به هوشمندترین مدل جهان Claude 3.5 Sonnet و Artifacts',
    description:
      'کلود ۳.۵ سونت شاهکار شرکت Anthropic در کدنویسی، تحلیل اسناد طولانی و تفکر منطقی است. با اشتراک Claude Pro تا ۵ برابر پیام بیشتر، دسترسی اولویت‌دار در ساعات شلوغی و استفاده از قابلیت تعاملی Artifacts را تجربه کنید.',
    price: 1420000,
    sortOrder: 3,
    features: [
      'دسترسی نامحدود به مدل شگفت‌انگیز Claude 3.5 Sonnet',
      'پشتیبانی از کانتکست عظیم ۲۰۰ هزار توکنی',
      'محیط تعاملی ساخت اپلیکیشن و کد با قابلیت Artifacts',
      'فعال‌سازی روی ایمیل شخصی شما یا اکانت اختصاصی',
    ],
    plans: [
      {
        name: '۱ ماهه روی ایمیل شخصی',
        duration: 1,
        price: 1420000,
        fulfillmentType: 'CUSTOMER_PROVISIONING',
        sortOrder: 1,
      },
      {
        name: '۳ ماهه اختصاصی',
        duration: 3,
        price: 3990000,
        fulfillmentType: 'CUSTOMER_PROVISIONING',
        sortOrder: 2,
      },
    ],
  },
  {
    title: 'اکانت میدجورنی نسخه ۶ (Midjourney v6)',
    slug: 'midjourney-v6-account',
    shortDescription: 'اشتراک تخصصی قدرتمندترین ابزار خلق تصاویر واقع‌گرایانه و هنری',
    description:
      'میدجورنی پادشاه بی‌رقیب خلق تصاویر هنری، مفهومی، فوق‌واقع‌گرایانه و طراحی گرافیک در دنیای هوش مصنوعی است. با پلن استاندارد به ساعات نامحدود تولید تصاویر به همراه دسترسی به وب‌اپلیکیشن اختصاصی دسترسی پیدا کنید.',
    price: 1850000,
    sortOrder: 4,
    features: [
      'تولید تصویر با کیفیت فوق‌العاده با موتور v6.1',
      '۱۵ ساعت Fast Generation ماهانه + Relax نامحدود',
      'مجوز کامل استفاده تجاری از تصاویر تولید شده',
      'دسترسی مستقیم از طریق دیسکورد و وب‌سایت میدجورنی',
    ],
    plans: [
      {
        name: 'پلن استاندارد ۱ ماهه',
        duration: 1,
        price: 1850000,
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'اشتراک کانوا پرو قانونی (Canva Pro)',
    slug: 'canva-pro-license',
    shortDescription: 'دسترسی کامل به ابزارهای طراحی گرافیک، هوش مصنوعی Magic Studio و فونت‌ها',
    description:
      'کانوا پرو ابزار شماره یک طراحان، ادمین‌های اینستاگرام و تولیدکنندگان محتوا است. حذف خودکار پس‌زمینه تصاویر و ویدیوها، دسترسی به بیش از ۱۰۰ میلیون قالب و عکس استوک، و قابلیت‌های هوش مصنوعی Magic Design.',
    price: 280000,
    sortOrder: 5,
    features: [
      'فعال‌سازی قانونی روی ایمیل اختصاصی شما',
      'دسترسی به تمام ۱۰۰ میلیون قالب و المان پریمیوم',
      'ابزار جادویی هوش مصنوعی Magic Switch و Background Remover',
      'فضای ابری ۱ ترابایتی اختصاصی برای پروژه‌ها',
    ],
    plans: [
      {
        name: 'اشتراک ۱ ساله',
        duration: 12,
        price: 280000,
        fulfillmentType: 'CUSTOMER_PROVISIONING',
        sortOrder: 1,
      },
      {
        name: 'اشتراک مادام‌العمر (لایف‌تایم)',
        duration: 36,
        price: 490000,
        fulfillmentType: 'CUSTOMER_PROVISIONING',
        sortOrder: 2,
      },
    ],
  },
  {
    title: 'اشتراک سالانه پرپلکسیتی پرو (Perplexity Pro)',
    slug: 'perplexity-pro-yearly',
    shortDescription: 'موتور جستجوی پیشرفته متصل به Claude 3.5، GPT-4o و سرچ مقالات علمی',
    description:
      'پرپلکسیتی پرو آینده جستجو در اینترنت است. با این اشتراک می‌توانید بین تمام مدل‌های برتر دنیا سوییچ کنید، تا روزانه ۶۰۰ سرچ عمیق Pro انجام دهید و به منابع آکادمیک و فایل‌های PDF با دقت بالا دسترسی داشته باشید.',
    price: 980000,
    sortOrder: 6,
    features: [
      'بیش از ۶۰۰ جستجوی پیشرفته Pro در روز',
      'قابلیت انتخاب مدل پاسخ‌دهنده (Claude 3.5 Sonnet یا GPT-4o)',
      'اعتبار ۵ دلاری ماهانه API اختصاصی',
      'امکان آپلود و تحلیل نامحدود انواع فایل‌ها و اسناد',
    ],
    plans: [
      {
        name: '۱ ساله روی ایمیل شما',
        duration: 12,
        price: 980000,
        fulfillmentType: 'CUSTOMER_PROVISIONING',
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'اشتراک کرسر پرو (Cursor Pro AI Editor)',
    slug: 'cursor-pro-subscription',
    shortDescription: 'ادیتور کدنویسی هوش مصنوعی محبوب توسعه‌دهندگان جهان مبتنی بر VS Code',
    description:
      'ادیتور Cursor با ادغام عمیق مدل‌های هوش مصنوعی در محیط VS Code کدنویسی شما را چند برابر سریع‌تر می‌کند. ابزار هوشمند Composer کل پروژه شما را متوجه شده و تغییرات گسترده چند فایلی را در چند ثانیه اعمال می‌کند.',
    price: 1550000,
    sortOrder: 7,
    features: [
      '۵۰۰ درخواست سریع ماهانه برای Claude 3.5 Sonnet و GPT-4o',
      'استفاده نامحدود از ابزار Cursor-Tab و پیشنهاد خودکار کد',
      'قابلیت پیشرفته Composer برای ویرایش همزمان چندین فایل پروژه',
      'سازگاری کامل با تمامی افزونه‌های Visual Studio Code',
    ],
    plans: [
      {
        name: '۱ ماهه اختصاصی',
        duration: 1,
        price: 1550000,
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'اکانت گیت‌هاب کوپایلوت (GitHub Copilot)',
    slug: 'github-copilot-individual',
    shortDescription: 'دستیار کدنویسی رسمی گیت‌هاب و مایکروسافت با یکپارچگی کامل در ادیتور',
    description:
      'با گیت‌هاب کوپایلوت سرعت توسعه خود را تا ۵۵ درصد افزایش دهید. پشتیبانی از تمامی زبان‌های برنامه‌نویسی روز دنیا، تولید خودکار تست‌های نرم‌افزاری و چت اختصاصی در VS Code و JetBrains.',
    price: 890000,
    sortOrder: 8,
    features: [
      'تکمیل خودکار و هوشمند کدها در لحظه نوشتن',
      'پشتیبانی در محیط‌های VS Code، Visual Studio و JetBrains',
      'دسترسی به چت هوشمند GitHub Copilot Chat',
      'فعال‌سازی بدون نیاز به کارت اعتباری خارجی',
    ],
    plans: [
      {
        name: '۱ ساله اکانت شخصی',
        duration: 12,
        price: 890000,
        fulfillmentType: 'CUSTOMER_PROVISIONING',
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'اشتراک ران‌وی (Runway Gen-3 Alpha)',
    slug: 'runway-ml-gen3',
    shortDescription: 'غول هوش مصنوعی تبدیل متن و تصویر به ویدیو با کیفیت سینمایی',
    description:
      'ران‌وی پیشروترین هوش مصنوعی دنیا در زمینه تولید و تدوین ویدیوهای فوق‌واقع‌گرایانه است. با نسل جدید مدل Gen-3 Alpha انیمیشن‌ها، جلوه‌های ویژه و کلیپ‌های سینمایی با کنترل دقیق زاویه دوربین خلق کنید.',
    price: 2100000,
    sortOrder: 9,
    features: [
      'دسترسی به پرچم‌دار تولید ویدیو Runway Gen-3 Alpha',
      'ابزار قدرتمند Motion Brush برای کنترل جهت حرکت عناصر تصویر',
      'امکان ارتقای کیفیت ویدیوها تا رزولوشن 4K',
      'بدون واترمارک و قابل استفاده در تمام پروژه‌های تجاری',
    ],
    plans: [
      {
        name: '۱ ماهه پلن استاندارد',
        duration: 1,
        price: 2100000,
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'اشتراک صدای هوش مصنوعی ElevenLabs',
    slug: 'elevenlabs-creator-plan',
    shortDescription: 'واقع‌گرایانه‌ترین ابزار گویندگی هوش مصنوعی و کلون کردن صدا به زبان فارسی و انگلیسی',
    description:
      'اشتراک پلن Creator ابزار ایلون‌لبز به شما امکان می‌دهد طبیعی‌ترین صداگذاری‌ها را روی کتاب‌های صوتی، پادکست‌ها، ویدیوهای یوتیوب و اینستاگرام انجام دهید. قابلیت شبیه‌سازی دقیق صدای خودتان تنها با چند ثانیه ویس.',
    price: 1680000,
    sortOrder: 10,
    features: [
      '۱۰۰ هزار کاراکتر ماهانه (حدود ۲ ساعت صوت با کیفیت)',
      'امکان کلون کردن حرفه‌ای صدا با دقت بی‌نظیر (Voice Cloning)',
      'پشتیبانی خیره‌کننده از بیش از ۲۹ زبان از جمله زبان فارسی',
      'لایسنس کامل تجاری برای انتشار در تمامی رسانه‌ها',
    ],
    plans: [
      {
        name: '۱ ماهه Creator',
        duration: 1,
        price: 1680000,
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'اکانت سونو پرو ساخت موزیک (Suno AI Pro)',
    slug: 'suno-ai-music-pro',
    shortDescription: 'تولید آهنگ و موسیقی کامل به سبک دلخواه با شعر و صدای خواننده با هوش مصنوعی',
    description:
      'تنها با توصیف یک موضوع یا ارائه شعر دلخواه، سونو هوش مصنوعی برای شما آهنگ کامل در سبک‌های پاپ، راک، سنتی یا هیپ‌هاپ همراه با صدای طبیعی خواننده تولید می‌کند. پلن Pro مالکیت تجاری کامل قطعات را به شما می‌دهد.',
    price: 950000,
    sortOrder: 11,
    features: [
      '۲۵۰۰ کردیت در ماه (معادل ۵۰۰ آهنگ کامل و دونالد)',
      'مجوز قانونی مالکیت تجاری آهنگ‌های تولید شده برای یوتیوب و اسپاتیفای',
      'امکان ادیت، ادامه دادن آهنگ و جداسازی وکال از ساز',
      'بدون صف انتظار با پردازش ۱۰ برابری اولویت‌دار',
    ],
    plans: [
      {
        name: '۱ ماهه Pro',
        duration: 1,
        price: 950000,
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'اشتراک جامع پو (Poe AI Subscription)',
    slug: 'poe-ai-all-in-one',
    shortDescription: 'دسترسی همزمان به صدها مدل هوش مصنوعی (Claude, GPT-4, Llama, Gemini) در یک اشتراک',
    description:
      'سرویس Poe از شرکت Quora به شما امکان می‌دهد در یک رابط کاربری ساده، همزمان با قوی‌ترین ربات‌های هوش مصنوعی جهان مانند Claude 3.5، GPT-4o، FLUX و Llama 3 گفتگو کرده و پروژه‌های خود را پیش ببرید.',
    price: 1450000,
    sortOrder: 12,
    features: [
      'یک میلیون امتیاز ماهانه برای چت با مدل‌های پیشرفته',
      'پشتیبانی از Claude 3.5 Sonnet، GPT-4o، Gemini 1.5 Pro و صدها ربات دیگر',
      'تولید تصویر با مدل‌های FLUX و Stable Diffusion 3',
      'اپلیکیشن فوق‌العاده سریع برای موبایل (iOS و Android) و وب',
    ],
    plans: [
      {
        name: '۱ ماهه شخصی',
        duration: 1,
        price: 1450000,
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        sortOrder: 1,
      },
      {
        name: '۱ ساله اختصاصی',
        duration: 12,
        price: 11900000,
        fulfillmentType: 'CUSTOMER_PROVISIONING',
        sortOrder: 2,
      },
    ],
  },
  {
    title: 'گوگل جمینای ادونسد (Gemini Advanced ۳ ماهه)',
    slug: 'gemini-advanced-quarterly',
    shortDescription: 'اشتراک ۳ ماهه اختصاصی Gemini Advanced با دسترسی به مدل پرچم‌دار گوگل Ultra',
    description:
      'تجربه بالاترین سطح هوش مصنوعی گوگل با Gemini Advanced. کدنویسی پیشرفته، تجزیه و تحلیل نمودارها و تصاویر پیچیده، کانتکست ۱ میلیون توکنی و ادغام مستقیم با تمام ابزارهای Google Workspace.',
    price: 680000,
    sortOrder: 13,
    features: [
      'کانتکست فوق‌العاده بزرگ ۱ میلیون توکن (خواندن کتاب‌ها و ساعت‌ها ویدیو)',
      'ادغام با جیمیل، داکس، درایو و یوتیوب',
      'فعال‌سازی اختصاصی بدون نیاز به تغییر آی‌پی مداوم',
      '۲ ترابایت فضای ابری گوگل درایو در طول دوره اشتراک',
    ],
    plans: [
      {
        name: '۳ ماهه اختصاصی',
        duration: 3,
        price: 680000,
        fulfillmentType: 'CUSTOMER_PROVISIONING',
        sortOrder: 1,
      },
    ],
  },
  {
    title: 'اشتراک نوشن پلاس همراه با هوش مصنوعی (Notion AI)',
    slug: 'notion-ai-plus-unlimited',
    shortDescription: 'مدیریت وظایف، نت‌برداری هوشمند و خلاصه‌سازی خودکار جلسات و پروژه‌ها',
    description:
      'نوشن هوش مصنوعی دستیار نویسندگی و سازمان‌دهی شماست. متن‌ها را بازنویسی کنید، ایده‌پردازی کنید، صورت‌جلسات صوتی را به چک‌لیست کارهای اجرایی تبدیل کنید و دیتابیس‌های پیچیده را بدون کد بسازید.',
    price: 850000,
    sortOrder: 14,
    features: [
      'استفاده نامحدود از ابزار هوش مصنوعی Notion AI در تمام صفحات',
      'فضای کاری نامحدود تیمی و شخصی با پلن Plus',
      'امکان بارگذاری فایل‌ها با حجم نامحدود',
      'جستجوی معنایی هوشمند در بین تمام یادداشت‌ها و مستندات',
    ],
    plans: [
      {
        name: '۱ ساله پلن پلاس + AI',
        duration: 12,
        price: 850000,
        fulfillmentType: 'CUSTOMER_PROVISIONING',
        sortOrder: 1,
      },
    ],
  },
]

async function seed() {
  console.log('🚀 Starting fake products seed for pagination...')

  // Archive old generic test products
  const testSlugs = [
    'no-stock-test-1789042056413',
    'chatgpt-precreated-test-1789037067919',
    'claude-provisioning-test-1789037067919',
    'custom-manual-test-1789042056413',
    'custom-manual-test-1789037067919',
  ]
  await prisma.product.updateMany({
    where: { slug: { in: testSlugs } },
    data: { status: 'ARCHIVED' },
  })

  // Upsert all realistic fake products
  for (const p of FAKE_PRODUCTS) {
    const existing = await prisma.product.findUnique({
      where: { slug: p.slug },
      include: { plans: true },
    })

    let product
    if (existing) {
      product = await prisma.product.update({
        where: { id: existing.id },
        data: {
          title: p.title,
          shortDescription: p.shortDescription,
          description: p.description,
          price: p.price,
          status: 'ACTIVE',
          sortOrder: p.sortOrder,
          features: p.features,
        },
        include: { plans: true },
      })
      console.log(`Updated product: ${p.title}`)
    } else {
      product = await prisma.product.create({
        data: {
          title: p.title,
          slug: p.slug,
          shortDescription: p.shortDescription,
          description: p.description,
          price: p.price,
          status: 'ACTIVE',
          sortOrder: p.sortOrder,
          features: p.features,
        },
        include: { plans: true },
      })
      console.log(`Created product: ${p.title}`)
    }

    // Ensure plans
    for (const planData of p.plans) {
      const existingPlan = product.plans.find((pl) => pl.name === planData.name)
      let plan
      if (existingPlan) {
        plan = await prisma.plan.update({
          where: { id: existingPlan.id },
          data: {
            duration: planData.duration,
            price: planData.price,
            fulfillmentType: planData.fulfillmentType,
            active: true,
            sortOrder: planData.sortOrder || 1,
          },
        })
      } else {
        plan = await prisma.plan.create({
          data: {
            productId: product.id,
            name: planData.name,
            duration: planData.duration,
            price: planData.price,
            fulfillmentType: planData.fulfillmentType,
            active: true,
            sortOrder: planData.sortOrder || 1,
          },
        })
      }

      // If PRE_CREATED_ACCOUNT or ACTIVATION_LINK, create fake inventory items if none exist
      if (
        plan.fulfillmentType === 'PRE_CREATED_ACCOUNT' ||
        plan.fulfillmentType === 'ACTIVATION_LINK'
      ) {
        const invCount = await prisma.inventoryItem.count({
          where: {
            productId: product.id,
            planId: plan.id,
            status: 'AVAILABLE',
          },
        })

        if (invCount < 5) {
          const needed = 5 - invCount
          for (let i = 0; i < needed; i++) {
            const dataPayload =
              plan.fulfillmentType === 'PRE_CREATED_ACCOUNT'
                ? {
                    email: `user-${product.slug}-${Date.now().toString(36)}-${i + 1}@ariochat.demo`,
                    password: `ArioPass!${Math.floor(1000 + Math.random() * 9000)}`,
                    notes: 'اکانت اختصاصی آماده تحویل قانونی',
                  }
                : {
                    url: `https://ariochat.com/activate/${product.slug}?token=${Math.random().toString(36).substring(2, 10)}`,
                  }

            await prisma.inventoryItem.create({
              data: {
                productId: product.id,
                planId: plan.id,
                type:
                  plan.fulfillmentType === 'PRE_CREATED_ACCOUNT'
                    ? InventoryType.PRE_CREATED_ACCOUNT
                    : InventoryType.ACTIVATION_LINK,
                data: dataPayload,
                status: 'AVAILABLE',
              },
            })
          }
        }
      }
    }
  }

  const totalActive = await prisma.product.count({ where: { status: 'ACTIVE' } })
  console.log(`\n🎉 Done! Total active products now: ${totalActive}`)
  console.log(`With 6 items per page, there will be ${Math.ceil(totalActive / 6)} pages.`)
}

seed()
  .catch((e) => {
    console.error('Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
