'use client'

import { Eye, EyeOff } from 'lucide-react'
import { Children, isValidElement, useState, type ChangeEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { SmoothSelect } from '@/components/ui/SmoothSelect'

const field =
  'w-full rounded-xl border border-line bg-card px-3 text-ink outline-none ring-blue-500/30 placeholder:text-muted focus:ring-2'

export function Input({
  label,
  className,
  type,
  reveal,
  ...props
}: { label?: string; reveal?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false)
  const inputType = reveal && type === 'password' && shown ? 'text' : type
  return (
    <label className="grid gap-1.5 text-sm">
      {label && <span className="font-medium text-ink">{label}</span>}
      <span className="relative">
        <input className={cn(field, 'h-11', reveal && 'pr-11', className)} type={inputType} {...props} />
        {reveal && (
          <button
            type="button"
            aria-label={shown ? 'Скрыть пароль' : 'Показать пароль'}
            onClick={() => setShown((current) => !current)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </span>
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
  placeholder,
  'aria-label': ariaLabel,
}: { label?: string; placeholder?: string } & SelectHTMLAttributes<HTMLSelectElement>) {
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
        placeholder={placeholder}
        options={options}
        onChange={(next) => onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>)}
      />
    </label>
  )
}
