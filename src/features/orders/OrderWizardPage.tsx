'use client'

import { Check, CircleCheck, Copy, Download, Gift, Image as ImageIcon, LayoutGrid, Palette, PenTool, Printer, ScanLine, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import QRCode from 'qrcode'
import { SmoothSelect } from '@/components/ui/SmoothSelect'
import { estimate, SERVICE_ORDER, SERVICES } from '@/features/orders/pricing'
import { createId } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { CustomOrder, Product, ServiceType } from '@/types'

const FORMATS = ['90×50 or A4', '90×50', 'A6', 'A5', 'A4', 'A3']
const PAPERS = ['Мелованная 300', 'Мелованная 170', 'Офсетная 80', 'Картон']

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
  const [service, setService] = useState<ServiceType>('print')
  const [subtype, setSubtype] = useState('Визитки')
  const [quantity, setQuantity] = useState(100)
  const [format, setFormat] = useState(FORMATS[0])
  const [paper, setPaper] = useState(PAPERS[0])
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState<string[]>([])
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')
  const [deadline, setDeadline] = useState<(typeof deadlines)[number]['id']>('usual')
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CustomOrder | null>(null)
  const [copied, setCopied] = useState(false)
  const [pickedTitle, setPickedTitle] = useState(selectedProduct?.title ?? '')
  const [pickedId, setPickedId] = useState(selectedProduct?.id ?? '')
  const [pickedCover, setPickedCover] = useState(selectedProduct ? productCovers[selectedProduct.id] ?? '' : '')
  const [pickedFrom, setPickedFrom] = useState<'gallery' | 'templates' | null>(selectedFrom ?? null)

  function applyDesign(product: Product) {
    const preset = presets[product.categoryId] ?? presets.cards
    const extension = product.fileTypes[0]?.toLowerCase() ?? 'pdf'
    setService(preset.service)
    setSubtype(preset.subtype)
    setFormat(preset.format)
    setPaper(preset.paper)
    setQuantity(preset.quantity)
    setComment(product.description)
    setFiles([`${product.title}.${extension}`])
    setName(user?.name ?? name)
    setEmail(user?.email ?? email)
    setPhone(user?.phone || phone)
    setPickedTitle(product.title)
    setPickedId(product.id)
    setPickedCover(productCovers[product.id] ?? '')
    setError('')
  }

  useEffect(() => {
    if (!selectedProduct) return
    applyDesign(selectedProduct)
    setPickedFrom(selectedFrom ?? null)
  }, [selectedProduct, selectedFrom])

  const quote = estimate(service, 'standard', quantity)

  function clearPicked() {
    setPickedTitle('')
    setPickedId('')
    setPickedCover('')
    setPickedFrom(null)
  }

  function pickService(id: ServiceType) {
    setService(id)
    setSubtype(SERVICES[id].subtypes[0])
    clearPicked()
    setError('')
  }

  const due = deadlines.find((item) => item.id === deadline) ?? deadlines[0]
  const previewSrc = (pickedId && productCovers[pickedId]) || previews[`${service}:${subtype}`] || '/categories/cards.jpg'
  const previewLabel = pickedTitle || `${SERVICES[service].title} · ${subtype}`

  function submit() {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Нужны имя и настоящая почта')
      return
    }
    const order: CustomOrder = {
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
      brief: { source: files.length ? 'upload' : 'catalog', format, paper, deadline: due.title },
      productId: pickedId || undefined,
      createdAt: new Date().toISOString(),
    }
    addOrder(order)
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
      <div className="grid items-start gap-3 lg:grid-cols-[228px_minmax(0,1fr)]">
        <div className="grid gap-1.5">
          {SERVICE_ORDER.filter((id) => id !== 'laser').map((id) => (
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
          <ServiceCard
            title={SERVICES.laser.title}
            subtitle={SERVICES.laser.subtypes.slice(0, 2).join(', ')}
            icon={serviceIcons.laser}
            active={service === 'laser' && !pickedFrom}
            onClick={() => pickService('laser')}
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
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
          <div className="relative h-48 overflow-hidden rounded-2xl lg:col-start-3 lg:row-start-1 lg:row-end-5 lg:h-auto lg:min-h-0">
            <img src={previewSrc} alt={previewLabel} className="h-full w-full object-cover lg:absolute lg:inset-0" />
          </div>
          <Field label="Формат" className="lg:col-span-2 lg:col-start-1 lg:row-start-2">
            <SmoothSelect value={format} options={FORMATS} onChange={setFormat} />
          </Field>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:contents">
          <Field label="Бумага" className="lg:col-start-1 lg:row-start-3">
            <SmoothSelect value={paper} options={PAPERS} onChange={setPaper} />
          </Field>
          <Field label="Тираж, шт." className="lg:col-start-2 lg:row-start-3">
            <input
              className={control}
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            />
          </Field>
          </div>
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
            <div className="grid grid-cols-3 gap-2">
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
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:contents">
          <Field label="Описание задачи" className="lg:col-start-1 lg:row-start-7">
            <textarea
              className="h-[152px] w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
              placeholder="Опишите макет, тираж и пожелания"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </Field>
          <div className="lg:col-start-2 lg:row-start-7">
            <UploadBox files={files} onFiles={setFiles} />
          </div>
          </div>
          <div className="flex flex-col items-end gap-2 lg:col-start-3 lg:row-start-5 lg:items-stretch">
            {error && <p className="text-sm text-red-600 lg:text-right">{error}</p>}
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
    <div className="grid gap-1.5 text-sm text-slate-500">
      Загрузить макет
      <label className="flex h-[152px] cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-center">
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
        'relative flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-left',
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
  const [src, setSrc] = useState('')
  const payload = [
    order.id,
    `${SERVICES[order.service].title} · ${order.subtype}`,
    `Тираж ${order.quantity} шт`,
    order.brief.format ?? '',
    order.brief.paper ?? '',
    money(order.price),
  ].join('\n')

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(payload, { margin: 1, width: 220, color: { dark: '#0f172a', light: '#ffffff' } }).then((url) => {
      if (alive) setSrc(url)
    })
    return () => {
      alive = false
    }
  }, [payload])

  function download() {
    const text = [
      order.id,
      `Тип: ${SERVICES[order.service].title}`,
      `Изделие: ${order.subtype}`,
      `Тираж: ${order.quantity} шт`,
      `Формат: ${order.brief.format ?? ''}`,
      `Бумага: ${order.brief.paper ?? ''}`,
      `Срок: ${order.brief.deadline ?? ''}`,
      `Имя: ${order.customerName}`,
      `Компания: ${order.brief.company ?? ''}`,
      `Телефон: ${order.phone}`,
      `Почта: ${order.email}`,
      `Сумма: ${money(order.price)}`,
      order.comment,
    ].join('\n')
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
      <p className="mt-2 text-sm text-slate-400">Покажите этот код в типографии или дождитесь звонка менеджера</p>
      {src && (
        <img src={src} alt="QR-код заказа" className="mx-auto mt-6 size-44 rounded-2xl border border-slate-100 p-2 shadow-sm" />
      )}
      <p className="mx-auto mt-4 max-w-[220px] text-sm text-slate-700">QR-код для получения подробной информации</p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 py-3.5 text-sm font-semibold tracking-wide text-blue-600 uppercase"
        >
          Скачать <Download className="size-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-blue-600 py-3.5 text-sm font-semibold tracking-wide text-white uppercase"
        >
          Закрыть
        </button>
      </div>
    </div>
  )
}
