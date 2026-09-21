import { describe, expect, it } from 'vitest'
import {
  mdToTgHtml,
  formatProductDescriptionPreview,
  closeUnclosedHtmlTags,
} from './formatting'

describe('Telegram Formatting Utilities', () => {
  it('strips markdown headings (#) and formats text properly', () => {
    const md = '# اکانت ChatGPT Plus؛ دسترسی حرفهایتر به هوش مصنوعی'
    const html = mdToTgHtml(md)
    expect(html).not.toContain('#')
    expect(html).toContain('<b>اکانت ChatGPT Plus؛ دسترسی حرفهایتر به هوش مصنوعی</b>')
  })

  it('correctly converts markdown bold **text** to HTML <b>text</b>', () => {
    const md = 'استفاده میکنید، **ChatGPT Plus** تجربهای کاملتر'
    const html = mdToTgHtml(md)
    expect(html).not.toContain('**')
    expect(html).toContain('<b>ChatGPT Plus</b>')
  })

  it('formats product description preview cleanly without breaking words or unclosed tags', () => {
    const rawDesc = `# اکانت ChatGPT Plus؛ دسترسی حرفهایتر به هوش مصنوعی

اگر از ChatGPT برای کار، برنامهنویسی، تولید محتوا، یادگیری، تحقیق، تحلیل اطلاعات یا انجام کارهای روزمره استفاده میکنید، **ChatGPT Plus** تجربهای کاملتر و حرفهایتر از نسخه رایگان در اختیار شما قرار میدهد.`

    const preview = formatProductDescriptionPreview(rawDesc, 200)

    // Heading # must not exist
    expect(preview).not.toContain('#')
    // Bold must be properly converted
    expect(preview).toContain('<b>ChatGPT Plus</b>')
    // HTML tags must be properly closed
    expect(preview).toMatch(/<b>.*?<\/b>/)
    // Must end with ellipsis if truncated
    expect(preview.endsWith('...')).toBe(true)
  })

  it('closes unclosed HTML tags safely to prevent Telegram Bad Request errors', () => {
    const broken = '<b>Bold text <code>code block'
    const fixed = closeUnclosedHtmlTags(broken)
    expect(fixed).toBe('<b>Bold text <code>code block</code></b>')
  })
})
