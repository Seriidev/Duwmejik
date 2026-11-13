'use client'

import { useEffect, useState } from 'react'
import { getFile } from '@/lib/fileVault'
import { cn } from '@/lib/cn'
import { defaultHero, type HeroSettings } from '@/store/usePlatformStore'

export function useMediaUrl(id: string | null) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!id) {
      setUrl(null)
      return
    }
    let cancelled = false
    let current = ''
    getFile(id).then((blob) => {
      if (cancelled || !blob) return
      current = URL.createObjectURL(blob)
      setUrl(current)
    })
    return () => {
      cancelled = true
      if (current) URL.revokeObjectURL(current)
    }
  }, [id])
  return url
}

export function HeroBackdrop({ hero }: { hero: HeroSettings }) {
  if (hero.kind === 'image') return <HeroImage hero={hero} />
  if (hero.kind === 'slider' && hero.slides.length > 0) return <HeroSlider hero={hero} />
  return <HeroVideo hero={hero} />
}

function HeroVideo({ hero }: { hero: HeroSettings }) {
  const custom = useMediaUrl(hero.kind === 'video' ? hero.mediaId : null)
  return (
    <video
      key={custom ?? '/hero.mp4'}
      className="absolute inset-0 h-full w-full object-cover"
      src={custom ?? '/hero.mp4'}
      autoPlay={hero.autoplay}
      muted={hero.muted}
      loop={hero.loop}
      playsInline
      aria-hidden="true"
    />
  )
}

function HeroImage({ hero }: { hero: HeroSettings }) {
  const url = useMediaUrl(hero.mediaId)
  if (!url) return <HeroVideo hero={defaultHero} />
  return <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
}

function HeroSlider({ hero }: { hero: HeroSettings }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!hero.autoplay || hero.slides.length < 2) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % hero.slides.length), 4000)
    return () => window.clearInterval(timer)
  }, [hero.autoplay, hero.slides.length])
  const active = hero.slides[index] ?? hero.slides[0]
  return (
    <>
      {hero.slides.map((slide) => (
        <Slide key={slide.id} id={slide.id} active={slide.id === active?.id} />
      ))}
    </>
  )
}

function Slide({ id, active }: { id: string; active: boolean }) {
  const url = useMediaUrl(id)
  if (!url) return null
  return <img src={url} alt="" className={cn('absolute inset-0 h-full w-full object-cover', !active && 'invisible')} />
}
