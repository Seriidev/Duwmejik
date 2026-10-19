'use client'

import { Check, ChevronDown, MoreHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useLocaleStore, type Locale } from '@/store/useLocaleStore'

const languages: { id: Locale; code: string; label: string }[] = [
  { id: 'ru', code: 'RU', label: 'Русский' },
  { id: 'en', code: 'EN', label: 'English' },
  { id: 'tk', code: 'TK', label: 'Türkmençe' },
]

export function LanguageMenu({ direction = 'down', trigger = 'pill' }: { direction?: 'up' | 'down'; trigger?: 'pill' | 'dots' }) {
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = languages.find((item) => item.id === locale) ?? languages[0]

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div
          className={cn(
            'absolute z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.14)]',
            trigger === 'dots'
              ? 'bottom-full right-0 mb-2 w-56'
              : direction === 'up'
                ? 'bottom-full left-0 mb-2 w-full'
                : 'top-full right-0 mt-2 w-56',
          )}
        >
          {languages.map((item) => {
            const active = item.id === locale
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setLocale(item.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex h-11 w-full items-center gap-3 px-4 text-left text-sm',
                  active ? 'bg-blue-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                <span className="w-7 shrink-0 text-xs font-semibold tracking-wide text-slate-400">{item.code}</span>
                <span className="min-w-0 flex-1 font-medium">{item.label}</span>
                {active && <Check className="size-4 shrink-0 text-blue-600" />}
              </button>
            )
          })}
        </div>
      )}
      {trigger === 'dots' ? (
        <button
          type="button"
          aria-label="Language"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <MoreHorizontal className="size-5" />
        </button>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 text-sm font-semibold tracking-wide text-slate-800"
        >
          {current.code}
          <ChevronDown className={cn('size-4 text-slate-500 transition duration-200', open && 'rotate-180')} />
        </button>
      )}
    </div>
  )
}
