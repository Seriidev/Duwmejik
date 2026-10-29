'use client'

import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Briefcase,
  Camera,
  Check,
  ChevronDown,
  Clapperboard,
  Contact,
  Download,
  FileText,
  Globe,
  Image as ImageIcon,
  ImagePlus,
  Link2,
  List,
  Mail,
  MapPin,
  MessageCircle,
  Music,
  Palette,
  Pencil,
  Phone,
  Share2,
  Smartphone,
  Ticket,
  User,
  UtensilsCrossed,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'
import { SmoothSelect } from '@/components/ui/SmoothSelect'
import { QrCard } from '@/features/catalog/QrCard'
import { cn } from '@/lib/cn'
import { createQrId, emptyQrDoc, isHostedQr, qrColor, qrReady, qrTarget, saveQrPage, type QrDoc, type QrKind } from '@/lib/qrDoc'

const types: { id: QrKind; title: string; text: string; icon: LucideIcon }[] = [
  { id: 'pdf', title: 'PDF', text: 'Show a PDF', icon: FileText },
  { id: 'links', title: 'List of Links', text: 'Share multiple links', icon: List },
  { id: 'vcard', title: 'vCard', text: 'Share a digital business card', icon: Contact },
  { id: 'business', title: 'Business', text: 'Share information about your business', icon: Briefcase },
  { id: 'video', title: 'Video', text: 'Show a video', icon: Clapperboard },
  { id: 'images', title: 'Images', text: 'Share multiple images', icon: ImageIcon },
  { id: 'contact', title: 'Contact', text: 'Add to phone contacts', icon: User },
  { id: 'instagram', title: 'Instagram', text: 'Share your Instagram', icon: Camera },
  { id: 'social', title: 'Social Media', text: 'Share your social channels', icon: Link2 },
  { id: 'whatsapp', title: 'WhatsApp', text: 'Get WhatsApp messages', icon: MessageCircle },
  { id: 'mp3', title: 'MP3', text: 'Share an audio file', icon: Music },
  { id: 'apps', title: 'Apps', text: 'Redirect to an app store', icon: Smartphone },
  { id: 'menu', title: 'Menu', text: 'Create a restaurant menu', icon: UtensilsCrossed },
  { id: 'coupon', title: 'Coupon', text: 'Share a coupon', icon: Ticket },
  { id: 'wifi', title: 'WiFi', text: 'Connect to a Wi-Fi network', icon: Wifi },
  { id: 'website', title: 'Website', text: 'Link to any website URL', icon: Globe },
]

const palettes = [
  ['#527AC9', '#7EC09F'],
  ['#F3F4F6', '#111827'],
  ['#BFDBFE', '#2563EB'],
  ['#DDD6FE', '#111827'],
  ['#BBF7D0', '#111827'],
  ['#FDE68A', '#111827'],
]

const steps = ['Select QR type', 'Add content', 'Design QR code', 'Download QR code']
const shortSteps = ['Type', 'Content', 'Design', 'Download']

type ColorMode = 'rgb' | 'cmyk'
type Cmyk = { c: number; m: number; y: number; k: number }
type QrShape = 'square' | 'rounded'

const printPngSize = 1000

function clampInk(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

function cmykToHex(color: Cmyk) {
  const c = color.c / 100
  const m = color.m / 100
  const y = color.y / 100
  const k = color.k / 100
  const channels = [255 * (1 - c) * (1 - k), 255 * (1 - m) * (1 - k), 255 * (1 - y) * (1 - k)]
  return `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

function hexToCmyk(hex: string): Cmyk {
  const safe = qrColor(hex, '#111827').slice(1)
  const value = Number.parseInt(safe, 16)
  const red = ((value >> 16) & 255) / 255
  const green = ((value >> 8) & 255) / 255
  const blue = (value & 255) / 255
  const k = 1 - Math.max(red, green, blue)
  if (k >= 0.999) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: clampInk(((1 - red - k) / (1 - k)) * 100),
    m: clampInk(((1 - green - k) / (1 - k)) * 100),
    y: clampInk(((1 - blue - k) / (1 - k)) * 100),
    k: clampInk(k * 100),
  }
}

function deviceCmyk(color: Cmyk) {
  return `device-cmyk(${color.c}% ${color.m}% ${color.y}% ${color.k}%)`
}

function withCmykFills(svg: string, darkHex: string, lightHex: string, dark: Cmyk, light: Cmyk) {
  const paint = (source: string, hex: string, color: Cmyk) =>
    source.replaceAll(new RegExp(`fill="${hex}"`, 'ig'), `fill="${hex}" style="fill:${deviceCmyk(color)}"`)
  return paint(paint(svg, darkHex, dark), lightHex, light)
}

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function renderQrSvg(text: string, shape: QrShape, logo: string, dark: string, light: string) {
  const qr = QRCode.create(text, { errorCorrectionLevel: logo ? 'H' : 'M' })
  const count = qr.modules.size
  const cell = 10
  const margin = cell * 2
  const span = count * cell
  const width = span + margin * 2
  const dot = (row: number, col: number) => row >= 0 && col >= 0 && row < count && col < count && qr.modules.get(row, col) === 1
  const finderAt = (row: number, col: number) =>
    [
      [0, 0],
      [0, count - 7],
      [count - 7, 0],
    ].some(([startRow, startCol]) => row >= startRow && row < startRow + 7 && col >= startCol && col < startCol + 7)
  const parts = [`<rect width="${width}" height="${width}" fill="${light}"/>`]
  if (shape === 'square') {
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (!dot(row, col)) continue
        parts.push(`<rect x="${margin + col * cell}" y="${margin + row * cell}" width="${cell}" height="${cell}" fill="${dark}"/>`)
      }
    }
  } else {
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (!dot(row, col) || finderAt(row, col)) continue
        const cx = margin + col * cell + cell / 2
        const cy = margin + row * cell + cell / 2
        parts.push(`<circle cx="${cx}" cy="${cy}" r="${cell / 2 + 0.6}" fill="${dark}"/>`)
        if (dot(row, col + 1) && !finderAt(row, col + 1)) {
          parts.push(`<rect x="${cx}" y="${cy - cell / 2}" width="${cell}" height="${cell}" fill="${dark}"/>`)
        }
        if (dot(row + 1, col) && !finderAt(row + 1, col)) {
          parts.push(`<rect x="${cx - cell / 2}" y="${cy}" width="${cell}" height="${cell}" fill="${dark}"/>`)
        }
      }
    }
    ;([
      [0, 0],
      [0, count - 7],
      [count - 7, 0],
    ] as const).forEach(([row, col]) => {
      const x = margin + col * cell
      const y = margin + row * cell
      parts.push(`<rect x="${x}" y="${y}" width="${cell * 7}" height="${cell * 7}" rx="${cell * 1.8}" fill="${dark}"/>`)
      parts.push(`<rect x="${x + cell}" y="${y + cell}" width="${cell * 5}" height="${cell * 5}" rx="${cell * 1.2}" fill="${light}"/>`)
      parts.push(`<rect x="${x + cell * 2}" y="${y + cell * 2}" width="${cell * 3}" height="${cell * 3}" rx="${cell * 0.8}" fill="${dark}"/>`)
    })
  }
  const logoMark = logo
    ? { cx: margin + span / 2, cy: margin + span / 2, radius: span * 0.15, href: logo }
    : null
  if (logoMark) {
    const { cx, cy, radius } = logoMark
    const side = radius * 2
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${radius + cell * 0.45}" fill="${light}"/>`)
    parts.push(`<defs><clipPath id="qr-logo"><circle cx="${cx}" cy="${cy}" r="${radius}"/></clipPath></defs>`)
    parts.push(
      `<image href="${logo}" x="${cx - radius}" y="${cy - radius}" width="${side}" height="${side}" clip-path="url(#qr-logo)" preserveAspectRatio="xMidYMid slice"/>`,
    )
  }
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${width}" width="${width}" height="${width}">${parts.join('')}</svg>`,
    width,
    logoMark,
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('QR image failed'))
    image.src = src
  })
}

async function svgToPng(art: { svg: string; width: number; logoMark: { cx: number; cy: number; radius: number; href: string } | null }, px: number) {
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(art.svg)}`)
  const canvas = document.createElement('canvas')
  canvas.width = px
  canvas.height = px
  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(image, 0, 0, px, px)
  if (art.logoMark) {
    const badge = await loadImage(art.logoMark.href)
    const scale = px / art.width
    const { cx, cy, radius } = art.logoMark
    context.save()
    context.beginPath()
    context.arc(cx * scale, cy * scale, radius * scale, 0, Math.PI * 2)
    context.clip()
    context.drawImage(badge, (cx - radius) * scale, (cy - radius) * scale, radius * 2 * scale, radius * 2 * scale)
    context.restore()
  }
  return new Promise<Blob | null>((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
}

function previewDoc(kind: QrKind): QrDoc {
  const base = { ...emptyQrDoc(), kind, primary: '#2563EB', secondary: '#BFDBFE' }
  if (kind === 'pdf') return { ...base, title: 'Annual Report', text: 'Our best year yet. See how the numbers look.', url: 'https://example.com/report.pdf' }
  if (kind === 'video') return { ...base, title: 'Showreel', text: 'A short film about the work.', url: 'https://example.com/showreel' }
  if (kind === 'mp3') return { ...base, title: 'Track', text: 'Listen to the audio.', url: 'https://example.com/track.mp3' }
  if (kind === 'vcard') return { ...base, name: 'Alvaro', surname: 'Morte', role: 'General Director', phone: '+993 65 000000', email: 'alvaro@duwmejik.com', company: 'Duwmejik' }
  if (kind === 'business') return { ...base, company: 'Duwmejik', text: 'Print house in Ashgabat.', phone: '+993 65 000000', email: 'hello@duwmejik.com', site: 'https://duwmejik.com', address: 'Ashgabat' }
  if (kind === 'menu') return { ...base, title: 'Lunch menu', items: [{ label: 'Soup', value: '12 TMT' }, { label: 'Salad', value: '18 TMT' }, { label: 'Tea', value: '4 TMT' }] }
  if (kind === 'coupon') return { ...base, title: 'Welcome gift', code: 'PRINT10', message: '31 Dec', text: '10% off the first order.' }
  if (kind === 'links') return { ...base, title: 'Useful links', items: [{ label: 'Website', value: 'https://duwmejik.com' }, { label: 'Catalog', value: 'https://duwmejik.com/templates' }] }
  if (kind === 'social') return { ...base, title: 'Duwmejik', name: 'duwmejik', url: 'https://facebook.com/duwmejik', site: 'https://duwmejik.com', phone: '99365000000' }
  if (kind === 'contact') return { ...base, name: 'Seyran', surname: 'Hudayberanov', phone: '+993 65 000000', email: 'seyran@duwmejik.com', company: 'Duwmejik', role: 'Director' }
  if (kind === 'website' || kind === 'apps') return { ...base, title: kind === 'website' ? 'Website' : 'App', url: 'https://duwmejik.com' }
  if (kind === 'instagram') return { ...base, name: 'duwmejik', title: 'Instagram' }
  if (kind === 'whatsapp') return { ...base, phone: '99365000000', title: 'WhatsApp' }
  if (kind === 'wifi') return { ...base, ssid: 'Duwmejik Guest', password: 'welcome' }
  return { ...base, title: 'Gallery', text: 'A few photos in one page.' }
}

function rows(doc: QrDoc, count: number) {
  const items = doc.items.slice(0, count)
  while (items.length < count) items.push({ label: '', value: '' })
  return items
}

async function shrinkPhoto(file: File, limit = 1500) {
  const bitmap = await createImageBitmap(file)
  let size = limit > 1000 ? 72 : 48
  let quality = 0.62
  let data = ''
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const context = canvas.getContext('2d')
    if (!context) break
    const scale = Math.max(size / bitmap.width, size / bitmap.height)
    const width = bitmap.width * scale
    const height = bitmap.height * scale
    context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height)
    data = canvas.toDataURL('image/jpeg', quality)
    if (data.length < limit) break
    size = Math.max(36, size - 8)
    quality = Math.max(0.35, quality - 0.08)
  }
  bitmap.close()
  return data
}

async function readLogo(file: File) {
  const bitmap = await createImageBitmap(file)
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return ''
  }
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height)
  bitmap.close()
  return canvas.toDataURL('image/png')
}

function readStep(value: string | null) {
  const step = Number(value)
  return step >= 1 && step <= 4 ? step : 1
}

export function QrGenerator() {
  const params = useSearchParams()
  const [step, setStep] = useState(readStep(params.get('step')))
  const [doc, setDoc] = useState<QrDoc>(emptyQrDoc)
  const [view, setView] = useState<'page' | 'qr'>('page')
  const [ink, setInk] = useState('#111827')
  const [paper, setPaper] = useState('#ffffff')
  const [colorMode, setColorMode] = useState<ColorMode>('rgb')
  const [inkCmyk, setInkCmyk] = useState<Cmyk>({ c: 0, m: 0, y: 0, k: 100 })
  const [paperCmyk, setPaperCmyk] = useState<Cmyk>({ c: 0, m: 0, y: 0, k: 0 })
  const [shape, setShape] = useState<QrShape>('square')
  const [logo, setLogo] = useState('')
  const [src, setSrc] = useState('')
  const [hoverKind, setHoverKind] = useState<QrKind>('pdf')
  const [pageId, setPageId] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPop() {
      setStep(readStep(new URLSearchParams(window.location.search).get('step')))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const scroller = rootRef.current?.parentElement
    if (scroller instanceof HTMLElement) scroller.scrollTop = 0
    window.scrollTo(0, 0)
  }, [step])

  function goStep(next: number) {
    const safe = Math.min(4, Math.max(1, next))
    if (safe === step) return
    const search = new URLSearchParams(window.location.search)
    search.set('section', 'qr')
    if (safe === 1) search.delete('step')
    else search.set('step', String(safe))
    window.history.pushState({ panel: 'qr', step: safe }, '', `/templates?${search.toString()}`)
    setStep(safe)
  }

  useEffect(() => {
    if (!pageId) setPageId(createQrId())
  }, [pageId])

  useEffect(() => {
    if (isHostedQr(doc.kind)) {
      if (!pageId) return
      saveQrPage(pageId, doc)
    }
    const next = !qrReady(doc)
      ? ''
      : isHostedQr(doc.kind)
        ? `${window.location.origin}/q?d=${pageId}`
        : qrTarget(doc, window.location.origin)
    if (!next) {
      setSrc('')
      return
    }
    const art = renderQrSvg(next, shape, logo, qrColor(ink, '#111827'), qrColor(paper, '#ffffff'))
    setSrc(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(art.svg)}`)
  }, [doc, ink, paper, shape, logo, pageId])

  function patch(partial: Partial<QrDoc>) {
    setDoc((current) => ({ ...current, ...partial }))
  }

  function setItem(index: number, key: 'label' | 'value' | 'image', value: string, count: number) {
    const items = rows(doc, count)
    items[index] = { ...items[index], [key]: value }
    patch({ items })
  }

  const selected = types.find((type) => type.id === doc.kind)

  return (
    <div ref={rootRef} className="flex-1 bg-[#f4f7fb] px-4 py-6 sm:px-6">
      <Stepper
        step={step}
        onStep={(next) => {
          if (next < step) window.history.go(next - step)
        }}
      />
      {step === 1 ? (
        <div className="mx-auto mt-8 grid w-full max-w-5xl items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">1. Select QR type</h1>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {types.map((type) => {
                const active = hoverKind === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onMouseEnter={() => setHoverKind(type.id)}
                    onClick={() => {
                      setDoc({ ...emptyQrDoc(), kind: type.id })
                      setLogo('')
                      goStep(2)
                      setView('page')
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left',
                      active ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/70',
                    )}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-600">
                      <type.icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{type.title}</span>
                      <span className="block text-xs text-slate-400">{type.text}</span>
                    </span>
                    {type.id === 'contact' && <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Free</span>}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="sticky top-4 hidden lg:block">
            <PhoneShell>
              <QrCard doc={previewDoc(hoverKind)} />
            </PhoneShell>
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-6 grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {step}. {steps[step - 1]}
              {step === 2 ? ' to your QR code' : ''}
            </h1>
            <div className="mt-4 grid gap-3">
              {step === 2 && <ContentForm doc={doc} onPatch={patch} onItem={setItem} />}
              {step === 3 && (
                <DesignForm
                  mode={colorMode}
                  shape={shape}
                  logo={logo}
                  ink={ink}
                  paper={paper}
                  inkCmyk={inkCmyk}
                  paperCmyk={paperCmyk}
                  onShape={(next) => {
                    setShape(next)
                    setView('qr')
                  }}
                  onLogo={(next) => {
                    setLogo(next)
                    setView('qr')
                  }}
                  onMode={(mode) => {
                    setColorMode(mode)
                    if (mode === 'cmyk') {
                      const nextInk = hexToCmyk(ink)
                      const nextPaper = hexToCmyk(paper)
                      setInkCmyk(nextInk)
                      setPaperCmyk(nextPaper)
                      setInk(cmykToHex(nextInk))
                      setPaper(cmykToHex(nextPaper))
                    }
                  }}
                  onInk={setInk}
                  onPaper={setPaper}
                  onInkCmyk={(next) => {
                    setInkCmyk(next)
                    setInk(cmykToHex(next))
                  }}
                  onPaperCmyk={(next) => {
                    setPaperCmyk(next)
                    setPaper(cmykToHex(next))
                  }}
                />
              )}
              {step === 4 && (
                <DownloadForm
                  ready={qrReady(doc)}
                  kind={selected?.title ?? 'QR'}
                  target={typeof window === 'undefined' || !qrReady(doc) ? '' : isHostedQr(doc.kind) ? `${window.location.origin}/q?d=${pageId}` : qrTarget(doc, window.location.origin)}
                  ink={ink}
                  paper={paper}
                  mode={colorMode}
                  shape={shape}
                  logo={logo}
                  inkCmyk={inkCmyk}
                  paperCmyk={paperCmyk}
                />
              )}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 text-sm font-semibold text-blue-700"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
              {step < 4 && (
                <button
                  type="button"
                  onClick={() => goStep(step + 1)}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          </div>
          <PhoneFrame view={view} onView={setView} src={src}>
            <QrCard doc={doc} />
          </PhoneFrame>
        </div>
      )}
    </div>
  )
}

function Stepper({ step, onStep }: { step: number; onStep: (step: number) => void }) {
  return (
    <div className="flex flex-nowrap items-center justify-between gap-1 text-[11px] sm:justify-center sm:gap-x-2 sm:text-sm">
      {steps.map((label, index) => {
        const number = index + 1
        const done = number < step
        const current = number === step
        return (
          <div key={label} className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                if (number < step) onStep(number)
              }}
              className={cn('inline-flex items-center gap-1 sm:gap-2', number > step && 'cursor-default')}
            >
              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold sm:size-6 sm:text-xs',
                  done || current ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500',
                )}
              >
                {done ? <Check className="size-3 sm:size-3.5" /> : number}
              </span>
              <span className={cn('font-medium whitespace-nowrap sm:hidden', current ? 'text-blue-700' : done ? 'text-slate-700' : 'text-slate-400')}>
                {shortSteps[index]}
              </span>
              <span className={cn('hidden font-medium whitespace-nowrap sm:inline', current ? 'text-blue-700' : done ? 'text-slate-700' : 'text-slate-400')}>
                {label}
              </span>
            </button>
            {number < steps.length && <span className={cn('hidden h-px w-6 sm:block', number < step ? 'bg-blue-400' : 'bg-slate-200')} />}
          </div>
        )
      })}
    </div>
  )
}

function ContentForm({
  doc,
  onPatch,
  onItem,
}: {
  doc: QrDoc
  onPatch: (partial: Partial<QrDoc>) => void
  onItem: (index: number, key: 'label' | 'value' | 'image', value: string, count: number) => void
}) {
  const person = doc.kind === 'vcard' || doc.kind === 'contact'
  const hosted = person || doc.kind === 'business' || doc.kind === 'menu' || doc.kind === 'coupon' || doc.kind === 'links' || doc.kind === 'social' || doc.kind === 'images' || doc.kind === 'pdf' || doc.kind === 'video' || doc.kind === 'mp3'
  return (
    <>
      {hosted && <DesignSection doc={doc} onPatch={onPatch} />}
      {person && <VcardFields doc={doc} onPatch={onPatch} />}
      {doc.kind === 'business' && <BusinessFields doc={doc} onPatch={onPatch} />}
      {doc.kind === 'pdf' && <PdfFields doc={doc} onPatch={onPatch} />}
      {(doc.kind === 'video' || doc.kind === 'mp3') && (
        <Section icon={<FileText className="size-4" />} title="File" text="Add a title and a link.">
          <div className="grid gap-3">
            <Field label="Title" value={doc.title} onChange={(title) => onPatch({ title })} />
            <Field label="Link" value={doc.url} placeholder="https://" icon={Link2} onChange={(url) => onPatch({ url })} />
          </div>
        </Section>
      )}
      {(doc.kind === 'website' || doc.kind === 'apps') && (
        <Section icon={<Globe className="size-4" />} title="Link" text="The QR code will open this address.">
          <Field label="URL" value={doc.url} placeholder="https://" icon={Link2} onChange={(url) => onPatch({ url })} />
        </Section>
      )}
      {doc.kind === 'instagram' && (
        <Section icon={<Camera className="size-4" />} title="Instagram" text="The QR code will open this profile.">
          <Field label="Username" value={doc.name} placeholder="duwmejik" onChange={(name) => onPatch({ name })} />
        </Section>
      )}
      {doc.kind === 'whatsapp' && (
        <Section icon={<MessageCircle className="size-4" />} title="WhatsApp" text="People can message this number.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone" value={doc.phone} placeholder="99361..." icon={Phone} onChange={(phone) => onPatch({ phone })} />
            <Field label="Message" value={doc.message} onChange={(message) => onPatch({ message })} />
          </div>
        </Section>
      )}
      {doc.kind === 'wifi' && (
        <Section icon={<Wifi className="size-4" />} title="Wi-Fi" text="The phone will offer to join this network.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Network name" value={doc.ssid} onChange={(ssid) => onPatch({ ssid })} />
            <Field label="Password" value={doc.password} onChange={(password) => onPatch({ password })} />
            <div className="grid gap-1.5 text-sm font-medium text-slate-800">
              Security
              <SmoothSelect
                value={doc.security}
                options={[
                  { value: 'WPA', label: 'WPA / WPA2' },
                  { value: 'WEP', label: 'WEP' },
                  { value: 'nopass', label: 'No password' },
                ]}
                onChange={(security) => onPatch({ security })}
              />
            </div>
          </div>
        </Section>
      )}
      {doc.kind === 'coupon' && (
        <Section icon={<Ticket className="size-4" />} title="Coupon" text="This page opens when the code is scanned.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" value={doc.title} onChange={(title) => onPatch({ title })} />
            <Field label="Code" value={doc.code} onChange={(code) => onPatch({ code })} />
            <Field label="Details" value={doc.text} onChange={(text) => onPatch({ text })} />
            <Field label="Valid until" value={doc.message} placeholder="31.12.2026" onChange={(message) => onPatch({ message })} />
          </div>
        </Section>
      )}
      {doc.kind === 'social' && (
        <Section icon={<Share2 className="size-4" />} title="Social channels" text="Each button on the page opens one channel.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Facebook" value={doc.url} placeholder="https://" onChange={(url) => onPatch({ url })} />
            <Field label="Instagram" value={doc.name} placeholder="@name" onChange={(name) => onPatch({ name })} />
            <Field label="WhatsApp phone" value={doc.phone} icon={Phone} onChange={(phone) => onPatch({ phone })} />
            <Field label="Website" value={doc.site} icon={Globe} onChange={(site) => onPatch({ site })} />
          </div>
        </Section>
      )}
      {(doc.kind === 'links' || doc.kind === 'images' || doc.kind === 'menu') && (
        <ListFields doc={doc} onPatch={onPatch} onItem={onItem} />
      )}
    </>
  )
}

function PdfFields({ doc, onPatch }: { doc: QrDoc; onPatch: (partial: Partial<QrDoc>) => void }) {
  const [note, setNote] = useState('')
  const ready = doc.url.startsWith('data:')
  return (
    <Section icon={<FileText className="size-4" />} title="PDF" text="Upload the file. The QR code stays a short link to the page.">
      <div className="grid gap-3">
        <Field label="Title" value={doc.title} onChange={(title) => onPatch({ title })} />
        <label className="relative flex h-24 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-blue-400 bg-blue-50/40 text-sm text-blue-700">
          <FileText className="size-5" />
          <span className="max-w-full truncate px-4 font-semibold">{ready ? doc.message || 'PDF uploaded' : 'Choose a PDF'}</span>
          <span className="text-xs text-slate-400">Up to 1 MB</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              if (file.size > 1_000_000) {
                setNote('This PDF is too large. Choose a file under 1 MB.')
                return
              }
              const reader = new FileReader()
              reader.onload = () => {
                const url = String(reader.result || '')
                if (!url.startsWith('data:')) return
                setNote('')
                onPatch({ url, message: file.name })
              }
              reader.readAsDataURL(file)
            }}
          />
        </label>
        {note && <p className="text-sm text-rose-600">{note}</p>}
        {ready && (
          <button type="button" onClick={() => onPatch({ url: '', message: '' })} className="justify-self-start text-sm font-medium text-slate-500 hover:text-slate-800">
            Remove file
          </button>
        )}
      </div>
    </Section>
  )
}

function VcardFields({ doc, onPatch }: { doc: QrDoc; onPatch: (partial: Partial<QrDoc>) => void }) {
  return (
    <>
      <Section icon={<User className="size-4" />} title="Personal Information" text="Fill in your information.">
        <PhotoField photo={doc.photo} onPhoto={(photo) => onPatch({ photo })} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Name" required value={doc.name} placeholder="E.g. John" icon={User} onChange={(name) => onPatch({ name })} />
          <Field label="Surname" value={doc.surname} placeholder="E.g. Carlson" icon={User} onChange={(surname) => onPatch({ surname })} />
          <Field label="Position" value={doc.role} placeholder="E.g. Account Manager" onChange={(role) => onPatch({ role })} />
          <Field label="About" value={doc.text} placeholder="A short introduction" onChange={(text) => onPatch({ text })} />
        </div>
      </Section>
      <Section icon={<Phone className="size-4" />} title="Contact Details" text="How people can reach you.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone" value={doc.phone} placeholder="555-100-1000" icon={Phone} onChange={(phone) => onPatch({ phone })} />
          <Field label="Email" value={doc.email} placeholder="john@email.com" icon={Mail} onChange={(email) => onPatch({ email })} />
          <Field label="Company" value={doc.company} icon={Briefcase} onChange={(company) => onPatch({ company })} />
          <Field label="Work phone" value={doc.companyPhone} icon={Phone} onChange={(companyPhone) => onPatch({ companyPhone })} />
          <Field label="Work email" value={doc.companyEmail} icon={Mail} onChange={(companyEmail) => onPatch({ companyEmail })} />
          <Field label="Website" value={doc.site} icon={Globe} onChange={(site) => onPatch({ site })} />
          <Field label="Address" value={doc.address} icon={MapPin} onChange={(address) => onPatch({ address })} />
        </div>
      </Section>
    </>
  )
}

function BusinessFields({ doc, onPatch }: { doc: QrDoc; onPatch: (partial: Partial<QrDoc>) => void }) {
  return (
    <>
      <Section icon={<Briefcase className="size-4" />} title="Business" text="Share information about your business.">
        <PhotoField photo={doc.photo} onPhoto={(photo) => onPatch({ photo })} />
        <div className="mt-4 grid gap-3">
          <Field label="Company" value={doc.company} onChange={(company) => onPatch({ company })} />
          <Field label="About" value={doc.text} onChange={(text) => onPatch({ text })} />
        </div>
      </Section>
      <Section icon={<Phone className="size-4" />} title="Contact Details" text="How people can reach the business.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone" value={doc.phone} icon={Phone} onChange={(phone) => onPatch({ phone })} />
          <Field label="Email" value={doc.email} icon={Mail} onChange={(email) => onPatch({ email })} />
          <Field label="Website" value={doc.site} icon={Globe} onChange={(site) => onPatch({ site })} />
          <Field label="Address" value={doc.address} icon={MapPin} onChange={(address) => onPatch({ address })} />
        </div>
      </Section>
    </>
  )
}

function ListFields({
  doc,
  onPatch,
  onItem,
}: {
  doc: QrDoc
  onPatch: (partial: Partial<QrDoc>) => void
  onItem: (index: number, key: 'label' | 'value' | 'image', value: string, count: number) => void
}) {
  const count = doc.kind === 'menu' ? 6 : 4
  const title = doc.kind === 'menu' ? 'Menu' : doc.kind === 'images' ? 'Images' : 'Links'
  const text = doc.kind === 'menu' ? 'Dishes and prices on the page.' : doc.kind === 'images' ? 'Image links shown on the page.' : 'Buttons on the page.'
  const left = doc.kind === 'menu' ? 'Dish' : doc.kind === 'images' ? 'Caption' : 'Name'
  const right = doc.kind === 'images' ? 'Image URL' : doc.kind === 'menu' ? 'Price' : 'URL'
  return (
    <Section icon={<List className="size-4" />} title={title} text={text}>
      <div className={cn('flex gap-3', doc.kind === 'menu' ? 'items-end' : '')}>
        {doc.kind === 'menu' && <PhotoField label="Logo" photo={doc.photo} onPhoto={(photo) => onPatch({ photo })} />}
        <div className="min-w-0 flex-1">
          <Field label={doc.kind === 'menu' ? 'Restaurant' : 'Title'} value={doc.title} onChange={(title) => onPatch({ title })} />
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {rows(doc, count).map((item, index) => (
          <div key={index} className={cn('grid gap-2', doc.kind === 'menu' ? 'grid-cols-[2.75rem_minmax(0,1fr)_minmax(0,1fr)]' : 'sm:grid-cols-2')}>
            {doc.kind === 'menu' && (
              <label className="relative grid size-11 cursor-pointer place-items-center overflow-hidden rounded-lg border border-dashed border-blue-300 text-blue-600">
                {item.image ? <img src={item.image} alt="" className="size-full object-cover" /> : <ImagePlus className="size-4" />}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label={`Photo ${index + 1}`}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (!file) return
                    shrinkPhoto(file, 700).then((image) => onItem(index, 'image', image, count))
                  }}
                />
              </label>
            )}
            <input className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-600" value={item.label} placeholder={left} onChange={(event) => onItem(index, 'label', event.target.value, count)} />
            <input className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-600" value={item.value} placeholder={right} onChange={(event) => onItem(index, 'value', event.target.value, count)} />
          </div>
        ))}
      </div>
    </Section>
  )
}

function DesignSection({ doc, onPatch }: { doc: QrDoc; onPatch: (partial: Partial<QrDoc>) => void }) {
  return (
    <Section icon={<Palette className="size-4" />} title="Design" text="Choose a color theme for your page.">
      <p className="text-sm font-medium text-slate-700">Color palette</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {palettes.map(([primary, secondary]) => {
          const active = doc.primary.toUpperCase() === primary && doc.secondary.toUpperCase() === secondary
          return (
            <button
              key={primary + secondary}
              type="button"
              aria-label={`${primary} ${secondary}`}
              onClick={() => onPatch({ primary, secondary })}
              className={cn('grid grid-cols-2 overflow-hidden rounded-md border-2', active ? 'border-blue-600' : 'border-transparent')}
            >
              <span className="size-7" style={{ background: primary }} />
              <span className="size-7" style={{ background: secondary }} />
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <ColorField label="Primary color" value={doc.primary} onChange={(primary) => onPatch({ primary })} />
        <button
          type="button"
          aria-label="Swap colors"
          onClick={() => onPatch({ primary: doc.secondary, secondary: doc.primary })}
          className="mb-0.5 grid size-9 place-items-center rounded-full border border-blue-600 text-blue-700"
        >
          <ArrowLeftRight className="size-4" />
        </button>
        <ColorField label="Secondary color" value={doc.secondary} onChange={(secondary) => onPatch({ secondary })} />
      </div>
    </Section>
  )
}

function DesignForm({
  mode,
  shape,
  logo,
  ink,
  paper,
  inkCmyk,
  paperCmyk,
  onMode,
  onShape,
  onLogo,
  onInk,
  onPaper,
  onInkCmyk,
  onPaperCmyk,
}: {
  mode: ColorMode
  shape: QrShape
  logo: string
  ink: string
  paper: string
  inkCmyk: Cmyk
  paperCmyk: Cmyk
  onMode: (mode: ColorMode) => void
  onShape: (shape: QrShape) => void
  onLogo: (logo: string) => void
  onInk: (value: string) => void
  onPaper: (value: string) => void
  onInkCmyk: (value: Cmyk) => void
  onPaperCmyk: (value: Cmyk) => void
}) {
  const shapes: { id: QrShape; label: string }[] = [
    { id: 'square', label: 'Square' },
    { id: 'rounded', label: 'Rounded' },
  ]
  return (
    <Section icon={<Palette className="size-4" />} title="QR code design" text="Shape, a center logo, and colors.">
      <p className="text-sm font-medium text-slate-700">Shape</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {shapes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onShape(item.id)}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left',
              shape === item.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white',
            )}
          >
            <ShapeMark kind={item.id} />
            <span className="text-sm font-semibold text-slate-900">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-slate-700">Logo</p>
        <div className="mt-2 flex items-center gap-3">
          <label className="relative grid size-16 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-blue-400 bg-white text-blue-600">
            {logo ? <img src={logo} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5" />}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                readLogo(file).then(onLogo)
              }}
            />
          </label>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Sits in the middle of the code.</p>
            {logo && (
              <button type="button" onClick={() => onLogo('')} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
                <X className="size-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 inline-flex rounded-full bg-slate-100 p-1">
        {(['rgb', 'cmyk'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onMode(item)}
            className={cn('h-9 rounded-full px-4 text-sm font-semibold', mode === item ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500')}
          >
            {item === 'rgb' ? 'RGB' : 'CMYK (print)'}
          </button>
        ))}
      </div>
      {mode === 'rgb' ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <ColorField label="Code color" value={ink} onChange={onInk} />
          <ColorField label="Background" value={paper} onChange={onPaper} />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <CmykField label="Code color" value={inkCmyk} onChange={onInkCmyk} />
          <CmykField label="Background" value={paperCmyk} onChange={onPaperCmyk} />
        </div>
      )}
    </Section>
  )
}

function ShapeMark({ kind }: { kind: QrShape }) {
  const rounded = kind === 'rounded'
  return (
    <svg viewBox="0 0 36 36" className="size-9 shrink-0" aria-hidden>
      <rect x="1" y="1" width="14" height="14" rx={rounded ? 4 : 1} fill="#111827" />
      <rect x="4" y="4" width="8" height="8" rx={rounded ? 2 : 0.5} fill="#ffffff" />
      <rect x="6.5" y="6.5" width="3" height="3" rx={rounded ? 1 : 0.4} fill="#111827" />
      {rounded ? (
        <>
          <circle cx="26" cy="8" r="2.2" fill="#111827" />
          <circle cx="31" cy="8" r="2.2" fill="#111827" />
          <rect x="26" y="5.8" width="5" height="4.4" fill="#111827" />
          <circle cx="26" cy="26" r="2.2" fill="#111827" />
          <circle cx="26" cy="31" r="2.2" fill="#111827" />
          <rect x="23.8" y="26" width="4.4" height="5" fill="#111827" />
        </>
      ) : (
        <>
          <rect x="22" y="4" width="5" height="5" fill="#111827" />
          <rect x="28" y="4" width="5" height="5" fill="#111827" />
          <rect x="22" y="22" width="5" height="5" fill="#111827" />
          <rect x="28" y="28" width="5" height="5" fill="#111827" />
        </>
      )}
    </svg>
  )
}

function CmykField({ label, value, onChange }: { label: string; value: Cmyk; onChange: (value: Cmyk) => void }) {
  const keys = ['c', 'm', 'y', 'k'] as const
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="mt-2 flex gap-2">
        {keys.map((key) => (
          <label key={key} className="grid w-14 gap-1 text-[11px] font-semibold text-slate-400">
            {key.toUpperCase()}
            <input
              type="number"
              min={0}
              max={100}
              value={value[key]}
              onChange={(event) => onChange({ ...value, [key]: clampInk(Number(event.target.value)) })}
              className="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm font-medium text-slate-800 outline-none"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function DownloadForm({
  ready,
  kind,
  target,
  ink,
  paper,
  mode,
  shape,
  logo,
  inkCmyk,
  paperCmyk,
}: {
  ready: boolean
  kind: string
  target: string
  ink: string
  paper: string
  mode: ColorMode
  shape: QrShape
  logo: string
  inkCmyk: Cmyk
  paperCmyk: Cmyk
}) {
  const dark = qrColor(ink, '#111827')
  const light = qrColor(paper, '#ffffff')

  function artwork() {
    const art = renderQrSvg(target, shape, logo, dark, light)
    if (mode === 'cmyk') art.svg = withCmykFills(art.svg, dark, light, inkCmyk, paperCmyk)
    return art
  }

  function downloadSvg() {
    if (!target) return
    saveBlob(`qr-${mode}.svg`, new Blob([artwork().svg], { type: 'image/svg+xml' }))
  }

  async function downloadPng() {
    if (!target) return
    const blob = await svgToPng(artwork(), printPngSize)
    if (blob) saveBlob(`qr-${mode}.png`, blob)
  }

  return (
    <Section icon={<Download className="size-4" />} title={kind} text={ready ? 'SVG for print, PNG as a light image.' : 'Go back and fill in the form first.'}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!ready || !target}
          onClick={() => void downloadSvg()}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500"
        >
          <Download className="size-4" />
          Download SVG
        </button>
        <button
          type="button"
          disabled={!ready || !target}
          onClick={() => void downloadPng()}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 text-sm font-semibold text-blue-700 disabled:border-slate-200 disabled:text-slate-400"
        >
          <Download className="size-4" />
          Download PNG
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        SVG — векторный файл, его удобно отдавать в типографию. PNG — сжатая картинка {printPngSize} px, её легче переслать. В режиме CMYK в SVG записываются краски для печати.
      </p>
    </Section>
  )
}

function Section({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 px-4 py-4 text-left">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-900">{title}</span>
          <span className="block text-sm text-slate-400">{text}</span>
        </span>
        <ChevronDown className={cn('size-4 text-slate-400 transition', !open && '-rotate-90')} />
      </button>
      {open && <div className="border-t border-slate-100 px-4 py-4">{children}</div>}
    </section>
  )
}

function PhotoField({ photo, onPhoto, label = 'Image' }: { photo: string; onPhoto: (photo: string) => void; label?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="mt-1 text-xs text-slate-400">Shown on the page. The QR code stays a link.</p>
      <label className="relative mt-2 grid size-20 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-blue-400 text-blue-600">
        {photo ? <img src={photo} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6" />}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            shrinkPhoto(file).then(onPhoto)
          }}
        />
      </label>
    </div>
  )
}

function Field({
  label,
  value,
  placeholder,
  icon: Icon,
  required,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  icon?: LucideIcon
  required?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-800">
      <span>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <span className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3">
        {Icon && <Icon className="size-4 shrink-0 text-slate-400" />}
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-normal outline-none placeholder:text-slate-400"
        />
      </span>
    </label>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const safe = qrColor(value, '#527AC9')
  return (
    <label className="grid min-w-[180px] flex-1 gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <span className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2">
        <span className="relative grid size-7 place-items-center rounded-md text-white" style={{ background: safe }}>
          <Pencil className="size-3.5" />
          <input type="color" value={safe} onChange={(event) => onChange(event.target.value.toUpperCase())} className="absolute inset-0 cursor-pointer opacity-0" />
        </span>
        <input value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} className="h-full min-w-0 flex-1 bg-transparent text-sm uppercase outline-none" />
      </span>
    </label>
  )
}

function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[270px] rounded-[40px] border-[8px] border-slate-900 bg-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
      <div className="relative h-[540px] overflow-hidden rounded-[32px] bg-white">
        <div className="absolute top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
        <div className="h-full w-full min-w-0 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
      </div>
    </div>
  )
}

function PhoneFrame({
  view,
  onView,
  src,
  children,
}: {
  view: 'page' | 'qr'
  onView: (view: 'page' | 'qr') => void
  src: string
  children: ReactNode
}) {
  return (
    <aside className="lg:sticky lg:top-4">
      <div className="mb-3 flex justify-center">
        <div className="inline-flex rounded-full bg-white p-1 shadow-sm">
          <button type="button" onClick={() => onView('page')} className={cn('h-8 rounded-full px-4 text-sm font-semibold', view === 'page' ? 'bg-blue-600 text-white' : 'text-slate-500')}>
            Preview
          </button>
          <button type="button" onClick={() => onView('qr')} className={cn('h-8 rounded-full px-4 text-sm font-semibold', view === 'qr' ? 'bg-blue-600 text-white' : 'text-slate-500')}>
            QR code
          </button>
        </div>
      </div>
      <PhoneShell>
        {view === 'qr' ? (
          <div className="grid h-full place-items-center bg-white px-8">
            {src ? <img src={src} alt="QR code" className="w-full" /> : <span className="text-sm text-slate-400">Fill in the form</span>}
          </div>
        ) : (
          children
        )}
      </PhoneShell>
    </aside>
  )
}
