'use client'

import { useEffect, useState } from 'react'
import { useMediaUrl } from '@/features/platform/HeroBackdrop'
import { cn } from '@/lib/cn'

export function ProductBanner({ slides }: { slides: { id: string; code: string }[] }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (slides.length < 2) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 4000)
    return () => window.clearInterval(timer)
  }, [slides.length])
  const current = slides[Math.min(index, slides.length - 1)]
  if (!current) return null

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] bg-[#E6E7EB] sm:aspect-[32/10]">
      {slides.map((slide) => (
        <Frame key={slide.id} id={slide.id} active={slide.id === current.id} />
      ))}
      {current.code && <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-950">{current.code}</span>}
    </div>
  )
}

function Frame({ id, active }: { id: string; active: boolean }) {
  const url = useMediaUrl(id)
  if (!url) return null
  return <img src={url} alt="" className={cn('absolute inset-0 h-full w-full object-cover', !active && 'invisible')} />
}
