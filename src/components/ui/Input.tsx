import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const field =
  'w-full rounded-xl border border-line bg-card px-3 text-ink outline-none ring-violet-500/30 placeholder:text-muted focus:ring-2'

export function Input({
  label,
  className,
  ...props
}: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5 text-sm">
      {label && <span className="font-medium text-ink">{label}</span>}
      <input className={cn(field, 'h-11', className)} {...props} />
    </label>
  )
}

export function TextArea({
  label,
  className,
  ...props
}: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="grid gap-1.5 text-sm">
      {label && <span className="font-medium text-ink">{label}</span>}
      <textarea className={cn(field, 'min-h-28 py-3', className)} {...props} />
    </label>
  )
}

export function Select({
  label,
  className,
  children,
  ...props
}: { label?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="grid gap-1.5 text-sm">
      {label && <span className="font-medium text-ink">{label}</span>}
      <select className={cn(field, 'h-11', className)} {...props}>
        {children}
      </select>
    </label>
  )
}
