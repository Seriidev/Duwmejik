import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
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
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import cardPreview from '@/assets/card-preview.jpg'
import logoBell from '@/assets/logo-bell.png'
import { SmoothSelect } from '@/components/ui/SmoothSelect'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import type { Product } from '@/types'

const slides = ['object-center', 'object-left', 'object-right', 'object-top', 'object-[70%_40%]'] as const
const minQuantity = 60

function money(price: number) {
  return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)} TMT`
}

function unitPrice(product: Product) {
  const rates: Record<string, number> = {
    cards: 1.78,
    flyers: 0.35,
    brochures: 0.9,
    banners: 12,
    stickers: 0.25,
    postcards: 0.55,
    mugs: 18,
    pens: 4.5,
    notebooks: 8,
    forms: 0.4,
    books: 6,
    packaging: 3.2,
  }
  return rates[product.categoryId] ?? 1.5
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
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const category = useCatalogStore((state) => state.categories.find((item) => item.id === product?.categoryId))
  const favorites = useAccountStore((state) => (user ? state.favorites[user.id] : undefined))
  const toggleFavorite = useAccountStore((state) => state.toggleFavorite)
  const [index, setIndex] = useState(0)
  const [quantity, setQuantity] = useState(minQuantity)
  const [choices, setChoices] = useState<Record<string, string>>({})
  const saved = Boolean(product && favorites?.includes(product.id))
  const popular = Boolean(product && (product.downloads >= 600 || product.rating >= 4.8))

  useEffect(() => {
    setIndex(0)
    setQuantity(minQuantity)
    setChoices({})
    if (!product) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [product])

  function save() {
    if (!product) return
    if (!user) {
      router.push('/login')
      return
    }
    toggleFavorite(user.id, product.id)
  }

  const specs = product ? specsFor(product) : []
  const unit = product ? unitPrice(product) : 0
  const total = unit * quantity

  return (
    <Modal open={Boolean(product)} title={product?.title ?? 'Просмотр'} onClose={onClose} wide bare>
      {product && (
        <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.9fr]">
          <div className="rounded-[26px] bg-blue-50 p-2">
            <div className="relative overflow-hidden rounded-[22px] bg-slate-900">
              {slides.map((position, slideIndex) => (
                <img
                  key={position}
                  src={cardPreview.src}
                  alt=""
                  className={cn(
                    'aspect-square w-full object-cover transition-opacity duration-500',
                    position,
                    slideIndex === index ? 'opacity-100' : 'absolute inset-0 opacity-0',
                  )}
                />
              ))}
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm">
                <CreditCard className="size-3.5" />
                {category?.title ?? 'Макет'}
              </span>
              {popular && (
                <span className="absolute top-3 right-3 inline-flex max-w-[calc(100%-5.5rem)] items-center gap-1.5 rounded-full bg-[#146c43] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm sm:text-xs">
                  <img src={logoBell.src} alt="" className="size-5 shrink-0 object-contain" />
                  Лучший дизайн Duwmejik
                </span>
              )}
              <button
                type="button"
                aria-label="Предыдущее фото"
                onClick={() => setIndex((current) => (current + slides.length - 1) % slides.length)}
                className="absolute top-1/2 left-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Следующее фото"
                onClick={() => setIndex((current) => (current + 1) % slides.length)}
                className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm"
              >
                <ChevronRight className="size-5" />
              </button>
              <span className="absolute right-3 bottom-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700">
                {index + 1} / {slides.length}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {slides.map((position, slideIndex) => (
                <button
                  key={position}
                  type="button"
                  aria-label={`Фото ${slideIndex + 1}`}
                  onClick={() => setIndex(slideIndex)}
                  className={cn(
                    'aspect-[4/3] overflow-hidden rounded-xl border-2',
                    slideIndex === index ? 'border-blue-600' : 'border-transparent',
                  )}
                >
                  <img src={cardPreview.src} alt="" className={cn('h-full w-full object-cover', position)} />
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
              {product.description} Стильный макет с матовой ламинацией и ярким фирменным дизайном. Идеально для бизнеса, который ценит качество.
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
                <button type="button" onClick={onOrder} className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700">
                  Заказать
                </button>
              ) : (
                <Link href={product ? `/templates?section=orders&product=${product.id}` : '/templates?section=orders'} onClick={onClose} className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700">
                  Заказать
                </Link>
              )}
              <button type="button" onClick={save} className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-6 text-sm font-semibold text-slate-800">
                {saved ? 'Сохранено' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
