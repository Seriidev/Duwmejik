'use client'

import { Check, CircleCheck, Copy, Download, Gift, Image as ImageIcon, LayoutGrid, Palette, PenTool, Printer, ScanLine, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import QRCode from 'qrcode'
import cardPreview from '@/assets/card-preview.jpg'
import { SmoothSelect } from '@/components/ui/SmoothSelect'
import { estimate, SERVICE_ORDER, SERVICES } from '@/features/orders/pricing'
import { createId } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { CustomOrder, Product, ServiceType } from '@/types'

const FORMATS = ['90×50 or A4', '90×50', 'A6', 'A5', 'A4', 'A3']
const PAPERS = ['Мелованная 300', 'Мелованная 170', 'Офсетная 80', 'Картон']
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
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CustomOrder | null>(null)
  const [copied, setCopied] = useState(false)
  const [pickedTitle, setPickedTitle] = useState(selectedProduct?.title ?? '')
  const [pickedId, setPickedId] = useState(selectedProduct?.id ?? '')
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
    setError('')
  }

  useEffect(() => {
    if (!selectedProduct) return
    applyDesign(selectedProduct)
    setPickedFrom(selectedFrom ?? null)
  }, [selectedProduct, selectedFrom])

  const quote = estimate(service, 'standard', quantity)

  function pickService(id: ServiceType) {
    setService(id)
    setSubtype(SERVICES[id].subtypes[0])
    setError('')
  }

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
      days: quote.days,
      status: 'new',
      customerName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      comment: comment.trim(),
      quantity,
      references: files,
      brief: { source: files.length ? 'upload' : 'catalog', format, paper, company: '' },
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {SERVICE_ORDER.map((id) => {
          const active = service === id
          const Icon = serviceIcons[id]
          return (
            <button
              key={id}
              type="button"
              onClick={() => pickService(id)}
              className={cn(
                'relative rounded-2xl border px-3 py-4 text-left',
                active ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white',
              )}
            >
              {active && <Check className="absolute top-3 right-3 size-4 text-blue-600" />}
              <Icon className={cn('size-5', active ? 'text-blue-600' : 'text-slate-700')} />
              <span className="mt-3 block text-sm font-semibold text-slate-900">{SERVICES[id].title}</span>
              <span className="mt-1 block text-xs leading-4 text-slate-400">{SERVICES[id].subtypes.slice(0, 2).join(', ')}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
        <PickSource
          title="Gallery"
          subtitle="Готовые шаблоны"
          icon={ImageIcon}
          product={pickedFrom === 'gallery' ? pickedTitle : ''}
          onClick={() => (onOpenGallery ? onOpenGallery() : router.push('/templates?pick=gallery'))}
        />
        <PickSource
          title="Выбрать"
          subtitle="Шаблоны дизайнеров"
          icon={LayoutGrid}
          product={pickedFrom === 'templates' ? pickedTitle : ''}
          onClick={() => (onOpenTemplates ? onOpenTemplates() : router.push('/templates?pick=templates'))}
        />
      </div>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-2 text-sm text-slate-600">
          Изделие
          <SmoothSelect value={subtype} options={SERVICES[service].subtypes} onChange={setSubtype} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 text-sm text-slate-600">
            Формат
            <SmoothSelect value={format} options={FORMATS} onChange={setFormat} />
          </div>
          <div className="grid gap-2 text-sm text-slate-600">
            Бумага
            <SmoothSelect value={paper} options={PAPERS} onChange={setPaper} />
          </div>
        </div>
        <label className="grid gap-2 text-sm text-slate-600">
          Тираж, шт.
          <input
            className={control}
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          />
        </label>
        <label className="grid gap-2 text-sm text-slate-600">
          Имя
          <input className={control} placeholder="Имя и фамилия" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-600">
            Почта
            <input className={control} type="email" placeholder="Почта" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm text-slate-600">
            Телефон
            <input className={control} placeholder="+993" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-600">
            Описание задачи
            <textarea
              className="min-h-40 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none"
              placeholder="Опишите макет, тираж и пожелания"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>
          <div className="grid gap-2 text-sm text-slate-600">
            Загрузить макет
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-6 text-center">
              <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500">
                <Upload className="size-5" />
              </span>
              <span className="mt-3 text-sm font-medium text-slate-800">Загрузите свой макет</span>
              <span className="mt-1 text-xs text-slate-400">JPG, PNG, PDF, PSD, AI</span>
              {files.length > 0 && <span className="mt-2 text-xs text-slate-600">{files.join(', ')}</span>}
              <input
                type="file"
                className="hidden"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.psd,.ai"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []).map((file) => file.name))}
              />
            </label>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-right text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={submit}
          className="h-11 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold tracking-wide text-slate-800"
        >
          Отправить
        </button>
      </div>
    </Shell>
  )
}

function PickSource({
  title,
  subtitle,
  icon: Icon,
  product,
  onClick,
}: {
  title: string
  subtitle: string
  icon: typeof ImageIcon
  product: string
  onClick: () => void
}) {
  const chosen = Boolean(product)
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-2xl border px-3 py-4 text-left',
        chosen ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white',
      )}
    >
      {chosen && <Check className="absolute top-3 right-3 size-4 text-blue-600" />}
      {chosen ? (
        <img src={cardPreview.src} alt="" className="h-14 w-full rounded-xl object-cover" />
      ) : (
        <Icon className={cn('size-5', chosen ? 'text-blue-600' : 'text-slate-700')} />
      )}
      <span className="mt-3 block text-sm font-semibold text-slate-900">{title}</span>
      <span className="mt-1 block truncate text-xs leading-4 text-slate-400">{chosen ? product : subtitle}</span>
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
