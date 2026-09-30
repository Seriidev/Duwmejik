import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

export function Modal({
  open,
  title,
  onClose,
  wide = false,
  bare = false,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  wide?: boolean
  bare?: boolean
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/55" aria-label="Закрыть" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`relative z-10 max-h-[92vh] w-full overflow-auto rounded-[28px] border border-line bg-card shadow-2xl ${bare ? 'p-3 sm:p-4' : 'p-5 sm:p-7'} ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}
      >
        {bare ? (
          <h2 id="dialog-title" className="sr-only">
            {title}
          </h2>
        ) : (
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="dialog-title" className="text-xl font-semibold tracking-tight">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-soft" aria-label="Закрыть окно">
              <X className="size-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
