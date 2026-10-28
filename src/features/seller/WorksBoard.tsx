'use client'

import { Heart, ImagePlus, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { TemplateArt } from '@/components/TemplateArt'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { likeCount } from '@/store/useEngagementStore'
import type { Product, ProductStatus } from '@/types'

type Filter = 'all' | ProductStatus

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'published', label: 'Одобрено' },
  { id: 'pending', label: 'На проверке' },
  { id: 'rejected', label: 'Отклонено' },
]

const statusStyle: Record<ProductStatus, string> = {
  published: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  rejected: 'bg-rose-50 text-rose-600',
}

const statusLabel: Record<ProductStatus, string> = {
  published: 'Одобрено',
  pending: 'На проверке',
  rejected: 'Отклонено',
}

export function WorksBoard({
  mine,
  views,
  likes,
  categories,
  uploadedAt,
  notice,
  onOpenUpload,
  onRemove,
}: {
  mine: Product[]
  views: Record<string, number>
  likes: Record<string, string[]>
  categories: { id: string; title: string }[]
  uploadedAt: Record<string, string>
  notice?: string
  onOpenUpload: (file?: File) => void
  onRemove: (id: string) => void
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [over, setOver] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const published = mine.filter((item) => item.status === 'published')
  const pending = mine.filter((item) => item.status === 'pending')
  const viewTotal = published.reduce((sum, item) => sum + (views[item.id] ?? 0), 0)
  const visible = mine.filter((item) => filter === 'all' || item.status === filter)
  const categoryTitle = (id: string) => categories.find((item) => item.id === id)?.title ?? '—'

  function take(files: FileList | null) {
    const file = Array.from(files ?? []).find((item) => /image\/|pdf/.test(item.type) || /\.(png|jpe?g|pdf)$/i.test(item.name))
    onOpenUpload(file)
  }

  return (
    <div className="flex-1 bg-[#f6f7fb] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-500">Цену и категорию назначает администратор после проверки.</p>
        <button
          type="button"
          onClick={() => onOpenUpload()}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,107,255,0.28)] hover:brightness-110"
        >
          <Upload className="size-4" />
          Загрузить работу
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <Stat label="Всего работ" value={String(mine.length)} tone="text-slate-950" />
        <Stat label="Одобрено" value={String(published.length)} tone="text-emerald-600" />
        <Stat label="На проверке" value={String(pending.length)} tone="text-amber-600" />
        <Stat label="Просмотры одобренных" value={compact(viewTotal)} tone="text-brand" />
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenUpload()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onOpenUpload()
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setOver(false)
          take(event.dataTransfer.files)
        }}
        className={cn(
          'mt-4 flex cursor-pointer items-center gap-4 rounded-[22px] border border-dashed px-4 py-4 transition sm:px-5',
          over ? 'border-brand bg-blue-50' : 'border-blue-200 bg-white/80 hover:border-brand hover:bg-blue-50/60',
        )}
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-brand">
          <ImagePlus className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">Перетащите файлы сюда или выберите на компьютере</span>
          <span className="mt-1 block text-xs text-slate-500">PNG, JPG и PDF для печати. До отправки файл остаётся только у вас.</span>
        </span>
        <span className="hidden text-sm font-semibold text-brand sm:block">Выбрать файл</span>
      </div>
      {notice && <p className="mt-3 text-sm font-medium text-emerald-700">{notice}</p>}

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              'h-9 shrink-0 rounded-full px-4 text-sm font-medium',
              filter === item.id ? 'bg-slate-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-100',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 shrink-0 overflow-hidden rounded-[22px] bg-white shadow-[0_8px_30px_rgba(20,24,40,0.04)]">
        {visible.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-slate-500">
            {mine.length === 0 ? 'Пока нет работ. Загрузите первый файл — он попадёт на проверку.' : 'В этом статусе работ нет.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs font-medium text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Работа</th>
                  <th className="px-3 py-3 font-medium">Статус</th>
                  <th className="px-3 py-3 font-medium">Категория</th>
                  <th className="px-3 py-3 font-medium">Просмотры</th>
                  <th className="px-3 py-3 font-medium">Лайки</th>
                  <th className="px-3 py-3 font-medium">Загружено</th>
                  <th className="px-5 py-3 font-medium">
                    <span className="sr-only">Удалить</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img src={product.image} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
                        ) : (
                          <TemplateArt
                            categoryId={product.categoryId}
                            accent={product.accent}
                            seed={product.seed}
                            className="size-11 shrink-0 rounded-xl"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-950">{product.title}</p>
                          {product.gallery && product.gallery.length > 0 && (
                            <span className="mt-1.5 flex gap-1">
                              {product.gallery.map((src, index) => (
                                <img key={index} src={src} alt="" className="size-8 rounded-md object-cover" />
                              ))}
                            </span>
                          )}
                          {product.status === 'rejected' && product.description && (
                            <p className="mt-0.5 line-clamp-2 max-w-xs text-xs text-rose-500">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', statusStyle[product.status])}>
                        {statusLabel[product.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{product.status === 'pending' ? '—' : categoryTitle(product.categoryId)}</td>
                    <td className="px-3 py-3 text-slate-600">{product.status === 'published' ? compact(views[product.id] ?? 0) : '—'}</td>
                    <td className="px-3 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="size-3.5 text-slate-400" />
                        {product.status === 'published' ? likeCount(likes, product.id) : '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{uploadedAt[product.id] ? formatDate(uploadedAt[product.id]) : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      {confirmId === product.id ? (
                        <span className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onRemove(product.id)
                              setConfirmId(null)
                            }}
                            className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                          >
                            Удалить
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} className="text-sm font-medium text-slate-500 hover:text-slate-700">
                            Отмена
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Удалить «${product.title}»`}
                          onClick={() => setConfirmId(product.id)}
                          className="grid size-9 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[20px] bg-white px-3 py-3 shadow-[0_8px_30px_rgba(20,24,40,0.04)] sm:px-4 sm:py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={cn('mt-2 text-2xl font-semibold tracking-tight sm:text-3xl', tone)}>{value}</p>
    </div>
  )
}

function compact(value: number) {
  if (value < 1000) return String(value)
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value / 1000)}K`
}
