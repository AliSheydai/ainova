'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckoutFieldDefinition } from '@/lib/fulfillment/types'

interface DynamicCheckoutFormProps {
  fields: CheckoutFieldDefinition[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  disabled?: boolean
  errors?: Record<string, string>
}

export function DynamicCheckoutForm({
  fields,
  values,
  onChange,
  disabled = false,
  errors = {},
}: DynamicCheckoutFormProps) {
  if (!fields || fields.length === 0) {
    return null
  }

  // Sort fields by order
  const sortedFields = [...fields].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className='space-y-4 text-start' dir='rtl'>
      <div className='text-xs font-semibold text-muted-foreground mb-1'>
        اطلاعات موردنیاز برای فعال‌سازی و تحویل:
      </div>

      {sortedFields.map((field) => {
        const value = values[field.key] || ''
        const error = errors[field.key]

        return (
          <div key={field.key} className='space-y-1.5'>
            <label className='text-xs font-medium text-foreground flex items-center gap-1'>
              <span>{field.label}</span>
              {field.required && <span className='text-rose-500 font-bold'>*</span>}
            </label>

            {field.type === 'textarea' ? (
              <Textarea
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder || `لطفاً ${field.label} را وارد نمایید...`}
                disabled={disabled}
                rows={3}
                className={`text-xs resize-none ${error ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
              />
            ) : field.type === 'email' ? (
              <Input
                type='email'
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder || 'example@gmail.com'}
                disabled={disabled}
                dir='ltr'
                className={`text-xs h-10 font-mono ${error ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
              />
            ) : field.type === 'phone' ? (
              <Input
                type='tel'
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder || '0912xxxxxxx'}
                disabled={disabled}
                dir='ltr'
                className={`text-xs h-10 font-mono ${error ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
              />
            ) : field.type === 'number' ? (
              <Input
                type='number'
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder || '0'}
                disabled={disabled}
                dir='ltr'
                className={`text-xs h-10 font-mono ${error ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
              />
            ) : (
              <Input
                type='text'
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder || `${field.label}...`}
                disabled={disabled}
                className={`text-xs h-10 ${error ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
              />
            )}

            {error && <p className='text-[11px] text-rose-500 font-medium'>{error}</p>}
          </div>
        )
      })}
    </div>
  )
}
