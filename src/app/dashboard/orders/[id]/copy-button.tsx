'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('لینک فعال‌سازی با موفقیت کپی شد.')
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 text-xs h-9"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-primary" />
          کپی شد
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          کپی لینک
        </>
      )}
    </Button>
  )
}
