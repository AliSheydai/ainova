/**
 * Sanitizes user input text by stripping dangerous script/style blocks,
 * removing any remaining HTML tags, and trimming excess whitespace.
 */
export function sanitizeInputText(text: string): string {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
}
