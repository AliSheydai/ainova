import React from 'react'
import {
  CreditCard,
  Plus,
  Sparkles,
  Mail,
  Phone,
  FileText,
  Info,
  ArrowUp,
  ArrowDown,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type CheckoutFieldDefinition } from '@/lib/fulfillment/types'

interface CheckoutFieldEditorProps {
  fields: CheckoutFieldDefinition[]
  onChange: (fields: CheckoutFieldDefinition[]) => void
}

export function CheckoutFieldEditor({ fields, onChange }: CheckoutFieldEditorProps) {
  const handleAddField = () => {
    const nextOrder = fields.length + 1
    const newField: CheckoutFieldDefinition = {
      key: `field_${nextOrder}`,
      label: `فیلد جدید ${nextOrder}`,
      type: 'text',
      required: true,
      placeholder: '',
      order: nextOrder,
    }
    onChange([...fields, newField])
  }

  const handleAddPresetField = (presetType: 'email' | 'phone' | 'note') => {
    let preset: CheckoutFieldDefinition | null = null
    const nextOrder = fields.length + 1

    if (presetType === 'email') {
      preset = {
        key: 'email',
        label: 'ایمیل گوگل شما',
        type: 'email',
        required: true,
        placeholder: 'username@gmail.com',
        order: nextOrder,
      }
    } else if (presetType === 'phone') {
      preset = {
        key: 'phone',
        label: 'شماره تماس هماهنگی',
        type: 'phone',
        required: true,
        placeholder: '09123456789',
        order: nextOrder,
      }
    } else if (presetType === 'note') {
      preset = {
        key: 'order_note',
        label: 'توضیحات و یادداشت سفارش',
        type: 'textarea',
        required: false,
        placeholder: 'توضیحات اختیاری...',
        order: nextOrder,
      }
    }

    if (preset) {
      const exists = fields.some((f) => f.key === preset.key)
      const fieldToAdd: CheckoutFieldDefinition = exists
        ? { ...preset, key: `${preset.key}_${Date.now().toString().slice(-4)}` }
        : preset
      onChange([...fields, fieldToAdd])
    }
  }

  const handleUpdateField = (index: number, updates: Partial<CheckoutFieldDefinition>) => {
    const next = [...fields]
    next[index] = { ...next[index], ...updates }
    onChange(next)
  }

  const handleRemoveField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= fields.length) return
    const next = [...fields]
    const temp = next[index]
    next[index] = next[targetIndex]
    next[targetIndex] = temp
    onChange(next.map((item, idx) => ({ ...item, order: idx + 1 })))
  }

  return (
    <div className='bg-card rounded-2xl border border-border/70 p-3 sm:p-5 shadow-xs space-y-3 min-w-0 w-full'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/40 min-w-0 w-full'>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-1.5 flex-wrap'>
            <CreditCard className='size-4 text-primary shrink-0' />
            <span className='text-xs font-bold text-foreground break-words'>
              اطلاعات تسویه‌حساب (Checkout Fields)
            </span>
            <Badge variant='secondary' className='text-[10px] font-mono shrink-0'>
              {fields.length} فیلد
            </Badge>
          </div>
          <span className='text-[10px] sm:text-[11px] text-muted-foreground block mt-0.5 leading-relaxed break-words'>
            فیلدهایی که خریدار حین پرداخت پر می‌کند (ایمیل، شماره تماس و...)
          </span>
        </div>

        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={handleAddField}
          className='h-8 px-3 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 rounded-xl font-semibold w-full sm:w-auto shrink-0 justify-center'
        >
          <Plus className='size-3.5' />
          <span>افزودن فیلد سفارشی</span>
        </Button>
      </div>

      {/* Preset Shortcuts */}
      <div className='flex items-center gap-1 sm:gap-1.5 flex-wrap p-2 rounded-xl bg-muted/30 border border-border/40 min-w-0 w-full overflow-hidden'>
        <span className='text-[10px] sm:text-[10.5px] font-medium text-muted-foreground flex items-center gap-1 shrink-0'>
          <Sparkles className='size-3 text-primary' />
          <span>سریع:</span>
        </span>
        <button
          type='button'
          onClick={() => handleAddPresetField('email')}
          className='inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[9.5px] sm:text-[10.5px] bg-background hover:bg-muted border border-border/60 text-foreground transition-all shadow-2xs shrink-0'
        >
          <Mail className='size-2.5 sm:size-3 text-blue-500 shrink-0' />
          <span>+ ایمیل</span>
        </button>
        <button
          type='button'
          onClick={() => handleAddPresetField('phone')}
          className='inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[9.5px] sm:text-[10.5px] bg-background hover:bg-muted border border-border/60 text-foreground transition-all shadow-2xs shrink-0'
        >
          <Phone className='size-2.5 sm:size-3 text-emerald-500 shrink-0' />
          <span>+ تماس</span>
        </button>
        <button
          type='button'
          onClick={() => handleAddPresetField('note')}
          className='inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[9.5px] sm:text-[10.5px] bg-background hover:bg-muted border border-border/60 text-foreground transition-all shadow-2xs shrink-0'
        >
          <FileText className='size-2.5 sm:size-3 text-purple-500 shrink-0' />
          <span>+ یادداشت</span>
        </button>
      </div>

      {/* Fields List */}
      {fields.length === 0 ? (
        <div className='p-4 sm:p-6 rounded-xl border border-dashed border-border/80 text-center bg-muted/20 space-y-1.5 min-w-0 w-full'>
          <Info className='size-5 text-muted-foreground mx-auto opacity-70' />
          <span className='text-xs font-semibold text-foreground block'>
            هیچ فیلد ورودی تعریف نشده است
          </span>
          <p className='text-[10.5px] sm:text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed break-words'>
            سفارش به‌صورت پرداخت سریع و بدون نیاز به فرم ثبت خواهد شد. برای دریافت ایمیل اکانت یا اطلاعات مشتری، از دکمه‌های بالا فیلد اضافه فرمایید.
          </p>
        </div>
      ) : (
        <div className='space-y-3 max-h-none sm:max-h-[360px] overflow-visible sm:overflow-y-auto touch-pan-y overscroll-contain min-w-0 w-full pe-0.5'>
          {fields.map((field, idx) => (
            <div
              key={idx}
              className='p-3 sm:p-3.5 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-all space-y-3 shadow-2xs min-w-0 w-full overflow-hidden'
            >
              {/* Field Item Header - Protected against overflow on small screens */}
              <div className='flex items-center justify-between gap-2 pb-2 border-b border-border/40 min-w-0 w-full'>
                <div className='flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden'>
                  <div className='size-5 rounded-md bg-muted text-foreground flex items-center justify-center font-mono text-[10px] font-bold shrink-0'>
                    {idx + 1}
                  </div>
                  <span className='text-xs font-bold text-foreground truncate'>
                    {field.label || 'فیلد بدون عنوان'}
                  </span>
                  {field.required && (
                    <Badge variant='destructive' className='text-[8.5px] px-1 py-0 shrink-0'>
                      الزامی
                    </Badge>
                  )}
                </div>

                <div className='flex items-center gap-0.5 shrink-0'>
                  {/* Reorder Buttons */}
                  <button
                    type='button'
                    disabled={idx === 0}
                    onClick={() => handleMoveField(idx, 'up')}
                    className='p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all'
                    title='انتقال به بالا'
                  >
                    <ArrowUp className='size-3.5' />
                  </button>
                  <button
                    type='button'
                    disabled={idx === fields.length - 1}
                    onClick={() => handleMoveField(idx, 'down')}
                    className='p-1 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all'
                    title='انتقال به پایین'
                  >
                    <ArrowDown className='size-3.5' />
                  </button>

                  <div className='h-3 w-px bg-border mx-0.5' />

                  {/* Delete Button */}
                  <button
                    type='button'
                    onClick={() => handleRemoveField(idx)}
                    className='p-1 rounded-md text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all'
                    title='حذف فیلد'
                  >
                    <Trash2 className='size-3.5' />
                  </button>
                </div>
              </div>

              {/* Field Properties Grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 min-w-0 w-full'>
                <div className='min-w-0 w-full'>
                  <span className='text-[11px] font-medium text-muted-foreground block mb-1'>
                    عنوان فارسی: <span className='text-rose-500'>*</span>
                  </span>
                  <Input
                    value={field.label}
                    onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                    placeholder='مثال: ایمیل اکانت'
                    className='text-xs h-8.5 rounded-lg w-full min-w-0'
                  />
                </div>

                <div className='min-w-0 w-full'>
                  <span className='text-[11px] font-medium text-muted-foreground block mb-1'>
                    کلید سیستمی (Key): <span className='text-rose-500'>*</span>
                  </span>
                  <Input
                    value={field.key}
                    onChange={(e) => handleUpdateField(idx, { key: e.target.value })}
                    placeholder='email'
                    className='text-xs h-8.5 rounded-lg font-mono w-full min-w-0'
                    dir='ltr'
                  />
                </div>

                <div className='min-w-0 w-full'>
                  <span className='text-[11px] font-medium text-muted-foreground block mb-1'>
                    نوع داده ورودی:
                  </span>
                  <Select
                    value={field.type}
                    onValueChange={(val) => handleUpdateField(idx, { type: val as CheckoutFieldDefinition['type'] })}
                  >
                    <SelectTrigger className='h-8.5 text-xs rounded-lg w-full min-w-0 max-w-full overflow-hidden'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='text'>متن تک خطی (Text)</SelectItem>
                      <SelectItem value='email'>آدرس ایمیل (Email)</SelectItem>
                      <SelectItem value='phone'>شماره تماس (Phone)</SelectItem>
                      <SelectItem value='textarea'>متن چند خطی (Textarea)</SelectItem>
                      <SelectItem value='number'>عدد (Number)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='min-w-0 w-full'>
                  <span className='text-[11px] font-medium text-muted-foreground block mb-1'>
                    متن راهنما (Placeholder):
                  </span>
                  <Input
                    value={field.placeholder || ''}
                    onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                    placeholder='مثال: user@gmail.com'
                    className='text-xs h-8.5 rounded-lg w-full min-w-0'
                  />
                </div>
              </div>

              {/* Field Options / Toggles */}
              <div className='flex items-center gap-2 pt-1'>
                <Checkbox
                  id={`field-req-${idx}`}
                  checked={field.required}
                  onCheckedChange={(checked) =>
                    handleUpdateField(idx, { required: Boolean(checked) })
                  }
                />
                <label
                  htmlFor={`field-req-${idx}`}
                  className='text-[11px] text-muted-foreground cursor-pointer select-none font-medium'
                >
                  پر کردن این فیلد توسط مشتری اجباری است
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
