/**
 * Telegram Message Formatting Utilities
 * Standardized HTML formatting helpers for Telegram Bot API
 */

export const TG_DIVIDER = ''
export const TG_SUB_DIVIDER = ''

/**
 * Escapes characters that are reserved in Telegram HTML parse mode.
 */
export function escapeHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Creates bold text
 */
export function b(text: string | number | null | undefined): string {
  return `<b>${escapeHtml(text)}</b>`
}

/**
 * Plain text representation (italics disabled per user request)
 */
export function i(text: string | number | null | undefined): string {
  return escapeHtml(text)
}

/**
 * Creates inline monospace code text
 */
export function code(text: string | number | null | undefined): string {
  return `<code>${escapeHtml(text)}</code>`
}

/**
 * Creates a blockquote
 */
export function quote(text: string | number | null | undefined): string {
  return `<blockquote>${escapeHtml(text)}</blockquote>`
}

/**
 * Creates an expandable blockquote
 */
export function expandableQuote(text: string | number | null | undefined): string {
  return `<blockquote expandable>${escapeHtml(text)}</blockquote>`
}

/**
 * Creates strikethrough text (e.g. for original price)
 */
export function s(text: string | number | null | undefined): string {
  return `<s>${escapeHtml(text)}</s>`
}

/**
 * Creates spoiler text
 */
export function spoiler(text: string | number | null | undefined): string {
  return `<tg-spoiler>${escapeHtml(text)}</tg-spoiler>`
}

/**
 * Creates an inline hyperlink
 */
export function link(label: string, url: string): string {
  return `<a href="${url}">${escapeHtml(label)}</a>`
}

/**
 * Closes any unclosed HTML tags in the provided string.
 * Essential when slicing/truncating text to prevent Telegram HTML entity parsing errors.
 */
export function closeUnclosedHtmlTags(html: string): string {
  const openTags: string[] = []
  const tagRegex = /<\/?([a-zA-Z0-9_-]+)[^>]*>/g
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(html)) !== null) {
    const fullTag = match[0]
    const tagName = match[1].toLowerCase()
    if (fullTag.startsWith('</')) {
      const lastIndex = openTags.lastIndexOf(tagName)
      if (lastIndex !== -1) {
        openTags.splice(lastIndex, 1)
      }
    } else if (!fullTag.endsWith('/>')) {
      openTags.push(tagName)
    }
  }

  let fixedHtml = html
  for (let i = openTags.length - 1; i >= 0; i--) {
    fixedHtml += `</${openTags[i]}>`
  }

  return fixedHtml
}

/**
 * Helper to convert legacy markdown markers into valid Telegram HTML.
 * (Italics disabled per user design preference)
 */
export function mdToTgHtml(text: string): string {
  if (!text) return ''

  // 1. First escape HTML special entities
  let result = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 2. Headings: # Heading 1..6 -> <b>Heading</b> (strip # and bold)
  result = result.replace(/^#{1,6}\s*(.+?)\s*#*$/gm, '<b>$1</b>')

  // 3. Unordered list items: - item or * item -> • item
  result = result.replace(/^[\t ]*[-*]\s+(.+)$/gm, '• $1')

  // 4. Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')

  // 5. Strikethrough: ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<s>$1</s>')

  // 6. Spoiler: ||text||
  result = result.replace(/\|\|(.+?)\|\|/g, '<tg-spoiler>$1</tg-spoiler>')

  // 7. Monospace: `code`
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')

  // 8. Links: [label](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // 9. Blockquote: lines starting with &gt;
  result = result.replace(/^&gt;\s*(.+)$/gm, '<blockquote>$1</blockquote>')

  return result
}

/**
 * Formats and truncates product description for Telegram message preview.
 * Strips markdown heading markers (#), converts markdown (bold, links, etc.) to Telegram HTML,
 * cleanly truncates text at word boundaries, and ensures all HTML tags are properly closed.
 */
export function formatProductDescriptionPreview(
  description: string | null | undefined,
  maxLength: number = 250
): string {
  if (!description) return ''

  let text = description.trim()

  let isTruncated = false
  if (text.length > maxLength) {
    // Cut cleanly at word boundary
    const cutPos = text.lastIndexOf(' ', maxLength)
    text = text.slice(0, cutPos > maxLength * 0.7 ? cutPos : maxLength).trim()
    isTruncated = true

    // Close unclosed markdown bold marker if truncated inside
    const boldMatches = text.match(/\*\*/g)
    if (boldMatches && boldMatches.length % 2 !== 0) {
      text += '**'
    }

    // Close unclosed inline code marker if truncated inside
    const codeMatches = text.match(/`/g)
    if (codeMatches && codeMatches.length % 2 !== 0) {
      text += '`'
    }

    // Close unclosed strikethrough marker if truncated inside
    const strikeMatches = text.match(/~~/g)
    if (strikeMatches && strikeMatches.length % 2 !== 0) {
      text += '~~'
    }
  }

  let html = mdToTgHtml(text)

  // Extra safety net against unclosed HTML tags
  html = closeUnclosedHtmlTags(html)

  if (isTruncated) {
    html += '...'
  }

  return html
}

