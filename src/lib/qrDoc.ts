export type QrKind =
  | 'website'
  | 'pdf'
  | 'links'
  | 'vcard'
  | 'business'
  | 'video'
  | 'images'
  | 'facebook'
  | 'instagram'
  | 'social'
  | 'whatsapp'
  | 'mp3'
  | 'apps'
  | 'menu'
  | 'coupon'
  | 'wifi'

export type QrItem = { label: string; value: string }

export type QrDoc = {
  kind: QrKind
  title: string
  url: string
  text: string
  name: string
  phone: string
  email: string
  role: string
  company: string
  companyPhone: string
  companyEmail: string
  site: string
  address: string
  message: string
  ssid: string
  password: string
  security: string
  code: string
  surname: string
  primary: string
  secondary: string
  photo: string
  items: QrItem[]
}

export const emptyQrDoc = (): QrDoc => ({
  kind: 'website',
  title: '',
  url: '',
  text: '',
  name: '',
  phone: '',
  email: '',
  role: '',
  company: '',
  companyPhone: '',
  companyEmail: '',
  site: '',
  address: '',
  message: '',
  ssid: '',
  password: '',
  security: 'WPA',
  code: '',
  surname: '',
  primary: '#527AC9',
  secondary: '#7EC09F',
  photo: '',
  items: [],
})

const hosted = new Set<QrKind>(['pdf', 'links', 'vcard', 'business', 'video', 'images', 'social', 'mp3', 'menu', 'coupon'])

export function isHostedQr(kind: QrKind) {
  return hosted.has(kind)
}

export function encodeQrDoc(doc: QrDoc) {
  const compact: Partial<QrDoc> = { kind: doc.kind }
  ;(Object.keys(doc) as (keyof QrDoc)[]).forEach((key) => {
    if (key === 'kind') return
    const value = doc[key]
    if (typeof value === 'string' && value.trim()) {
      if (key === 'primary' && value.trim().toUpperCase() === '#527AC9') return
      if (key === 'secondary' && value.trim().toUpperCase() === '#7EC09F') return
      if (key === 'photo' && value.length > 1800) return
      ;(compact as Record<string, unknown>)[key] = value.trim()
    }
    if (Array.isArray(value)) {
      const items = value.filter((item) => item.label.trim() || item.value.trim())
      if (items.length) compact.items = items
    }
  })
  const bytes = new TextEncoder().encode(JSON.stringify(compact))
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export function decodeQrDoc(code: string): QrDoc | null {
  try {
    const padded = code.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (code.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<QrDoc>
    if (!parsed.kind) return null
    return { ...emptyQrDoc(), ...parsed, items: parsed.items ?? [] }
  } catch {
    return null
  }
}

export function qrColor(value: string, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback
}

export function qrFullName(doc: QrDoc) {
  return [doc.name, doc.surname].filter((part) => part.trim()).join(' ')
}

export function withProtocol(value: string) {
  const text = value.trim()
  if (!text) return ''
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}

export function qrReady(doc: QrDoc) {
  if (doc.kind === 'website' || doc.kind === 'facebook' || doc.kind === 'apps' || doc.kind === 'pdf' || doc.kind === 'video' || doc.kind === 'mp3') {
    return Boolean(doc.url.trim())
  }
  if (doc.kind === 'instagram') return Boolean(doc.name.trim())
  if (doc.kind === 'whatsapp') return Boolean(doc.phone.replace(/[^\d]/g, ''))
  if (doc.kind === 'wifi') return Boolean(doc.ssid.trim())
  if (doc.kind === 'coupon') return Boolean(doc.title.trim() || doc.code.trim())
  if (doc.kind === 'business') return Boolean(doc.company.trim() || doc.phone.trim() || doc.text.trim())
  if (doc.kind === 'vcard') return Boolean(doc.name.trim() || doc.surname.trim() || doc.phone.trim() || doc.email.trim())
  if (doc.kind === 'social') return Boolean(doc.url.trim() || doc.name.trim() || doc.phone.trim() || doc.site.trim())
  return Boolean(doc.title.trim() || doc.items.some((item) => item.label.trim() || item.value.trim()))
}

export function qrTarget(doc: QrDoc, origin: string) {
  if (!qrReady(doc)) return ''
  if (doc.kind === 'website') return withProtocol(doc.url)
  if (doc.kind === 'facebook') return withProtocol(doc.url || doc.site)
  if (doc.kind === 'instagram') {
    const name = doc.name.replace(/^@/, '').trim()
    return name ? `https://instagram.com/${name}` : ''
  }
  if (doc.kind === 'whatsapp') {
    const phone = doc.phone.replace(/[^\d]/g, '')
    if (!phone) return ''
    const text = doc.message.trim()
    return text ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/${phone}`
  }
  if (doc.kind === 'apps') return withProtocol(doc.url)
  if (doc.kind === 'wifi') {
    if (!doc.ssid.trim()) return ''
    const escape = (value: string) => value.replace(/([\\;,:"])/g, '\\$1')
    return `WIFI:T:${doc.security || 'WPA'};S:${escape(doc.ssid.trim())};P:${escape(doc.password)};;`
  }
  if (!isHostedQr(doc.kind)) return ''
  return `${origin}/q?d=${encodeQrDoc(doc)}`
}
