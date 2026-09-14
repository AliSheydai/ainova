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

  // 2. Bold: **text** or *text*
  result = result.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')

  // 3. Strikethrough: ~~text~~
  result = result.replace(/~~(.+?)~~/g, '<s>$1</s>')

  // 4. Spoiler: ||text||
  result = result.replace(/\|\|(.+?)\|\|/g, '<tg-spoiler>$1</tg-spoiler>')

  // 5. Monospace: `code`
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>')

  // 6. Links: [label](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // 7. Blockquote: lines starting with &gt;
  result = result.replace(/^&gt;\s*(.+)$/gm, '<blockquote>$1</blockquote>')

  return result
}
