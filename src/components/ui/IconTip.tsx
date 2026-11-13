import { cn } from '@/lib/cn'

export function IconTip({ label, side }: { label: string; side: 'left' | 'right' | 'up' }) {
  return (
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover/tip:opacity-100',
        side === 'right' && 'left-[calc(100%+8px)] top-1/2 -translate-y-1/2',
        side === 'left' && 'right-[calc(100%+8px)] top-1/2 -translate-y-1/2',
        side === 'up' && 'bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2',
      )}
    >
      {label}
    </span>
  )
}
