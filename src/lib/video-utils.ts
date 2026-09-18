export type VideoSourceType = 'aparat' | 'youtube' | 'direct' | 'unknown'

export interface ParsedVideo {
  type: VideoSourceType
  src: string
  label: string
  original: string
}

/**
 * Parses user/admin input which could be an Aparat link, YouTube link, direct video file URL,
 * or raw iframe embed snippet, and normalizes it into a playback-ready resource.
 */
export function parseVideoUrl(input: string | null | undefined): ParsedVideo | null {
  if (!input || !input.trim()) return null
  const trimmed = input.trim()

  // 1. Check if user pasted an iframe tag
  const iframeSrcMatch = trimmed.match(/<iframe.*?src=["'](.*?)["']/i)
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    return parseVideoUrl(iframeSrcMatch[1])
  }

  // 2. Aparat
  // Direct embed: aparat.com/video/video/embed/videohash/XXXXX/vt/frame
  const aparatEmbedMatch = trimmed.match(/aparat\.com\/video\/video\/embed\/videohash\/([a-zA-Z0-9_-]+)/i)
  if (aparatEmbedMatch && aparatEmbedMatch[1]) {
    return {
      type: 'aparat',
      src: `https://www.aparat.com/video/video/embed/videohash/${aparatEmbedMatch[1]}/vt/frame`,
      label: 'آپارات (Aparat)',
      original: trimmed,
    }
  }

  // Watch URL: aparat.com/v/XXXXX
  const aparatUrlMatch = trimmed.match(/aparat\.com\/v\/([a-zA-Z0-9_-]+)/i)
  if (aparatUrlMatch && aparatUrlMatch[1]) {
    return {
      type: 'aparat',
      src: `https://www.aparat.com/video/video/embed/videohash/${aparatUrlMatch[1]}/vt/frame`,
      label: 'آپارات (Aparat)',
      original: trimmed,
    }
  }

  // 3. YouTube
  // Standard, short, embed, or shorts
  const youtubeMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  )
  if (youtubeMatch && youtubeMatch[1]) {
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`,
      label: 'یوتیوب (YouTube)',
      original: trimmed,
    }
  }

  // 4. Direct video files or local uploaded files
  const cleanUrl = trimmed.split('?')[0].toLowerCase()
  if (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogv') ||
    cleanUrl.endsWith('.mov') ||
    trimmed.startsWith('/uploads/videos/') ||
    trimmed.startsWith('/uploads/products/')
  ) {
    return {
      type: 'direct',
      src: trimmed,
      label: 'فایل مستقیم (HTML5 Video)',
      original: trimmed,
    }
  }

  // 5. Generic URL fallback if valid web URL
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('/')
  ) {
    return {
      type: 'direct',
      src: trimmed,
      label: 'آدرس مستقیم ویدئو',
      original: trimmed,
    }
  }

  return null
}
