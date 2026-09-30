import { Check, ChevronDown, CircleCheck, Copy, Download, Gift, Palette, PenTool, Printer, ScanLine, Upload } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { estimate, SERVICE_ORDER, SERVICES } from '@/features/orders/pricing'
import { createId } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { CustomOrder, ServiceType } from '@/types'

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

function money(price: number) {
  return `${new Intl.NumberFormat('ru-RU').format(price)} TMT`
}

export function OrderWizardPage() {
  const navigate = useNavigate()
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
      createdAt: new Date().toISOString(),
    }
    addOrder(order)
    setCreated(order)
  }

  if (created) {
    return (
      <Shell>
        <SuccessCard order={created} copied={copied} onCopy={() => setCopied(true)} onClose={() => navigate('/')} />
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Способ заказа</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
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
      <Link to="/catalog" className="mt-3 inline-block text-sm text-blue-600 underline">
        или выбрать из каталога
      </Link>

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
        <p className="text-sm text-slate-500">{money(quote.price)}</p>
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

function SmoothSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(control, 'flex items-center justify-between text-left')}
        onClick={() => setOpen((current) => !current)}
      >
        {value}
        <ChevronDown className={cn('size-4 text-slate-400 transition duration-300', open && 'rotate-180')} />
      </button>
      <div
        className={cn(
          'absolute z-20 mt-1 w-full origin-top overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg transition duration-300',
          open ? 'pointer-events-auto scale-y-100 opacity-100' : 'pointer-events-none scale-y-95 opacity-0',
        )}
      >
        {options.map((item) => (
          <button
            key={item}
            type="button"
            className={cn(
              'block w-full px-4 py-2.5 text-left text-sm transition hover:bg-blue-50',
              item === value ? 'bg-blue-600 text-white hover:bg-blue-600' : 'text-slate-800',
            )}
            onClick={() => {
              onChange(item)
              setOpen(false)
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="rounded-[28px] bg-white px-5 py-7 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:px-8">{children}</div>
    </div>
  )
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
