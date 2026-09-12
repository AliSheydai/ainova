/**
 * Persian language and numbering utilities for formatting, digit conversion,
 * and number-to-words representation.
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

/**
 * Converts Persian and Arabic numerals in a string to standard English digits.
 */
export function toEnglishDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return ''
  let str = String(input)
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), String(i))
    str = str.replace(new RegExp(ARABIC_DIGITS[i], 'g'), String(i))
  }
  return str
}

/**
 * Converts English digits in a string/number to Persian numerals.
 */
export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return ''
  const str = String(input)
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)])
}

/**
 * Formats a number or numeric string with standard 3-digit comma separators.
 * Preserves empty string if input is empty or invalid.
 */
export function formatNumberWithCommas(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return ''
  const clean = toEnglishDigits(input).replace(/[^\d]/g, '')
  if (!clean) return ''
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Persian word components
const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه']
const TEENS = [
  'ده',
  'یازده',
  'دوازده',
  'سیزده',
  'چهارده',
  'پانزده',
  'شانزده',
  'هفده',
  'هجده',
  'نوزده',
]
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود']
const HUNDREDS = [
  '',
  'یکصد',
  'دویست',
  'سیصد',
  'چهارصد',
  'پانصد',
  'ششصد',
  'هفتصد',
  'هشتصد',
  'نهصد',
]
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون']

function convertThreeDigitGroup(num: number): string {
  const parts: string[] = []
  const h = Math.floor(num / 100)
  const remainder = num % 100

  if (h > 0) {
    parts.push(HUNDREDS[h])
  }

  if (remainder > 0) {
    if (remainder < 10) {
      parts.push(ONES[remainder])
    } else if (remainder < 20) {
      parts.push(TEENS[remainder - 10])
    } else {
      const t = Math.floor(remainder / 10)
      const o = remainder % 10
      parts.push(TENS[t])
      if (o > 0) {
        parts.push(ONES[o])
      }
    }
  }

  return parts.filter(Boolean).join(' و ')
}

/**
 * Converts a non-negative integer into words in the Persian language.
 * Example: 390000 -> "سیصد و نود هزار"
 */
export function numberToWordsPersian(input: number | string): string {
  const clean = toEnglishDigits(input).replace(/[^\d]/g, '')
  if (!clean) return ''
  const num = parseInt(clean, 10)
  if (isNaN(num)) return ''
  if (num === 0) return 'صفر'

  // Split into chunks of 3 digits from right to left
  const chunks: number[] = []
  let temp = clean
  while (temp.length > 0) {
    const chunkStr = temp.slice(-3)
    chunks.push(parseInt(chunkStr, 10))
    temp = temp.slice(0, -3)
  }

  const chunkWords: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    const currentChunk = chunks[i]
    if (currentChunk > 0) {
      const groupWord = convertThreeDigitGroup(currentChunk)
      const scaleWord = SCALES[i]
      if (scaleWord) {
        chunkWords.unshift(`${groupWord} ${scaleWord}`)
      } else {
        chunkWords.unshift(groupWord)
      }
    }
  }

  return chunkWords.filter(Boolean).join(' و ')
}

/**
 * Helper to get user-friendly duration label in Persian.
 * Example: 1 -> "۱ ماه", 12 -> "۱ سال (۱۲ ماه)"
 */
export function formatPlanDurationLabel(months: number | string): string {
  const clean = toEnglishDigits(months).replace(/[^\d]/g, '')
  const m = parseInt(clean, 10)
  if (isNaN(m) || m <= 0) return ''

  if (m === 1) return '۱ ماهه'
  if (m === 3) return '۳ ماهه (فصلی)'
  if (m === 6) return '۶ ماهه (نیم‌ساله)'
  if (m === 12) return '۱ ساله (۱۲ ماهه)'
  if (m === 24) return '۲ ساله (۲۴ ماهه)'
  if (m % 12 === 0) return `${toPersianDigits(m / 12)} ساله (${toPersianDigits(m)} ماهه)`
  return `${toPersianDigits(m)} ماهه`
}

/**
 * Standard Persian price formatter ensuring full Persian digits and 3-digit comma separation.
 * Example: 390000 -> "۳۹۰,۰۰۰ تومان"
 */
export function formatPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '۰ تومان'
  const cleanStr = toEnglishDigits(amount).replace(/[^\d.-]/g, '')
  const num = parseFloat(cleanStr)
  if (isNaN(num)) return '۰ تومان'
  const formatted = new Intl.NumberFormat('en-US').format(num)
  return `${toPersianDigits(formatted)} تومان`
}

/**
 * Formats a number with comma separation and Persian digits without currency suffix.
 * Example: 390000 -> "۳۹۰,۰۰۰"
 */
export function formatPersianNumber(input: number | string | null | undefined): string {
  if (input === null || input === undefined || input === '') return ''
  const cleanStr = toEnglishDigits(input).replace(/[^\d.-]/g, '')
  const num = parseFloat(cleanStr)
  if (isNaN(num)) return ''
  const formatted = new Intl.NumberFormat('en-US').format(num)
  return toPersianDigits(formatted)
}

/**
 * Formats date into Persian (Solar Hijri) calendar with guaranteed Persian digits.
 */
export function formatPersianDate(
  dateInput: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return ''
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    const formatted = d.toLocaleDateString(
      'fa-IR',
      options || {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    )
    return toPersianDigits(formatted)
  } catch {
    return toPersianDigits(String(dateInput))
  }
}

/**
 * Formats relative time in Persian with guaranteed Persian digits.
 * Example: "۵ دقیقه پیش", "۲ ساعت پیش", "۳ روز پیش"
 */
export function formatRelativeTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return ''
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSec < 60) return 'لحظاتی پیش'
    if (diffSec < 3600) return `${toPersianDigits(Math.floor(diffSec / 60))} دقیقه پیش`
    if (diffSec < 86400) return `${toPersianDigits(Math.floor(diffSec / 3600))} ساعت پیش`
    if (diffSec < 604800) return `${toPersianDigits(Math.floor(diffSec / 86400))} روز پیش`
    return formatPersianDate(date, { month: 'short', day: 'numeric' })
  } catch {
    return toPersianDigits(String(dateInput))
  }
}
