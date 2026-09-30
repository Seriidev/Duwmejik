import { cn } from '@/lib/cn'

export function SectionHeading({
  eyebrow,
  title,
  text,
  className,
}: {
  eyebrow?: string
  title: string
  text?: string
  className?: string
}) {
  return (
    <div className={cn('max-w-2xl', className ?? 'mb-8')}>
      {eyebrow && <p className="mb-2 text-sm font-semibold text-violet-600">{eyebrow}</p>}
      <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
      {text && <p className="mt-2 text-muted">{text}</p>}
    </div>
  )
}
