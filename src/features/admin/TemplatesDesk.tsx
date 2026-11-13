'use client'

import { ChevronDown, Download } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { TemplateArt } from '@/components/TemplateArt'
import { cn } from '@/lib/cn'
import { SERVICE_ORDER, SERVICES } from '@/features/orders/pricing'
import type { Category, Product, ProductStatus, ServiceType } from '@/types'

const CATEGORY_SERVICE: Record<string, ServiceType> = {
  cards: 'print',
  brochures: 'print',
  books: 'print',
  forms: 'print',
  flyers: 'print',
  postcards: 'print',
  banners: 'graphic',
  packaging: 'graphic',
  stickers: 'graphic',
  mugs: 'souvenir',
  pens: 'souvenir',
  notebooks: 'souvenir',
}

const GROUPS: { id: ProductStatus; label: string }[] = [
  { id: 'pending', label: 'На проверке' },
  { id: 'published', label: 'Опубликованы' },
  { id: 'rejected', label: 'Отклонены' },
]

export function TemplatesDesk({
  products,
  categories,
  focus,
  onCreate,
  onEdit,
  onRemove,
  onDecide,
}: {
  products: Product[]
  categories: Category[]
  focus: ProductStatus | 'all'
  onCreate: () => void
  onEdit: (product: Product) => void
  onRemove: (id: string) => void
  onDecide: (product: Product, verdict: 'accepted' | 'rejected', categoryId: string, message: string) => void | false
}) {
  const [group, setGroup] = useState<ProductStatus>(focus === 'all' ? 'pending' : focus)
  const [openedId, setOpenedId] = useState<string | null>(null)
  const todayTitle = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).replace(' г.', '')
  const opened = products.find((item) => item.id === openedId) ?? null
  const visible = products.filter((item) => item.status === group)

  useEffect(() => {
    if (focus !== 'all') setGroup(focus)
  }, [focus])

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Шаблоны</h1>
          <p className="mt-1 text-sm text-neutral-400">Проверяйте работы и выбирайте категорию перед публикацией.</p>
        </div>
        <p className="pb-1 text-sm text-neutral-400">{todayTitle}</p>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex flex-wrap gap-1 rounded-xl bg-white p-1">
          {GROUPS.map((item) => {
            const count = products.filter((product) => product.status === item.id).length
            const active = group === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setGroup(item.id)}
                className={cn('rounded-lg px-3 py-1.5 text-sm', active ? 'bg-[#5b4dff] font-medium text-white' : 'text-neutral-600 hover:bg-neutral-50')}
              >
                {item.label} · {count}
              </button>
            )
          })}
        </div>
        <button type="button" onClick={onCreate} className="ml-auto h-9 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-medium hover:bg-neutral-50">
          Добавить
        </button>
      </div>
      <section className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {visible.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-neutral-400">В этом разделе работ нет.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-neutral-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Название</th>
                  <th className="px-3 py-4 font-medium">Автор</th>
                  <th className="px-3 py-4 font-medium">Категория</th>
                  <th className="px-5 py-4 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => {
                  const category = categories.find((item) => item.id === product.categoryId)
                  return (
                    <tr key={product.id} onClick={() => setOpenedId(product.id)} className="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50">
                      <td className="px-5 py-4 font-medium text-[#5b4dff]">{product.title}</td>
                      <td className="px-3 py-4">{shortName(product.author)}</td>
                      <td className="px-3 py-4 text-[#5b4dff]">{category?.title ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', statusTone(product.status))}>
                          {statusText(product.status)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-neutral-100 px-5 py-4 text-sm text-neutral-400">После одобрения работа появится в выбранной категории.</p>
      </section>
      <DeskDrawer open={Boolean(opened)} onClose={() => setOpenedId(null)}>
        {opened && (
          <DesignDetails
            key={opened.id}
            product={opened}
            categories={categories}
            onClose={() => setOpenedId(null)}
            onEdit={() => {
              onEdit(opened)
              setOpenedId(null)
            }}
            onRemove={() => {
              onRemove(opened.id)
              setOpenedId(null)
            }}
            onDecide={(verdict, categoryId, message) => {
              if (onDecide(opened, verdict, categoryId, message) !== false) setOpenedId(null)
            }}
          />
        )}
      </DeskDrawer>
    </div>
  )
}

function DesignDetails({
  product,
  categories,
  onClose,
  onEdit,
  onRemove,
  onDecide,
}: {
  product: Product
  categories: Category[]
  onClose: () => void
  onEdit: () => void
  onRemove: () => void
  onDecide: (verdict: 'accepted' | 'rejected', categoryId: string, message: string) => void
}) {
  const thumbs = (product.gallery ?? []).filter((item): item is string => Boolean(item)).slice(0, 4)
  const [picked, setPicked] = useState<string | null>(null)
  const [service, setService] = useState<ServiceType>(serviceOf(product.categoryId))
  const [categoryId, setCategoryId] = useState(categories.some((item) => item.id === product.categoryId) ? product.categoryId : '')
  const [message, setMessage] = useState('')
  const [needReason, setNeedReason] = useState(false)
  const pieces = categories.filter((item) => serviceOf(item.id) === service)
  const cover = picked || product.image || thumbs[0]
  const original = product.image && product.fileTypes.length > 0 ? product.image : ''

  function pickService(next: ServiceType) {
    setService(next)
    const available = categories.filter((item) => serviceOf(item.id) === next)
    if (!available.some((item) => item.id === categoryId)) setCategoryId(available[0]?.id ?? '')
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <h2 id="design-drawer-title" className="min-w-0 truncate text-[17px] font-bold text-neutral-950">
          {shortName(product.author)} <span className="text-[13px] font-medium">дизайнер</span>
        </h2>
        <span className={cn('inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium', product.status === 'pending' ? 'bg-[#e7f3ff] text-[#3b82f6]' : statusTone(product.status))}>
          {statusText(product.status)}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {cover ? (
          <img src={cover} alt="" className="aspect-[16/10] w-full rounded-xl object-cover" />
        ) : (
          <TemplateArt categoryId={product.categoryId} accent={product.accent} seed={product.seed} className="aspect-[16/10] w-full rounded-xl" />
        )}
        {thumbs.length > 0 && (
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {thumbs.map((src, index) => (
              <button key={`${src}-${index}`} type="button" onClick={() => setPicked(src)} className="aspect-[4/3] overflow-hidden rounded-lg">
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {original ? (
          <a href={original} download className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#e7eef6] px-4 py-3 text-[#6d86b3]">
            <span>
              <span className="block text-sm font-bold">Оригинальный файл</span>
              <span className="mt-0.5 block text-xs font-medium text-[#7d96bc]">Скачать и посмотреть</span>
            </span>
            <Download className="size-5 shrink-0" />
          </a>
        ) : (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#f6ecec] px-4 py-3 text-[#b56b6b]">
            <span>
              <span className="block text-sm font-bold">Оригинальный файл</span>
              <span className="mt-0.5 block text-xs font-medium">Исходный файл не приложен</span>
            </span>
            <Download className="size-5 shrink-0" />
          </div>
        )}
        <p className="mt-4 text-sm leading-6 text-neutral-950">
          <span className="font-bold">Название работы : </span>“{product.title}”
        </p>
        <p className="mt-1 text-sm leading-6 text-neutral-950">
          <span className="font-bold">Описание : </span>
          {product.description ? `«${product.description}»` : '—'}
        </p>
        <div className="mt-4 grid gap-3.5">
          <FieldSelect
            label="Категория работы"
            value={service}
            options={SERVICE_ORDER.map((id) => ({ id, title: SERVICES[id].title }))}
            onChange={(id) => pickService(id as ServiceType)}
          />
          <FieldSelect
            label="Изделие"
            value={categoryId}
            options={pieces.map((item) => ({ id: item.id, title: item.title }))}
            onChange={setCategoryId}
          />
        </div>
        <label className="mt-3.5 grid gap-2">
          <span className="text-sm font-bold text-[#5b4dff]">Комментарий дизайнеру</span>
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value)
              if (event.target.value.trim()) setNeedReason(false)
            }}
            placeholder="Укажите причину, если работа требует доработки"
            className={cn('min-h-[76px] resize-none rounded-xl bg-[#f4f5f7] px-3 py-2.5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400', needReason && 'ring-1 ring-rose-300')}
          />
          {needReason && <span className="text-xs text-rose-600">Напишите причину отказа. Дизайнер увидит её в уведомлении.</span>}
        </label>
      </div>
      <footer className="grid gap-2 px-4 pb-4">
        <div className="flex gap-2">
          {product.status !== 'published' && (
            <button
              type="button"
              disabled={!categoryId}
              onClick={() => onDecide('accepted', categoryId, message)}
              className="h-11 flex-1 rounded-xl bg-brand text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40"
            >
              Одобрить
            </button>
          )}
          {product.status !== 'rejected' && (
            <button
              type="button"
              onClick={() => {
                if (!message.trim()) {
                  setNeedReason(true)
                  return
                }
                onDecide('rejected', categoryId, message.trim())
              }}
              className="h-11 flex-1 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-800"
            >
              На доработку
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onEdit} className="h-11 flex-1 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-800">
            Править
          </button>
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-800">
            Закрыть
          </button>
          <button type="button" onClick={onRemove} className="h-11 flex-1 rounded-xl bg-[#ff4d4f] text-sm font-semibold text-white hover:brightness-105">
            Удалить
          </button>
        </div>
      </footer>
    </>
  )
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { id: string; title: string }[]
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = options.find((item) => item.id === value)
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-[#5b4dff]">{label}</p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((currentOpen) => !currentOpen)}
          className="flex h-11 w-full items-center justify-between rounded-xl bg-[#f4f5f7] px-3.5 text-left text-sm text-neutral-800"
        >
          {current?.title ?? 'Выберите'}
          <ChevronDown className={cn('size-4 shrink-0 text-neutral-500 transition', open && 'rotate-180')} />
        </button>
        {open && (
          <ul className="mt-1 max-h-56 overflow-auto rounded-2xl border border-neutral-200 bg-white py-1 shadow-lg">
            {options.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(item.id)
                    setOpen(false)
                  }}
                  className={cn('w-full px-4 py-2.5 text-left text-sm', item.id === value ? 'bg-[#f3f0ff] font-medium text-[#5b4dff]' : 'hover:bg-neutral-50')}
                >
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function serviceOf(categoryId: string): ServiceType {
  return CATEGORY_SERVICE[categoryId] ?? 'print'
}

function DeskDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
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
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-neutral-950/30" aria-label="Закрыть" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-labelledby="design-drawer-title" className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-white shadow-[-16px_0_40px_rgba(15,23,42,0.12)]">
        {children}
      </aside>
    </div>
  )
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initial = parts[1]?.[0] ?? ''
  if (parts.length < 2 || !/\p{L}/u.test(initial)) return name
  return `${parts[0]} ${initial}.`
}

function statusText(status: ProductStatus) {
  if (status === 'published') return 'Опубликован'
  if (status === 'rejected') return 'Отклонён'
  return 'На проверке'
}

function statusTone(status: ProductStatus) {
  if (status === 'published') return 'bg-emerald-50 text-emerald-600'
  if (status === 'rejected') return 'bg-rose-50 text-rose-600'
  return 'bg-[#efeaff] text-[#5b4dff]'
}
