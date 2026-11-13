'use client'

import Link from 'next/link'
import { activeMarks, bestLabel, useBestStore } from '@/store/useBestStore'

export function BestOnHome() {
  const marks = useBestStore((state) => state.marks)
  const shown = activeMarks(marks).filter((item) => item.showOnHome)
  if (shown.length === 0) return null
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      {shown.map((item) => (
        <Link key={item.designerId} href={`/designer/${item.designerId}`} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-950 shadow-[0_8px_24px_rgba(20,24,40,0.06)]">
          <span className="grid size-6 place-items-center rounded-full bg-[#6d3ef2] text-[11px] text-white">{item.name.slice(0, 1)}</span>
          {item.name}
          <span className="text-xs font-medium text-[#6d3ef2]">{bestLabel(item.term)}</span>
        </Link>
      ))}
    </div>
  )
}

export function BestBadge({ designerId }: { designerId: string }) {
  const marks = useBestStore((state) => state.marks)
  const mark = activeMarks(marks).find((item) => item.designerId === designerId && item.badge)
  if (!mark) return null
  return <span className="mt-2 inline-flex rounded-full bg-[#efe9ff] px-2.5 py-1 text-xs font-semibold text-[#4f26c9]">{bestLabel(mark.term)}</span>
}
