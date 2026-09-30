import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const tones = {
  neutral: 'bg-soft text-ink',
  free: 'bg-emerald-100 text-emerald-800',
  premium: 'bg-violet-100 text-violet-800',
  pending: 'bg-amber-100 text-amber-900',
  ok: 'bg-emerald-100 text-emerald-800',
  bad: 'bg-rose-100 text-rose-800',
  info: 'bg-sky-100 text-sky-900',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: keyof typeof tones
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}

export function PriceBadge({ price }: { price: number }) {
  if (price === 0) return <Badge tone="free">Бесплатно</Badge>
  return <Badge tone="premium">Премиум</Badge>
}
