import type { ReactNode } from 'react'

export function Gate({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      {action && <div className="mt-6 flex justify-center gap-3">{action}</div>}
    </div>
  )
}
