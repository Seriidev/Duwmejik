'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function useSavedNotice() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!tick) return
    const timer = window.setTimeout(() => setTick(0), 2400)
    return () => window.clearTimeout(timer)
  }, [tick])
  return { open: tick > 0, show: () => setTick((value) => value + 1) }
}

export function SavedNotice({ open, text = 'Публикация сохранена' }: { open: boolean; text?: string }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!open || !mounted) return null
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4">
      <p
        role="status"
        className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.28)]"
      >
        {text}
      </p>
    </div>,
    document.body,
  )
}
