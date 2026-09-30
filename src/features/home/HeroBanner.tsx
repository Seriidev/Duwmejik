import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

const bannerUrls = Object.values(
  import.meta.glob('../../assets/banners/*.{png,jpg,jpeg,webp,avif}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)

export const hasHeroBanner = bannerUrls.length > 0

export function HeroBanner() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (bannerUrls.length < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % bannerUrls.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="relative min-h-[280px] w-full sm:min-h-[380px] lg:min-h-[460px]">
      {bannerUrls.map((src, imageIndex) => (
        <img
          key={src}
          src={src}
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full rounded-[32px] object-cover shadow-[0_30px_80px_rgba(79,109,184,0.22)] transition-opacity duration-700',
            imageIndex === index ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
    </div>
  )
}
