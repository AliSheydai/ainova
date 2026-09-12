import { type NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

// Allowed MIME types and corresponding safe file extensions
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

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

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'حجم فایل بیشتر از حد مجاز است. حداکثر حجم مجاز ۵ مگابایت می‌باشد.',
        },
        { status: 400 }
      )
    }

    // Validate MIME type
    const mimeType = file.type?.toLowerCase()
    const extension = ALLOWED_MIME_TYPES[mimeType]

    if (!extension) {
      return NextResponse.json(
        {
          success: false,
          error:
            'فرمت فایل نامعتبر است. فرمت‌های مجاز: WebP، PNG، JPG، GIF و SVG.',
        },
        { status: 400 }
      )
    }

    // Target upload folder: public/uploads/products
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
    await fs.mkdir(uploadDir, { recursive: true })

    // Generate collision-proof unique filename
    const uniqueName = `${crypto.randomUUID()}${extension}`
    const targetFilePath = path.join(uploadDir, uniqueName)

    // Convert file to Buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(targetFilePath, buffer)

    // Public web accessible URL
    const publicUrl = `/uploads/products/${uniqueName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: uniqueName,
      size: file.size,
      message: 'تصویر با موفقیت بارگذاری شد.',
    })
  } catch (error: unknown) {
    console.error('Error uploading product image:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در بارگذاری و ذخیره تصویر بر روی سرور.' },
      { status: 500 }
    )
  }
}
