'use client'

import { Check, CircleCheck, Copy, Download, Gift, Image as ImageIcon, LayoutGrid, Palette, PenTool, Printer, ScanLine, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { SmoothSelect } from '@/components/ui/SmoothSelect'
import { PickupPass, prepaySplit } from '@/features/orders/PickupPass'
import { quoteOrder, SERVICE_ORDER, SERVICES, SUBTYPE_CATEGORY } from '@/features/orders/pricing'
import { createId, formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { formatPickupCode, useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { usePriceStore } from '@/store/usePriceStore'
import type { CustomOrder, Product, ServiceType } from '@/types'

const FORMATS = ['90×50 or A4', '90×50', 'A6', 'A5', 'A4', 'A3']
const PAPERS = ['Мелованная 300', 'Мелованная 170', 'Офсетная 80', 'Картон']
const CARD_SIZES = ['90×50 мм', '85×55 мм']
const CARD_PAPERS = ['Меловка 300 г/м²', 'Меловка 250 г/м²', 'Меловка 150 г/м²', 'Дизайнерская']
const CARD_EDGES = ['Квадратные', 'Круглые']
const CARD_SIDES = ['Односторонние', 'Двухсторонние']

const productCovers: Record<string, string> = {
  'tpl-card-nord': '/products/nord.jpg',
  'tpl-card-foil': '/products/foil.jpg',
  'tpl-card-startup': '/products/startup.jpg',
  'tpl-broch-cafe': '/products/broch-cafe.jpg',
  'tpl-broch-arch': '/products/broch-arch.jpg',
  'tpl-book-poetry': '/products/book-poetry.jpg',
  'tpl-book-kids': '/products/book-kids.jpg',
  'tpl-mug-morning': '/products/mug-morning.jpg',
  'tpl-mug-corp': '/products/mug-corp.jpg',
  'tpl-pen-logo': '/products/pen-logo.jpg',
  'tpl-note-dots': '/products/note-dots.jpg',
  'tpl-note-grid': '/products/note-grid.jpg',
  'tpl-form-free': '/products/form-invoice.jpg',
  'tpl-form-letter': '/products/form-letter.jpg',
  'tpl-banner-expo': '/products/banner-expo.jpg',
  'tpl-banner-social': '/products/banner-social.jpg',
  'tpl-flyer-sale': '/products/flyer-sale.jpg',
  'tpl-pack-box': '/products/pack-box.jpg',
  'tpl-stickers': '/products/stickers.jpg',
  'tpl-stickers-pack': '/products/stickers-pack.jpg',
  'tpl-card-holiday': '/products/card-holiday.jpg',
  'tpl-card-wedding': '/products/card-wedding.jpg',
}

const previews: Record<string, string> = {
  'print:Визитки': '/categories/cards.jpg',
  'print:Буклеты': '/categories/booklet.jpg',
  'print:Листовки': '/categories/flyer.jpg',
  'print:Бланки': '/products/form-letter.jpg',
  'print:Книги': '/products/book-poetry.jpg',
  'souvenir:Кружки': '/products/mug-morning.jpg',
  'souvenir:Ручки': '/categories/pens.jpg',
  'souvenir:Блокноты': '/categories/notebooks.jpg',
  'graphic:Баннеры': '/categories/banner.png',
  'graphic:Соцсети': '/products/banner-social.jpg',
  'graphic:Упаковка': '/categories/packaging.png',
  'graphic:Наклейки': '/categories/sticker.png',
  'identity:Логотип': '/products/startup.jpg',
  'identity:Фирменный стиль': '/about/type.jpg',
  'identity:Брендбук': '/products/broch-arch.jpg',
  'laser:Металл': '/categories/engraving.jpg',
  'laser:Дерево': '/categories/engraving.jpg',
  'laser:Стекло': '/categories/glasses.jpg',
  'laser:Кожа': '/categories/engraving.jpg',
}
const deadlines = [
  { id: 'usual', title: 'Обычный', text: '2–3 дня', days: 3 },
  { id: 'fast', title: 'Срочно', text: '1 день', days: 1 },
  { id: 'extra', title: 'Экстра срочно', text: 'в тот же день', days: 0 },
] as const

const control =
  'h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none'

const serviceIcons = {
  print: Printer,
  souvenir: Gift,
  graphic: Palette,
  identity: PenTool,
  laser: ScanLine,
} as const

const presets: Record<string, { service: ServiceType; subtype: string; format: string; paper: string; quantity: number }> = {
  cards: { service: 'print', subtype: 'Визитки', format: '90×50', paper: 'Мелованная 300', quantity: 100 },
  brochures: { service: 'print', subtype: 'Буклеты', format: 'A4', paper: 'Мелованная 170', quantity: 100 },
  books: { service: 'print', subtype: 'Книги', format: 'A5', paper: 'Офсетная 80', quantity: 50 },
  flyers: { service: 'print', subtype: 'Листовки', format: 'A5', paper: 'Мелованная 170', quantity: 500 },
  forms: { service: 'print', subtype: 'Бланки', format: 'A4', paper: 'Офсетная 80', quantity: 100 },
  postcards: { service: 'print', subtype: 'Листовки', format: 'A6', paper: 'Мелованная 300', quantity: 100 },
  mugs: { service: 'souvenir', subtype: 'Кружки', format: 'A4', paper: 'Картон', quantity: 50 },
  pens: { service: 'souvenir', subtype: 'Ручки', format: 'A6', paper: 'Картон', quantity: 100 },
  notebooks: { service: 'souvenir', subtype: 'Блокноты', format: 'A5', paper: 'Офсетная 80', quantity: 50 },
  banners: { service: 'graphic', subtype: 'Баннеры', format: 'A3', paper: 'Мелованная 170', quantity: 1 },
  stickers: { service: 'graphic', subtype: 'Наклейки', format: 'A6', paper: 'Мелованная 170', quantity: 100 },
  packaging: { service: 'graphic', subtype: 'Упаковка', format: 'A4', paper: 'Картон', quantity: 100 },
}

function daysUntil(day: string) {
  const target = new Date(`${day}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.max(0, Math.round((target.getTime() - today.getTime()) / 86400000))
}

function money(price: number) {
  return `${new Intl.NumberFormat('ru-RU').format(price)} TMT`
}

export function OrderWizardPage({
  onFinished,
  onOpenGallery,
  onOpenTemplates,
  selectedProduct,
  selectedFrom,
}: {
  onFinished?: () => void
  onOpenGallery?: () => void
  onOpenTemplates?: () => void
  selectedProduct?: Product | null
  selectedFrom?: 'gallery' | 'templates' | null
}) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const addOrder = useAccountStore((state) => state.addOrder)
  const categories = useCatalogStore((state) => state.categories)
  const serviceBase = usePriceStore((state) => state.serviceBase)
  const [service, setService] = useState<ServiceType>('print')
  const [subtype, setSubtype] = useState('Визитки')
  const [quantityInput, setQuantityInput] = useState('100')
  const [format, setFormat] = useState(CARD_SIZES[0])
  const [paper, setPaper] = useState(CARD_PAPERS[0])
  const [edges, setEdges] = useState(CARD_EDGES[0])
  const [sides, setSides] = useState(CARD_SIDES[0])
  const [customDate, setCustomDate] = useState('')
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')
  const [deadline, setDeadline] = useState<string>('usual')
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CustomOrder | null>(null)
  const [copied, setCopied] = useState(false)
  const [pickedTitle, setPickedTitle] = useState(selectedProduct?.title ?? '')
  const [pickedId, setPickedId] = useState(selectedProduct?.id ?? '')
  const [pickedCover, setPickedCover] = useState(selectedProduct ? productCovers[selectedProduct.id] ?? '' : '')
  const [pickedFrom, setPickedFrom] = useState<'gallery' | 'templates' | null>(selectedFrom ?? null)
  const [pickedCategory, setPickedCategory] = useState(selectedProduct?.categoryId ?? '')

  function applyDesign(product: Product) {
    const preset = presets[product.categoryId] ?? presets.cards
    const extension = product.fileTypes[0]?.toLowerCase() ?? 'pdf'
    setService(preset.service)
    setSubtype(preset.subtype)
    setFormat(preset.format)
    setPaper(preset.paper)
    setQuantityInput(String(preset.quantity))
    setComment(product.description)
    setFiles([`${product.title}.${extension}`])
    setName(user?.name ?? name)
    setEmail(user?.email ?? email)
    setPhone(user?.phone || phone)
    setPickedTitle(product.title)
    setPickedId(product.id)
    setPickedCategory(product.categoryId)
    setPickedCover(productCovers[product.id] ?? '')
    setError('')
  }

  useEffect(() => {
    if (!selectedProduct) return
    applyDesign(selectedProduct)
    setPickedFrom(selectedFrom ?? null)
  }, [selectedProduct, selectedFrom])

  const card = service === 'print' && subtype === 'Визитки'

  useEffect(() => {
    if (card) {
      if (!CARD_SIZES.includes(format)) setFormat(CARD_SIZES[0])
      if (!CARD_PAPERS.includes(paper)) setPaper(CARD_PAPERS[0])
      return
    }
    if (!FORMATS.includes(format)) setFormat(FORMATS[0])
    if (!PAPERS.includes(paper)) setPaper(PAPERS[0])
  }, [card, format, paper])

  const quantity = Math.max(1, Number(quantityInput) || 1)
  const categoryId = pickedId ? pickedCategory : SUBTYPE_CATEGORY[subtype]
  const category = categories.find((item) => item.id === categoryId)
  const quote = quoteOrder({ service, quantity, category, serviceBase })
  const split = prepaySplit(quote.price)

  function clearPicked() {
    setPickedTitle('')
    setPickedId('')
    setPickedCategory('')
    setPickedCover('')
    setPickedFrom(null)
  }

  function pickService(id: ServiceType) {
    setService(id)
    setSubtype(SERVICES[id].subtypes[0])
    clearPicked()
    setError('')
  }

  const presetDue = deadlines.find((item) => item.id === deadline) ?? deadlines[0]
  const due =
    deadline === 'custom'
      ? {
          title: customDate ? formatDate(`${customDate}T12:00:00`) : 'Свой срок',
          days: customDate ? daysUntil(customDate) : 0,
        }
      : presetDue
  const previewSrc = (pickedId && productCovers[pickedId]) || previews[`${service}:${subtype}`] || '/categories/cards.jpg'
  const previewLabel = pickedTitle || `${SERVICES[service].title} · ${subtype}`

  function submit() {
    if (card && deadline === 'custom' && !customDate) {
      setError('Выберите дату сдачи')
      return
    }
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Нужны имя и настоящая почта')
      return
    }
    const order = addOrder({
      id: createId('DU').toUpperCase(),
      userId: user?.id ?? 'guest',
      service,
      subtype,
      tariff: 'standard',
      price: quote.price,
      days: due.days,
      status: 'new',
      customerName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      comment: comment.trim(),
      quantity,
      references: files,
      brief: {
        source: files.length ? 'upload' : 'catalog',
        format,
        paper: card && paper === 'Дизайнерская' ? 'Дизайнерская (образцы в офисе)' : paper,
        deadline: due.title,
        ...(card ? { edges, sides } : {}),
      },
      productId: pickedId || undefined,
      categoryId: category?.id,
      createdAt: new Date().toISOString(),
    })
    setCreated(order)
  }

  if (created) {
    return (
      <Shell>
        <SuccessCard
          order={created}
          copied={copied}
          onCopy={() => setCopied(true)}
          onClose={() => (onFinished ? onFinished() : router.push('/'))}
        />
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="grid items-stretch gap-3 lg:grid-cols-[228px_minmax(0,1fr)]">
        <div className="grid content-stretch gap-1.5 lg:h-full lg:grid-rows-7">
          {SERVICE_ORDER.map((id) => (
            <ServiceCard
              key={id}
              title={SERVICES[id].title}
              subtitle={SERVICES[id].subtypes.slice(0, 2).join(', ')}
              icon={serviceIcons[id]}
              active={service === id && !pickedFrom}
              onClick={() => pickService(id)}
            />
          ))}
          <ServiceCard
            title="Gallery"
            subtitle={pickedFrom === 'gallery' && pickedTitle ? pickedTitle : 'Готовые шаблоны'}
            icon={ImageIcon}
            active={pickedFrom === 'gallery'}
            onClick={() => (onOpenGallery ? onOpenGallery() : router.push('/templates?pick=gallery'))}
          />
          <ServiceCard
            title="Выбрать"
            subtitle={pickedFrom === 'templates' && pickedTitle ? pickedTitle : 'Шаблоны дизайнеров'}
            icon={LayoutGrid}
            active={pickedFrom === 'templates'}
            onClick={() => (onOpenTemplates ? onOpenTemplates() : router.push('/templates?pick=templates'))}
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          {card ? (
            <div className="grid grid-cols-2 gap-2.5 lg:col-span-2 lg:col-start-1 lg:row-start-1">
              <Field label="Изделие">
                <SmoothSelect
                  value={subtype}
                  options={SERVICES[service].subtypes}
                  onChange={(next) => {
                    setSubtype(next)
                    clearPicked()
                  }}
                />
              </Field>
              <Field label="Размер">
                <SmoothSelect value={format} options={CARD_SIZES} onChange={setFormat} />
              </Field>
            </div>
          ) : (
            <>
              <Field label="Изделие" className="lg:col-span-2 lg:col-start-1 lg:row-start-1">
                <SmoothSelect
                  value={subtype}
                  options={SERVICES[service].subtypes}
                  onChange={(next) => {
                    setSubtype(next)
                    clearPicked()
                  }}
                />
              </Field>
              <Field label="Формат" className="lg:col-span-2 lg:col-start-1 lg:row-start-2">
                <SmoothSelect value={format} options={FORMATS} onChange={setFormat} />
              </Field>
            </>
          )}
          <div className="relative h-48 overflow-hidden rounded-2xl lg:col-start-3 lg:row-start-1 lg:row-end-5 lg:h-auto lg:min-h-0">
            <img src={previewSrc} alt={previewLabel} className="h-full w-full object-cover lg:absolute lg:inset-0" />
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:contents">
          <div className={cn('grid gap-1.5 lg:col-start-1', card ? 'lg:row-start-2' : 'lg:row-start-3')}>
            <Field label="Бумага">
              <SmoothSelect value={paper} options={card ? CARD_PAPERS : PAPERS} onChange={setPaper} />
            </Field>
            {card && paper === 'Дизайнерская' && <p className="text-xs text-slate-400">Образцы дизайнерской бумаги можно посмотреть только в офисе.</p>}
          </div>
          <Field label="Тираж, шт." className={cn('lg:col-start-2', card ? 'lg:row-start-2' : 'lg:row-start-3')}>
            <input
              className={control}
              inputMode="numeric"
              autoComplete="off"
              value={quantityInput}
              onChange={(event) => setQuantityInput(event.target.value.replace(/\D/g, ''))}
              onBlur={() => {
                if (!quantityInput) setQuantityInput('1')
              }}
            />
          </Field>
          </div>
          {card && (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:contents">
              <Field label="Края" className="lg:col-start-1 lg:row-start-3">
                <SmoothSelect value={edges} options={CARD_EDGES} onChange={setEdges} />
              </Field>
              <Field label="Стороны" className="lg:col-start-2 lg:row-start-3">
                <SmoothSelect value={sides} options={CARD_SIDES} onChange={setSides} />
              </Field>
            </div>
          )}
          <Field label="Имя" className="lg:col-span-2 lg:col-start-1 lg:row-start-4">
            <input className={control} value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:contents">
          <Field label="Почта" className="lg:col-start-1 lg:row-start-5">
            <input className={control} type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Телефон" className="lg:col-start-2 lg:row-start-5">
            <input className={control} placeholder="+993" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </Field>
          </div>
          <div className="grid gap-1.5 lg:col-span-2 lg:col-start-1 lg:row-start-6">
            <p className="text-sm text-slate-500">Срок сдачи</p>
            <div className={cn('grid gap-2', card ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
              {deadlines.map((item) => {
                const active = deadline === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDeadline(item.id)}
                    className={cn(
                      'rounded-xl border px-2 py-2.5 text-left',
                      active ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white',
                    )}
                  >
                    <span className={cn('block text-sm font-semibold', active ? 'text-blue-700' : 'text-slate-900')}>{item.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">{item.text}</span>
                  </button>
                )
              })}
              {card && (
                <button
                  type="button"
                  onClick={() => setDeadline('custom')}
                  className={cn(
                    'rounded-xl border px-2 py-2.5 text-left',
                    deadline === 'custom' ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white',
                  )}
                >
                  <span className={cn('block text-sm font-semibold', deadline === 'custom' ? 'text-blue-700' : 'text-slate-900')}>Свой срок</span>
                  <span className="mt-0.5 block text-xs text-slate-400">выберите дату</span>
                </button>
              )}
            </div>
            {card && deadline === 'custom' && (
              <input
                type="date"
                className={control}
                min={new Date().toISOString().slice(0, 10)}
                value={customDate}
                onChange={(event) => setCustomDate(event.target.value)}
              />
            )}
          </div>
          <Field label="Описание задачи" className="lg:col-span-2 lg:col-start-1 lg:row-start-7 lg:h-full">
            <textarea
              className="h-[152px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none lg:h-full lg:min-h-[152px]"
              placeholder="Опишите макет, тираж и пожелания"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </Field>
          <div className="flex flex-col gap-2 lg:col-start-3 lg:row-start-5 lg:row-end-8 lg:min-h-0">
            <UploadBox files={files} onFiles={setFiles} />
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <p className="flex items-baseline justify-between gap-3">
                <span className="text-slate-500">Предварительно</span>
                <span className="text-lg font-semibold text-slate-950">{money(quote.price)}</span>
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {quote.unitPrice !== null && `${quote.unitPrice} TMT × ${quantity} шт. · `}предоплата 50% — {money(split.prepay)}
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="button" onClick={submit} className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white lg:w-full">
              Отправить заказ
            </button>
          </div>
        </div>
      </div>
    </Shell>
  )
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('grid gap-1.5 text-sm text-slate-500', className)}>
      {label}
      {children}
    </label>
  )
}

function UploadBox({ files, onFiles }: { files: string[]; onFiles: (files: string[]) => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 text-sm text-slate-500">
      Загрузить макет
      <label className="flex min-h-[152px] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-center">
        <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500">
          <Upload className="size-5" />
        </span>
        <span className="mt-3 text-sm font-medium text-slate-800">Загрузите свой макет</span>
        <span className="mt-1 text-xs text-slate-400">PNG, JPG или PDF · до 20 МБ</span>
        {files.length > 0 && <span className="mt-2 text-xs text-slate-600">{files.join(', ')}</span>}
        <input
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(event) => onFiles(Array.from(event.target.files ?? []).map((file) => file.name))}
        />
      </label>
    </div>
  )
}

function ServiceCard({
  title,
  subtitle,
  icon: Icon,
  active,
  onClick,
}: {
  title: string
  subtitle: string
  icon: typeof ImageIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex h-full items-start gap-3 rounded-2xl border px-3 py-2.5 text-left',
        active ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white',
      )}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', active ? 'text-blue-600' : 'text-slate-700')} />
      <span className="min-w-0 pr-5">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-slate-400">{subtitle}</span>
      </span>
      {active && <Check className="absolute top-3 right-3 size-4 text-blue-600" />}
    </button>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="w-full bg-white px-6 pb-10">{children}</div>
}

function SuccessCard({
  order,
  copied,
  onCopy,
  onClose,
}: {
  order: CustomOrder
  copied: boolean
  onCopy: () => void
  onClose: () => void
}) {
  function download() {
    const text = [
      order.id,
      `Тип: ${SERVICES[order.service].title}`,
      `Изделие: ${order.subtype}`,
      `Тираж: ${order.quantity} шт`,
      `Формат: ${order.brief.format ?? ''}`,
      `Бумага: ${order.brief.paper ?? ''}`,
      order.brief.edges ? `Края: ${order.brief.edges}` : '',
      order.brief.sides ? `Стороны: ${order.brief.sides}` : '',
      `Срок: ${order.brief.deadline ?? ''}`,
      `Имя: ${order.customerName}`,
      `Компания: ${order.brief.company ?? ''}`,
      `Телефон: ${order.phone}`,
      `Почта: ${order.email}`,
      `Сумма: ${money(order.price)}`,
      `Код получения: ${formatPickupCode(order.pickupCode)}`,
      order.comment,
    ]
      .filter(Boolean)
      .join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${order.id}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-2 py-6 text-center">
      <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Успешно сделано!</h1>
      <div className="mx-auto mt-6 flex size-20 items-center justify-center rounded-full bg-emerald-100">
        <CircleCheck className="size-10 text-emerald-500" />
      </div>
      <button
        type="button"
        className="mt-5 inline-flex items-center gap-2 text-lg font-semibold text-blue-600"
        onClick={() => {
          void navigator.clipboard.writeText(order.id)
          onCopy()
        }}
      >
        {order.id}
        <Copy className="size-4" />
      </button>
      {copied && <p className="mt-1 text-xs text-slate-400">Номер скопирован</p>}
      <p className="mt-2 text-sm text-slate-400">Номер заказа. Код и QR для получения есть ниже и в истории заказов.</p>
      <PickupPass order={order} className="mx-auto mt-6 max-w-lg text-left" />
      <div className="mx-auto mt-5 grid max-w-lg grid-cols-2 gap-3">
        <button
          type="button"
          onClick={download}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-50 text-sm font-semibold tracking-wide text-blue-600 uppercase"
        >
          Скачать <Download className="size-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-xl bg-brand text-sm font-semibold text-white hover:brightness-110"
        >
          Закрыть
        </button>
      </div>
    </div>
  )
}
