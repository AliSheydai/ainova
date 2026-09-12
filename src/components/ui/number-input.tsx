'use client'

import * as React from 'react'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NumberInputProps
  extends Omit<React.ComponentProps<'input'>, 'type'> {
  containerClassName?: string
  inputClassName?: string
  hideStepper?: boolean
  onValueChange?: (value: number | undefined) => void
}

/**
 * Dispatches input and change events that trigger React's synthetic event system
 * on controlled inputs.
 */
function setNativeInputValue(element: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set
  const prototype = Object.getPrototypeOf(element)
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value)
  } else if (valueSetter) {
    valueSetter.call(element, value)
  } else {
    element.value = value
  }

  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      containerClassName,
      inputClassName,
      hideStepper = false,
      onValueChange,
      min,
      max,
      step,
      disabled,
      readOnly,
      placeholder,
      value,
      defaultValue,
      onChange,
      dir,
      ...props
    },
    ref
  ) => {
    const innerRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement)

    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

    const stepValue = React.useCallback(
      (direction: 'up' | 'down') => {
        const input = innerRef.current
        if (!input || input.disabled || input.readOnly) return

        const rawVal = input.value.trim()
        const stepNum = Number(step) || 1
        const minNum = min !== undefined && min !== '' ? Number(min) : undefined
        const maxNum = max !== undefined && max !== '' ? Number(max) : undefined

        let currentNum: number
        if (rawVal === '') {
          if (direction === 'up') {
            currentNum = minNum !== undefined && minNum > 0 ? minNum : stepNum
          } else {
            currentNum = minNum !== undefined ? minNum : -stepNum
          }
        } else {
          currentNum = Number(rawVal)
          if (isNaN(currentNum)) {
            currentNum = minNum !== undefined ? minNum : 0
          } else {
            currentNum = direction === 'up' ? currentNum + stepNum : currentNum - stepNum
          }
        }

        // Handle floating precision if step is decimal
        const stepDecimals = stepNum.toString().split('.')[1]?.length || 0
        if (stepDecimals > 0) {
          currentNum = Number(currentNum.toFixed(stepDecimals))
        }

        if (minNum !== undefined && currentNum < minNum) {
          currentNum = minNum
        }
        if (maxNum !== undefined && currentNum > maxNum) {
          currentNum = maxNum
        }

        setNativeInputValue(input, String(currentNum))
        onValueChange?.(currentNum)
      },
      [min, max, step, onValueChange]
    )

    const stopPress = React.useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, [])

    const startPress = React.useCallback(
      (direction: 'up' | 'down') => {
        stopPress()
        stepValue(direction)

        timerRef.current = setTimeout(() => {
          intervalRef.current = setInterval(() => {
            stepValue(direction)
          }, 70)
        }, 300)
      },
      [stepValue, stopPress]
    )

    // Cleanup timers on unmount
    React.useEffect(() => {
      return () => {
        stopPress()
      }
    }, [stopPress])

    if (hideStepper) {
      return (
        <input
          ref={innerRef}
          type='number'
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          dir={dir || 'ltr'}
          className={cn(
            'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-xs sm:text-sm shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-xs sm:placeholder:text-sm placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
            className
          )}
          {...props}
        />
      )
    }

    const numVal =
      value !== undefined && value !== ''
        ? Number(value)
        : undefined
    const isAtMin =
      min !== undefined && min !== '' && numVal !== undefined && !isNaN(numVal) && numVal <= Number(min)
    const isAtMax =
      max !== undefined && max !== '' && numVal !== undefined && !isNaN(numVal) && numVal >= Number(max)

    return (
      <div
        data-slot='number-input-wrapper'
        dir='rtl'
        style={{ direction: 'rtl' }}
        className={cn(
          'group relative flex items-center w-full min-w-0 overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow]',
          'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30',
          disabled && 'pointer-events-none opacity-50 cursor-not-allowed',
          containerClassName,
          className
        )}
      >
        {/* Right Button: Plus (+) in RTL layout */}
        <button
          type='button'
          tabIndex={-1}
          disabled={disabled || readOnly || isAtMax}
          onMouseDown={(e) => {
            if (e.button !== 0) return
            e.preventDefault()
            startPress('up')
          }}
          onMouseUp={stopPress}
          onMouseLeave={stopPress}
          onTouchStart={() => startPress('up')}
          onTouchEnd={stopPress}
          onTouchCancel={stopPress}
          aria-label='افزایش مقدار'
          title='افزایش'
          className={cn(
            'flex items-center justify-center h-full w-9 sm:w-10 text-muted-foreground hover:text-foreground hover:bg-muted/60 active:bg-muted active:scale-95 transition-all select-none shrink-0 border-e border-border/50 cursor-pointer',
            'disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed'
          )}
        >
          <Plus className='size-3.5 sm:size-4 stroke-[2.25]' />
        </button>

        {/* Center: Numeric Input */}
        <input
          ref={innerRef}
          type='number'
          data-slot='input'
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          dir={dir || 'ltr'}
          className={cn(
            'flex-1 min-w-0 h-full w-full bg-transparent px-2 text-center text-xs sm:text-sm font-mono outline-none',
            '!border-0 !shadow-none !ring-0 !outline-none disabled:cursor-not-allowed placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
            inputClassName
          )}
          {...props}
        />

        {/* Left Button: Minus (-) in RTL layout */}
        <button
          type='button'
          tabIndex={-1}
          disabled={disabled || readOnly || isAtMin}
          onMouseDown={(e) => {
            if (e.button !== 0) return
            e.preventDefault()
            startPress('down')
          }}
          onMouseUp={stopPress}
          onMouseLeave={stopPress}
          onTouchStart={() => startPress('down')}
          onTouchEnd={stopPress}
          onTouchCancel={stopPress}
          aria-label='کاهش مقدار'
          title='کاهش'
          className={cn(
            'flex items-center justify-center h-full w-9 sm:w-10 text-muted-foreground hover:text-foreground hover:bg-muted/60 active:bg-muted active:scale-95 transition-all select-none shrink-0 border-s border-border/50 cursor-pointer',
            'disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed'
          )}
        >
          <Minus className='size-3.5 sm:size-4 stroke-[2.25]' />
        </button>
      </div>
    )
  }
)

NumberInput.displayName = 'NumberInput'

export { NumberInput }
