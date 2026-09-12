import React from 'react'
import { cn } from '@/lib/utils'

interface MarkdownViewProps {
  content?: string | null
  className?: string
}

/**
 * Format inline markdown tokens: bold, italic, code, link, strikethrough
 */
function renderInline(text: string): React.ReactNode[] {
  // Regex to split by links, inline code, bold, italic, strikethrough
  const tokens = text.split(
    /(\[.*?\]\(https?:\/\/[^\s)]+\)|`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*)/g
  )

  return tokens.map((part, index) => {
    if (!part) return null

    // Link: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/)
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary transition-colors font-medium'
        >
          {linkMatch[1]}
        </a>
      )
    }

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={index}
          className='rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-primary border border-border/60'
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    // Bold: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className='font-bold text-foreground'>
          {part.slice(2, -2)}
        </strong>
      )
    }

    // Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      return (
        <del key={index} className='line-through text-muted-foreground'>
          {part.slice(2, -2)}
        </del>
      )
    }

    // Italic: *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={index} className='italic text-foreground/90'>
          {part.slice(1, -1)}
        </em>
      )
    }

    return <React.Fragment key={index}>{part}</React.Fragment>
  })
}

/**
 * A lightweight, dependency-free, secure Markdown renderer with Vazirmatn RTL styling.
 */
export function MarkdownView({ content, className }: MarkdownViewProps) {
  if (!content || !content.trim()) {
    return null
  }

  const lines = content.split(/\r?\n/)
  const elements: React.ReactNode[] = []

  let inCodeBlock = false
  let codeBlockBuffer: string[] = []
  let listBuffer: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flushList = () => {
    if (!listBuffer) return
    const currentList = listBuffer
    const isOrdered = currentList.type === 'ol'
    const ListTag = isOrdered ? 'ol' : 'ul'

    elements.push(
      <ListTag
        key={`list-${elements.length}`}
        className={cn(
          'my-3 space-y-1.5 pe-2',
          isOrdered ? 'list-decimal list-inside' : 'list-disc list-inside'
        )}
      >
        {currentList.items.map((item, idx) => (
          <li key={idx} className='text-sm leading-relaxed text-foreground/90'>
            {renderInline(item)}
          </li>
        ))}
      </ListTag>
    )
    listBuffer = null
  }

  const flushCodeBlock = () => {
    if (!inCodeBlock) return
    elements.push(
      <div
        key={`code-${elements.length}`}
        className='my-3 overflow-x-auto rounded-xl bg-muted/60 p-4 font-mono text-xs border border-border/70 text-foreground'
        dir='ltr'
      >
        <pre>{codeBlockBuffer.join('\n')}</pre>
      </div>
    )
    codeBlockBuffer = []
    inCodeBlock = false
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // Code block toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock()
      } else {
        flushList()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(rawLine)
      continue
    }

    // Empty line
    if (!trimmed) {
      flushList()
      continue
    }

    // Horizontal rule
    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      flushList()
      elements.push(
        <hr
          key={`hr-${elements.length}`}
          className='my-4 border-border/60'
        />
      )
      continue
    }

    // Headers
    if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h1
          key={`h1-${elements.length}`}
          className='mt-5 mb-2.5 text-xl font-black text-foreground sm:text-2xl tracking-tight'
        >
          {renderInline(trimmed.replace(/^#\s+/, ''))}
        </h1>
      )
      continue
    }

    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2
          key={`h2-${elements.length}`}
          className='mt-4 mb-2 text-lg font-bold text-foreground sm:text-xl'
        >
          {renderInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      )
      continue
    }

    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h3
          key={`h3-${elements.length}`}
          className='mt-3 mb-1.5 text-base font-bold text-foreground'
        >
          {renderInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      )
      continue
    }

    if (trimmed.startsWith('#### ')) {
      flushList()
      elements.push(
        <h4
          key={`h4-${elements.length}`}
          className='mt-2.5 mb-1 text-sm font-semibold text-foreground'
        >
          {renderInline(trimmed.replace(/^####\s+/, ''))}
        </h4>
      )
      continue
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      flushList()
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className='my-3 border-s-4 border-primary/60 bg-primary/5 px-4 py-2.5 text-xs sm:text-sm text-foreground/85 rounded-e-xl italic'
        >
          {renderInline(trimmed.replace(/^>\s?/, ''))}
        </blockquote>
      )
      continue
    }

    // Unordered list
    const ulMatch = trimmed.match(/^[-*•]\s+(.*)$/)
    if (ulMatch) {
      if (!listBuffer || listBuffer.type !== 'ul') {
        flushList()
        listBuffer = { type: 'ul', items: [] }
      }
      listBuffer.items.push(ulMatch[1])
      continue
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/)
    if (olMatch) {
      if (!listBuffer || listBuffer.type !== 'ol') {
        flushList()
        listBuffer = { type: 'ol', items: [] }
      }
      listBuffer.items.push(olMatch[1])
      continue
    }

    // Normal paragraph
    flushList()
    elements.push(
      <p
        key={`p-${elements.length}`}
        className='my-2 text-xs sm:text-sm leading-relaxed text-muted-foreground'
      >
        {renderInline(trimmed)}
      </p>
    )
  }

  // Flush remaining buffers
  flushCodeBlock()
  flushList()

  return <div className={cn('markdown-body font-sans', className)}>{elements}</div>
}
