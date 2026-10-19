'use client'

import { Children, isValidElement, type ChangeEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { SmoothSelect } from '@/components/ui/SmoothSelect'

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
  children,
  value,
  onChange,
  disabled,
  'aria-label': ariaLabel,
}: { label?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  const options = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; children?: ReactNode }>(child)) return []
    const optionValue = String(child.props.value ?? child.props.children ?? '')
    const optionLabel = String(child.props.children ?? optionValue)
    return [{ value: optionValue, label: optionLabel }]
  })
  return (
    <label className="grid gap-1.5 text-sm">
      {label && <span className="font-medium text-ink">{label}</span>}
      <SmoothSelect
        ariaLabel={ariaLabel}
        disabled={disabled}
        value={String(value ?? '')}
        options={options}
        onChange={(next) => onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>)}
      />
    </label>
  )
}
