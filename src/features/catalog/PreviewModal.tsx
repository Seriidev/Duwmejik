import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Diamond,
  Layers,
  Minus,
  Plus,
  Printer,
  RectangleHorizontal,
  UserRound,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import cardPreview from '@/assets/card-preview.jpg'
import logoBell from '@/assets/logo-bell.png'
import { SmoothSelect } from '@/components/ui/SmoothSelect'
import { Modal } from '@/components/ui/Modal'
import { SavedNotice, useSavedNotice } from '@/components/ui/SavedNotice'
import { DEFAULT_UNIT_PRICE } from '@/data/catalog'
import { useRequireUser } from '@/hooks/useRequireUser'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import type { Product } from '@/types'

const minQuantity = 60

function productPhotos(product: Product) {
  const photos = [product.image, ...(product.gallery ?? [])].filter((src): src is string => Boolean(src))
  return [...new Set(photos)]
}

function money(price: number) {
  return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)} TMT`
}

function specsFor(product: Product) {
  const format = product.categoryId === 'cards' ? '90 × 50 мм' : product.categoryId === 'mugs' ? '330 мл' : product.orientation === 'portrait' ? 'A5' : 'A4'
  const paper = product.categoryId === 'mugs' || product.categoryId === 'pens' ? 'Керамика' : product.categoryId === 'cards' ? 'Мелованная, 350 г/м²' : 'Мелованная, 170 г/м²'
  return [
    {
      key: 'format',
      icon: RectangleHorizontal,
      label: 'Формат',
      options: [format, 'A6', 'A5', 'A4'].filter((item, index, list) => list.indexOf(item) === index),
    },
    {
      key: 'paper',
      icon: Layers,
      label: product.categoryId === 'mugs' || product.categoryId === 'pens' ? 'Материал' : 'Бумага',
      options: [paper, 'Мелованная, 300 г/м²', 'Офсетная, 80 г/м²'].filter((item, index, list) => list.indexOf(item) === index),
    },
    { key: 'print', icon: Printer, label: 'Печать', options: ['Цветная, 4+0', 'Цветная, 4+4', 'Чёрно-белая'] },
    {
      key: 'lamination',
      icon: Diamond,
      label: 'Ламинация',
      options: product.categoryId === 'cards' ? ['Матовая', 'Глянцевая', 'Без ламинации'] : ['Без ламинации', 'Матовая', 'Глянцевая'],
    },
  ]
}

export function PreviewModal({
  product,
  onClose,
  onOrder,
}: {
  product: Product | null
  onClose: () => void
  onOrder?: () => void
}) {
  const requireUser = useRequireUser()
  const user = useAuthStore((state) => state.user)
  const category = useCatalogStore((state) => state.categories.find((item) => item.id === product?.categoryId))
  const favorites = useAccountStore((state) => (user ? state.favorites[user.id] : undefined))
  const toggleFavorite = useAccountStore((state) => state.toggleFavorite)
  const [index, setIndex] = useState(0)
  const [quantity, setQuantity] = useState(minQuantity)
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [showBadge, setShowBadge] = useState(false)
  const savedNotice = useSavedNotice()
  const saved = Boolean(product && favorites?.includes(product.id))
  const popular = Boolean(product && (product.downloads >= 600 || product.rating >= 4.8))

  useEffect(() => {
    setIndex(0)
    setQuantity(minQuantity)
    setChoices({})
    setShowBadge(false)
    if (!product) return
    const count = Math.max(1, productPhotos(product).length)
    if (count < 2) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [product])

  function save() {
    if (!product || !requireUser() || !user) return
    const already = favorites?.includes(product.id)
    toggleFavorite(user.id, product.id)
    if (!already) savedNotice.show()
  }

  const specs = product ? specsFor(product) : []
  const unit = product ? category?.unitPrice ?? DEFAULT_UNIT_PRICE : 0
  const total = unit * quantity
  const frames = product ? productPhotos(product) : []
  const photos = frames.length > 0 ? frames : [cardPreview.src]
  const slide = photos[index % photos.length]

  return (
    <Modal open={Boolean(product)} title={product?.title ?? 'Просмотр'} onClose={onClose} wide bare>
      {product && (
        <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.9fr]">
          <div className="rounded-[26px] bg-blue-50 p-2">
            <div className="relative overflow-hidden rounded-[22px] bg-slate-900">
              <img src={slide} alt="" className="aspect-square w-full object-cover" />
              {popular && (
                <button
                  type="button"
                  aria-expanded={showBadge}
                  aria-label="Лучший дизайн Duwmejik"
                  onClick={() => setShowBadge((open) => !open)}
                  className="group absolute top-3 right-3 flex items-center rounded-full bg-[#146c43] text-white shadow-sm"
                >
                  <span
                    className={cn(
                      'max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold opacity-0 transition-all duration-200',
                      'sm:group-hover:max-w-52 sm:group-hover:pr-1 sm:group-hover:pl-3 sm:group-hover:opacity-100',
                      showBadge && 'max-w-52 pr-1 pl-3 opacity-100',
                    )}
                  >
                    Лучший дизайн Duwmejik
                  </span>
                  <span className="grid size-9 shrink-0 place-items-center">
                    <img src={logoBell.src} alt="" className="size-6 object-contain" />
                  </span>
                </button>
              )}
              <button
                type="button"
                aria-label="Предыдущее фото"
                onClick={() => setIndex((current) => (current + photos.length - 1) % photos.length)}
                className="absolute top-1/2 left-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Следующее фото"
                onClick={() => setIndex((current) => (current + 1) % photos.length)}
                className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm"
              >
                <ChevronRight className="size-5" />
              </button>
              <span className="absolute right-3 bottom-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700">
                {index + 1} / {photos.length}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              {photos.map((src, slideIndex) => (
                <button
                  key={`${src}-${slideIndex}`}
                  type="button"
                  aria-label={`Фото ${slideIndex + 1}`}
                  onClick={() => setIndex(slideIndex)}
                  className={cn(
                    'h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2',
                    slideIndex === index ? 'border-blue-600' : 'border-transparent',
                  )}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 px-1">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">
                <UserRound className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Автор</p>
                <Link href={`/designer/${product.authorId}`} onClick={onClose} className="block truncate text-sm font-medium text-slate-800 hover:text-blue-600">
                  {product.author}
                </Link>
              </div>
            </div>
          </div>

          <div className="relative px-1 pb-2 lg:px-2">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-0 right-0 grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Закрыть окно"
            >
              <X className="size-5" />
            </button>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {category?.title ?? 'Макет'}
            </span>
            <h3 className="mt-3 pr-10 text-3xl font-semibold tracking-tight text-slate-950">{product.title}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
              {product.description}
            </p>
            <div className="mt-6 flex items-baseline justify-between gap-3">
              <h4 className="text-base font-semibold text-slate-900">Характеристики</h4>
              <span className="text-xs text-slate-400">Выберите параметры</span>
            </div>
            <div className="mt-3 grid gap-2">
              {specs.map((row) => (
                <label key={row.key} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2.5 text-sm text-slate-500">
                    <row.icon className="size-4 text-slate-400" />
                    {row.label}
                  </span>
                  <SmoothSelect
                    className="w-52 shrink-0"
                    value={choices[row.key] ?? row.options[0]}
                    options={row.options}
                    onChange={(next) => setChoices((current) => ({ ...current, [row.key]: next }))}
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
              <p className="inline-flex items-center gap-2">
                <Clock className="size-4 text-slate-400" />
                Срок для выбранной конфигурации
              </p>
              <p className="mt-1 pl-6 font-medium text-slate-800">1–2 рабочих дня · ориентировочно</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-800">Количество</p>
                <p className="text-xs text-slate-400">Минимум — {minQuantity} шт.</p>
              </div>
              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white">
                <button type="button" aria-label="Меньше" onClick={() => setQuantity((current) => Math.max(minQuantity, current - 10))} className="grid size-11 place-items-center text-slate-500">
                  <Minus className="size-4" />
                </button>
                <span className="min-w-16 text-center text-sm font-medium text-slate-800">{quantity} шт.</span>
                <button type="button" aria-label="Больше" onClick={() => setQuantity((current) => current + 10)} className="grid size-11 place-items-center text-slate-500">
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-tight text-slate-950">{money(total)}</p>
              <p className="pb-1 text-xs text-slate-400">Предварительная цена</p>
            </div>
            <p className="mt-1 text-sm text-slate-400">Пример: {money(unit)} × {quantity} шт.</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">Цена иллюстративная: зависит от опций и тиража. Материалы и отделка меняют цену и срок; итог уточняется при заказе.</p>
            <div className="mt-4 flex gap-2">
              {onOrder ? (
                <button type="button" onClick={onOrder} className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white hover:brightness-110">
                  Заказать
                </button>
              ) : (
                <Link href={product ? `/templates?section=orders&product=${product.id}` : '/templates?section=orders'} onClick={onClose} className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white hover:brightness-110">
                  Заказать
                </Link>
              )}
              <button type="button" onClick={save} className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-semibold text-slate-800">
                {saved ? 'Сохранено' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
      <SavedNotice open={savedNotice.open} />
    </Modal>
  )
}
