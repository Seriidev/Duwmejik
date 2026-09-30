import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Diamond,
  Flame,
  Layers,
  Printer,
  RectangleHorizontal,
  ShieldCheck,
  ShoppingCart,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cardPreview from '@/assets/card-preview.jpg'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import type { Product } from '@/types'

const slides = ['object-center', 'object-left', 'object-right', 'object-top', 'object-[70%_40%]'] as const
const quantities = [100, 250, 500, 1000]

function money(price: number) {
  if (price === 0) return 'Бесплатно'
  return `${new Intl.NumberFormat('ru-RU').format(price)} TMT`
}

function specsFor(product: Product) {
  const format =
    product.categoryId === 'cards'
      ? '90 × 50 мм'
      : product.categoryId === 'mugs'
        ? '330 мл'
        : product.orientation === 'square'
          ? '100 × 100 мм'
          : product.orientation === 'portrait'
            ? 'A5'
            : 'A4'
  const material =
    product.categoryId === 'mugs'
      ? 'Керамика'
      : product.categoryId === 'pens'
        ? 'Пластик'
        : product.categoryId === 'cards'
          ? 'Мелованная, 350 г/м²'
          : 'Мелованная, 170 г/м²'
  return [
    { icon: RectangleHorizontal, label: 'Формат', value: format },
    { icon: Layers, label: product.categoryId === 'mugs' || product.categoryId === 'pens' ? 'Материал' : 'Бумага', value: material },
    { icon: Printer, label: 'Печать', value: 'Цветная, 4+0' },
    { icon: Diamond, label: 'Ламинация', value: product.categoryId === 'cards' ? 'Матовая' : 'Без ламинации' },
    { icon: Clock, label: 'Срок изготовления', value: '1–2 рабочих дня' },
  ]
}

export function PreviewModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const category = useCatalogStore((state) => state.categories.find((item) => item.id === product?.categoryId))
  const favorites = useAccountStore((state) => (user ? state.favorites[user.id] : undefined))
  const toggleFavorite = useAccountStore((state) => state.toggleFavorite)
  const [index, setIndex] = useState(0)
  const [quantity, setQuantity] = useState(500)
  const saved = Boolean(product && favorites?.includes(product.id))
  const popular = Boolean(product && (product.downloads >= 600 || product.rating >= 4.8))

  useEffect(() => {
    setIndex(0)
    setQuantity(500)
    if (!product) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [product])

  function save() {
    if (!product) return
    if (!user) {
      navigate('/login')
      return
    }
    toggleFavorite(user.id, product.id)
  }

  const specs = product ? specsFor(product) : []

  return (
    <Modal open={Boolean(product)} title={product?.title ?? 'Просмотр'} onClose={onClose} wide bare>
      {product && (
        <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.9fr]">
          <div>
            <div className="relative overflow-hidden rounded-[22px] bg-slate-900">
              {slides.map((position, slideIndex) => (
                <img
                  key={position}
                  src={cardPreview}
                  alt=""
                  className={cn(
                    'aspect-[5/4] w-full object-cover transition-opacity duration-500',
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
                <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-amber-300">
                  <Flame className="size-3.5" />
                  Популярный
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
                    slideIndex === index ? 'border-lime-400' : 'border-transparent',
                  )}
                >
                  <img src={cardPreview} alt="" className={cn('h-full w-full object-cover', position)} />
                </button>
              ))}
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
            <span className="inline-flex rounded-full bg-lime-100 px-3 py-1 text-xs font-medium text-lime-800">
              {category?.title ?? 'Макет'}
            </span>
            <h3 className="mt-3 pr-10 text-3xl font-semibold tracking-tight text-slate-950">{product.title}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
              {product.description} Стильный макет с матовой ламинацией и ярким фирменным дизайном. Идеально для бизнеса, который ценит качество.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: Diamond, label: 'Премиум качество' },
                { icon: Clock, label: 'Быстрое изготовление' },
                { icon: ShieldCheck, label: 'Гарантия на печать' },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-2.5 py-2.5 text-[11px] leading-tight text-slate-600">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-slate-500 shadow-sm">
                    <item.icon className="size-3.5" />
                  </span>
                  {item.label}
                </span>
              ))}
            </div>
            <h4 className="mt-6 text-base font-semibold text-slate-900">Характеристики</h4>
            <div className="mt-1">
              {specs.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 text-sm">
                  <span className="inline-flex items-center gap-2.5 text-slate-500">
                    <row.icon className="size-4 text-slate-400" />
                    {row.label}
                  </span>
                  <span className="text-right font-medium text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm text-slate-700">Количество</span>
              <select
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="h-11 min-w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                {quantities.map((item) => (
                  <option key={item} value={item}>
                    {item} шт.
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{money(product.price)}</p>
            <p className="mt-1 text-sm text-slate-400">
              ≈ {quantity} шт. · 1–2 дня
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                to="/order"
                onClick={onClose}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-lime-400 text-sm font-semibold text-slate-950"
              >
                <ShoppingCart className="size-4" />
                Заказать
              </Link>
              <button
                type="button"
                onClick={save}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-800"
              >
                <Bookmark className={cn('size-4', saved && 'fill-slate-800')} />
                {saved ? 'Сохранено' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
