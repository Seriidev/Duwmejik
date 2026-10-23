import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    let stopped = false
    const show = () => {
      if (stopped) return
      const rect = node.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.86 && rect.bottom > 32) {
        stopped = true
        setShown(true)
        window.removeEventListener('scroll', show)
        window.removeEventListener('resize', show)
      }
    }
    show()
    window.addEventListener('scroll', show, { passive: true })
    window.addEventListener('resize', show)
    return () => {
      stopped = true
      window.removeEventListener('scroll', show)
      window.removeEventListener('resize', show)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn('reveal', className)}
      data-shown={shown ? 'true' : 'false'}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  )
}
