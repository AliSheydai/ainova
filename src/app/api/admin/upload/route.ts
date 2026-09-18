import { type NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

// Allowed MIME types and corresponding safe file extensions
const IMAGE_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
}

const VIDEO_MIME_TYPES: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogv',
  'video/quicktime': '.mov',
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50 MB

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdminApi()
  if (errorResponse) return errorResponse

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'فایلی جهت آپلود ارسال نشده است.' },
        { status: 400 }
      )
    }

    const mimeType = file.type?.toLowerCase()
    const isImage = Boolean(IMAGE_MIME_TYPES[mimeType])
    const isVideo = Boolean(VIDEO_MIME_TYPES[mimeType])

    if (!isImage && !isVideo) {
      return NextResponse.json(
        {
          success: false,
          error:
            'فرمت فایل نامعتبر است. فرمت‌های مجاز تصویر: WebP، PNG، JPG، SVG و ویدیو: MP4، WebM.',
        },
        { status: 400 }
      )
    }

    // Validate size depending on type
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    const maxSizeLabel = isVideo ? '۵۰ مگابایت' : '۵ مگابایت'

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `حجم فایل بیشتر از حد مجاز است. حداکثر حجم مجاز ${maxSizeLabel} می‌باشد.`,
        },
        { status: 400 }
      )
    }

    const extension = isVideo ? VIDEO_MIME_TYPES[mimeType] : IMAGE_MIME_TYPES[mimeType]
    const subFolder = isVideo ? 'videos' : 'products'

    // Target upload folder
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subFolder)
    await fs.mkdir(uploadDir, { recursive: true })

    // Generate collision-proof unique filename
    const uniqueName = `${crypto.randomUUID()}${extension}`
    const targetFilePath = path.join(uploadDir, uniqueName)

    // Convert file to Buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(targetFilePath, buffer)

    // Public web accessible URL
    const publicUrl = `/uploads/${subFolder}/${uniqueName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueName,
      size: file.size,
      isVideo,
      message: isVideo
        ? 'ویدئو با موفقیت بارگذاری شد.'
        : 'تصویر با موفقیت بارگذاری شد.',
    })
  } catch (error: unknown) {
    console.error('Error uploading product image:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری و ذخیره تصویر بر روی سرور.' },
      { status: 500 }
    )
  }
}
