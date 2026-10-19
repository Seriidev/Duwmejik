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
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'
import { SmoothSelect } from '@/components/ui/SmoothSelect'
import { QrCard } from '@/features/catalog/QrCard'
import { cn } from '@/lib/cn'
import { emptyQrDoc, qrColor, qrReady, qrTarget, type QrDoc, type QrKind } from '@/lib/qrDoc'

const types: { id: QrKind; title: string; text: string; icon: LucideIcon }[] = [
  { id: 'pdf', title: 'PDF', text: 'Show a PDF', icon: FileText },
  { id: 'links', title: 'List of Links', text: 'Share multiple links', icon: List },
  { id: 'vcard', title: 'vCard', text: 'Share a digital business card', icon: Contact },
  { id: 'business', title: 'Business', text: 'Share information about your business', icon: Briefcase },
  { id: 'video', title: 'Video', text: 'Show a video', icon: Clapperboard },
  { id: 'images', title: 'Images', text: 'Share multiple images', icon: ImageIcon },
  { id: 'facebook', title: 'Facebook', text: 'Share your Facebook page', icon: Share2 },
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

function rows(doc: QrDoc, count: number) {
  const items = doc.items.slice(0, count)
  while (items.length < count) items.push({ label: '', value: '' })
  return items
}

async function shrinkPhoto(file: File) {
  const bitmap = await createImageBitmap(file)
  let size = 72
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
    if (data.length < 1600) break
    size = Math.max(40, size - 8)
    quality = Math.max(0.35, quality - 0.08)
  }
  bitmap.close()
  return data
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
  const [src, setSrc] = useState('')

  useEffect(() => {
    function onPop() {
      setStep(readStep(new URLSearchParams(window.location.search).get('step')))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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
    const next = qrTarget(doc, window.location.origin)
    if (!next) {
      setSrc('')
      return
    }
    let alive = true
    QRCode.toDataURL(next, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: 'M',
      color: { dark: qrColor(ink, '#111827'), light: qrColor(paper, '#ffffff') },
    }).then((url) => {
      if (alive) setSrc(url)
    })
    return () => {
      alive = false
    }
  }, [doc, ink, paper])

  function patch(partial: Partial<QrDoc>) {
    setDoc((current) => ({ ...current, ...partial }))
  }

  function setItem(index: number, key: 'label' | 'value', value: string, count: number) {
    const items = rows(doc, count)
    items[index] = { ...items[index], [key]: value }
    patch({ items })
  }

  const selected = types.find((type) => type.id === doc.kind)

  return (
    <div className={cn('bg-[#f4f7fb] px-4 py-6 sm:px-6', step === 1 && 'flex flex-1 flex-col justify-center')}>
      <Stepper
        step={step}
        onStep={(next) => {
          if (next < step) window.history.go(next - step)
        }}
      />
      {step === 1 ? (
        <div className="mx-auto mt-8 max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">1. Select QR type</h1>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {types.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  patch({ kind: type.id })
                  goStep(2)
                  setView('page')
                }}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-500">
                  <type.icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{type.title}</span>
                  <span className="block text-xs text-slate-400">{type.text}</span>
                </span>
              </button>
            ))}
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
              {step === 3 && <DesignForm ink={ink} paper={paper} onInk={setInk} onPaper={setPaper} />}
              {step === 4 && <DownloadForm src={src} ready={qrReady(doc)} kind={selected?.title ?? 'QR'} />}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-emerald-500 bg-white px-4 text-sm font-semibold text-emerald-600"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
              {step < 4 && (
                <button
                  type="button"
                  onClick={() => goStep(step + 1)}
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-white hover:bg-emerald-600"
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
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm">
      {steps.map((label, index) => {
        const number = index + 1
        const done = number < step
        const current = number === step
        return (
          <div key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (number < step) onStep(number)
              }}
              className={cn('inline-flex items-center gap-2', number > step && 'cursor-default')}
            >
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full text-xs font-bold',
                  done || current ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500',
                )}
              >
                {done ? <Check className="size-3.5" /> : number}
              </span>
              <span className={cn('font-medium', current ? 'text-emerald-600' : done ? 'text-slate-700' : 'text-slate-400')}>{label}</span>
            </button>
            {number < steps.length && <span className={cn('hidden h-px w-6 sm:block', number < step ? 'bg-emerald-400' : 'bg-slate-200')} />}
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
  onItem: (index: number, key: 'label' | 'value', value: string, count: number) => void
}) {
  const hosted = doc.kind === 'vcard' || doc.kind === 'business' || doc.kind === 'menu' || doc.kind === 'coupon' || doc.kind === 'links' || doc.kind === 'social' || doc.kind === 'images' || doc.kind === 'pdf' || doc.kind === 'video' || doc.kind === 'mp3'
  return (
    <>
      {hosted && <DesignSection doc={doc} onPatch={onPatch} />}
      {doc.kind === 'vcard' && <VcardFields doc={doc} onPatch={onPatch} />}
      {doc.kind === 'business' && <BusinessFields doc={doc} onPatch={onPatch} />}
      {(doc.kind === 'pdf' || doc.kind === 'video' || doc.kind === 'mp3') && (
        <Section icon={<FileText className="size-4" />} title="File" text="Add a title and a link.">
          <div className="grid gap-3">
            <Field label="Title" value={doc.title} onChange={(title) => onPatch({ title })} />
            <Field label="Link" value={doc.url} placeholder="https://" icon={Link2} onChange={(url) => onPatch({ url })} />
          </div>
        </Section>
      )}
      {(doc.kind === 'website' || doc.kind === 'facebook' || doc.kind === 'apps') && (
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
  onItem: (index: number, key: 'label' | 'value', value: string, count: number) => void
}) {
  const count = doc.kind === 'menu' ? 6 : 4
  const title = doc.kind === 'menu' ? 'Menu' : doc.kind === 'images' ? 'Images' : 'Links'
  const text = doc.kind === 'menu' ? 'Dishes and prices on the page.' : doc.kind === 'images' ? 'Image links shown on the page.' : 'Buttons on the page.'
  const left = doc.kind === 'menu' ? 'Dish' : doc.kind === 'images' ? 'Caption' : 'Name'
  const right = doc.kind === 'images' ? 'Image URL' : doc.kind === 'menu' ? 'Price' : 'URL'
  return (
    <Section icon={<List className="size-4" />} title={title} text={text}>
      <Field label={doc.kind === 'menu' ? 'Restaurant' : 'Title'} value={doc.title} onChange={(title) => onPatch({ title })} />
      <div className="mt-3 grid gap-2">
        {rows(doc, count).map((item, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-2">
            <input className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" value={item.label} placeholder={left} onChange={(event) => onItem(index, 'label', event.target.value, count)} />
            <input className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" value={item.value} placeholder={right} onChange={(event) => onItem(index, 'value', event.target.value, count)} />
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
              className={cn('grid grid-cols-2 overflow-hidden rounded-md border-2', active ? 'border-emerald-500' : 'border-transparent')}
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
          className="mb-0.5 grid size-9 place-items-center rounded-full border border-emerald-500 text-emerald-600"
        >
          <ArrowLeftRight className="size-4" />
        </button>
        <ColorField label="Secondary color" value={doc.secondary} onChange={(secondary) => onPatch({ secondary })} />
      </div>
    </Section>
  )
}

function DesignForm({ ink, paper, onInk, onPaper }: { ink: string; paper: string; onInk: (value: string) => void; onPaper: (value: string) => void }) {
  return (
    <Section icon={<Palette className="size-4" />} title="QR code colors" text="These colors are used on the code itself.">
      <div className="flex flex-wrap gap-3">
        <ColorField label="Code color" value={ink} onChange={onInk} />
        <ColorField label="Background" value={paper} onChange={onPaper} />
      </div>
    </Section>
  )
}

function DownloadForm({ src, ready, kind }: { src: string; ready: boolean; kind: string }) {
  return (
    <Section icon={<Download className="size-4" />} title={kind} text={ready ? 'Save the image and share it.' : 'Go back and fill in the form first.'}>
      {src ? (
        <a href={src} download="qr-code.png" className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">
          <Download className="size-4" />
          Download QR Code
        </a>
      ) : (
        <span className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-200 px-4 text-sm font-semibold text-slate-500">
          <Download className="size-4" />
          Download QR Code
        </span>
      )}
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

function PhotoField({ photo, onPhoto }: { photo: string; onPhoto: (photo: string) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-800">Image</p>
      <label className="mt-2 grid size-20 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-emerald-400 text-emerald-500">
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
          <button type="button" onClick={() => onView('page')} className={cn('h-8 rounded-full px-4 text-sm font-semibold', view === 'page' ? 'bg-emerald-500 text-white' : 'text-slate-500')}>
            Preview
          </button>
          <button type="button" onClick={() => onView('qr')} className={cn('h-8 rounded-full px-4 text-sm font-semibold', view === 'qr' ? 'bg-emerald-500 text-white' : 'text-slate-500')}>
            QR code
          </button>
        </div>
      </div>
      <div className="mx-auto w-[270px] rounded-[40px] border-[8px] border-slate-900 bg-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
        <div className="relative h-[540px] overflow-hidden rounded-[32px] bg-white">
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900" />
          {view === 'qr' ? (
            <div className="grid h-full place-items-center bg-white px-6">
              {src ? <img src={src} alt="QR code" className="w-full" /> : <span className="text-sm text-slate-400">Fill in the form</span>}
            </div>
          ) : (
            <div className="h-full overflow-y-auto pt-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
          )}
        </div>
      </div>
    </aside>
  )
}
