'use client'

import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

type Option = { value: string; label: string }

function normalize(options: readonly (string | Option)[]): Option[] {
  return options.map((item) => (typeof item === 'string' ? { value: item, label: item } : item))
}

export function SmoothSelect({
  value,
  options,
  onChange,
  disabled,
  className,
  ariaLabel,
  placeholder,
}: {
  value: string
  options: readonly (string | Option)[]
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
  placeholder?: string
}) {
  const items = normalize(options)
  const selected = items.find((item) => item.value === value)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-left text-sm text-slate-800 disabled:opacity-60"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={cn('truncate', !selected && 'text-slate-400')}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-slate-400 transition duration-300', open && 'rotate-180')} />
      </button>
      <div
        className={cn(
          'absolute top-full z-30 -mt-px w-full origin-top overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition duration-300',
          open ? 'pointer-events-auto scale-y-100 opacity-100' : 'pointer-events-none scale-y-95 opacity-0',
        )}
      >
        {items.map((item) => {
          const active = item.value === selected?.value
          return (
            <button
              key={item.value}
              type="button"
              className={cn(
                'block w-full px-4 py-2.5 text-left text-sm transition',
                active ? 'bg-blue-600 text-white' : 'text-slate-800 hover:bg-blue-50',
              )}
              onClick={() => {
                onChange(item.value)
                setOpen(false)
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
