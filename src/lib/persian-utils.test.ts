import { describe, it, expect } from 'vitest'
import {
  toEnglishDigits,
  toPersianDigits,
  formatNumberWithCommas,
  numberToWordsPersian,
  formatPlanDurationLabel,
} from './persian-utils'

describe('persian-utils', () => {
  it('converts Persian/Arabic numerals to English', () => {
    expect(toEnglishDigits('۱۲۳۴۵۶۷۸۹۰')).toBe('1234567890')
    expect(toEnglishDigits('١٢٣٤٥٦٧٨٩٠')).toBe('1234567890')
    expect(toEnglishDigits('قیمت: ۳۵۰,۰۰۰ تومان')).toBe('قیمت: 350,000 تومان')
  })

  it('converts English numerals to Persian', () => {
    expect(toPersianDigits('1234567890')).toBe('۱۲۳۴۵۶۷۸۹۰')
  })

  it('formats numbers with 3-digit comma separators', () => {
    expect(formatNumberWithCommas('390000')).toBe('390,000')
    expect(formatNumberWithCommas('۳۹۰۰۰۰')).toBe('390,000')
    expect(formatNumberWithCommas(1500000)).toBe('1,500,000')
    expect(formatNumberWithCommas('')).toBe('')
  })

  it('converts numbers to Persian words correctly', () => {
    expect(numberToWordsPersian(0)).toBe('صفر')
    expect(numberToWordsPersian(1)).toBe('یک')
    expect(numberToWordsPersian(15)).toBe('پانزده')
    expect(numberToWordsPersian(100)).toBe('یکصد')
    expect(numberToWordsPersian(390000)).toBe('سیصد و نود هزار')
    expect(numberToWordsPersian('1500000')).toBe('یک میلیون و پانصد هزار')
    expect(numberToWordsPersian('25000000')).toBe('بیست و پنج میلیون')
    expect(numberToWordsPersian('1000000000')).toBe('یک میلیارد')
  })

  it('formats plan duration labels', () => {
    expect(formatPlanDurationLabel(1)).toBe('۱ ماهه')
    expect(formatPlanDurationLabel(3)).toBe('۳ ماهه (فصلی)')
    expect(formatPlanDurationLabel(12)).toBe('۱ ساله (۱۲ ماهه)')
    expect(formatPlanDurationLabel(24)).toBe('۲ ساله (۲۴ ماهه)')
  })
})
