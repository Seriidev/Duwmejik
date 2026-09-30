import type { Orientation } from '@/types'
import { cn } from '@/lib/cn'

export function aspectClass(orientation: Orientation) {
  if (orientation === 'portrait') return 'aspect-[3/4]'
  if (orientation === 'square') return 'aspect-square'
  return 'aspect-[4/3]'
}

export function TemplateArt({
  categoryId,
  accent,
  seed,
  className,
  background,
}: {
  categoryId: string
  accent: string
  seed: number
  className?: string
  background?: string
}) {
  const tilt = (seed % 7) - 3
  return (
    <div
      className={cn('relative block w-full overflow-hidden', className)}
      style={{
        backgroundImage:
          background ??
          `linear-gradient(150deg, ${accent} 0%, #ffffff 58%), radial-gradient(circle at 88% 12%, ${accent}, transparent 42%)`,
      }}
    >
      <ArtShape categoryId={categoryId} accent={accent} tilt={tilt} />
    </div>
  )
}

function ArtShape({ categoryId, accent, tilt }: { categoryId: string; accent: string; tilt: number }) {
  if (categoryId === 'mugs') {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-28 w-24 rounded-b-[2rem] rounded-t-xl bg-white shadow-lg">
          <div className="absolute inset-x-3 top-4 h-10 rounded-lg" style={{ background: accent }} />
          <div className="absolute -right-3 top-6 h-10 w-4 rounded-r-full border-4 border-white" />
        </div>
      </div>
    )
  }

  if (categoryId === 'pens') {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <div className="h-4 w-40 rotate-[-18deg] rounded-full bg-white shadow-md">
          <div className="h-full w-16 rounded-l-full" style={{ background: accent }} />
        </div>
      </div>
    )
  }

  if (categoryId === 'books' || categoryId === 'notebooks') {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex h-36 w-28 overflow-hidden rounded-r-xl bg-white shadow-lg" style={{ transform: `rotate(${tilt}deg)` }}>
          <div className="w-3" style={{ background: accent }} />
          <div className="flex-1 p-3">
            <div className="mb-2 h-2 w-3/4 rounded-full" style={{ background: accent }} />
            <div className="mb-1 h-1.5 w-full rounded-full bg-slate-200" />
            <div className="h-1.5 w-2/3 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    )
  }

  if (categoryId === 'banners') {
    return (
      <div className="absolute inset-6 grid content-center rounded-2xl bg-white/90 p-4 shadow-sm">
        <div className="mb-3 h-4 w-2/3 rounded-full" style={{ background: accent }} />
        <div className="h-2 w-1/2 rounded-full bg-slate-200" />
      </div>
    )
  }

  if (categoryId === 'stickers') {
    return (
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid grid-cols-2 gap-2" style={{ transform: `rotate(${tilt}deg)` }}>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="size-10 rounded-full bg-white shadow" style={{ outline: `6px solid ${accent}` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 p-3 shadow-sm"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="mb-2 h-2.5 rounded-full" style={{ width: `${55 + (tilt + 3) * 6}%`, background: accent }} />
      <div className="mb-1.5 h-1.5 w-full rounded-full bg-slate-200" />
      <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
    </div>
  )
}
