import { describe, it, expect } from 'vitest'
import { parseVideoUrl } from './video-utils'

describe('parseVideoUrl', () => {
  it('returns null for empty or invalid input', () => {
    expect(parseVideoUrl('')).toBeNull()
    expect(parseVideoUrl('   ')).toBeNull()
    expect(parseVideoUrl(null)).toBeNull()
    expect(parseVideoUrl(undefined)).toBeNull()
  })

  it('correctly parses Aparat watch URLs', () => {
    const parsed = parseVideoUrl('https://www.aparat.com/v/kLt5a')
    expect(parsed).not.toBeNull()
    expect(parsed?.type).toBe('aparat')
    expect(parsed?.src).toBe('https://www.aparat.com/video/video/embed/videohash/kLt5a/vt/frame')
  })

  it('correctly parses Aparat embed URLs', () => {
    const parsed = parseVideoUrl('https://www.aparat.com/video/video/embed/videohash/abc12/vt/frame')
    expect(parsed).not.toBeNull()
    expect(parsed?.type).toBe('aparat')
    expect(parsed?.src).toBe('https://www.aparat.com/video/video/embed/videohash/abc12/vt/frame')
  })

  it('extracts URL from iframe tags', () => {
    const iframeCode = '<iframe src="https://www.aparat.com/v/xyz99" width="640" height="360"></iframe>'
    const parsed = parseVideoUrl(iframeCode)
    expect(parsed).not.toBeNull()
    expect(parsed?.type).toBe('aparat')
    expect(parsed?.src).toContain('xyz99')
  })

  it('correctly parses YouTube watch URLs', () => {
    const parsed = parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(parsed).not.toBeNull()
    expect(parsed?.type).toBe('youtube')
    expect(parsed?.src).toContain('dQw4w9WgXcQ')
    expect(parsed?.src).toContain('youtube-nocookie.com')
  })

  it('correctly parses YouTube short youtu.be URLs', () => {
    const parsed = parseVideoUrl('https://youtu.be/dQw4w9WgXcQ')
    expect(parsed).not.toBeNull()
    expect(parsed?.type).toBe('youtube')
    expect(parsed?.src).toContain('dQw4w9WgXcQ')
  })

  it('correctly parses local uploaded video paths', () => {
    const parsed = parseVideoUrl('/uploads/videos/test-uuid.mp4')
    expect(parsed).not.toBeNull()
    expect(parsed?.type).toBe('direct')
    expect(parsed?.src).toBe('/uploads/videos/test-uuid.mp4')
  })

  it('correctly parses direct MP4 and WebM URLs', () => {
    const parsed = parseVideoUrl('https://cdn.example.com/videos/intro.mp4?token=123')
    expect(parsed).not.toBeNull()
    expect(parsed?.type).toBe('direct')
    expect(parsed?.src).toBe('https://cdn.example.com/videos/intro.mp4?token=123')
  })
})
