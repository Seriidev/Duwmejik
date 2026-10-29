export type QrKind =
  | 'website'
  | 'pdf'
  | 'links'
  | 'vcard'
  | 'business'
  | 'video'
  | 'images'
  | 'contact'
  | 'instagram'
  | 'social'
  | 'whatsapp'
  | 'mp3'
  | 'apps'
  | 'menu'
  | 'coupon'
  | 'wifi'

export type QrItem = { label: string; value: string; image?: string }

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

const kindCode: Record<QrKind, string> = {
  website: 'w',
  pdf: 'f',
  links: 'l',
  vcard: 'v',
  business: 'b',
  video: 'o',
  images: 'i',
  contact: 'k',
  instagram: 'g',
  social: 's',
  whatsapp: 'h',
  mp3: 'm',
  apps: 'p',
  menu: 'n',
  coupon: 'c',
  wifi: 'x',
}

const kindByCode = Object.fromEntries(Object.entries(kindCode).map(([kind, code]) => [code, kind])) as Record<string, QrKind>

function plain(value: string) {
  const text = value.trim()
  return text.startsWith('data:') ? '' : text.replace(/\u001f/g, ' ')
}

function escapeField(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/~/g, '\\~')
}

function splitFields(body: string) {
  const fields: string[] = []
  let current = ''
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index]
    if (char === '\\' && index + 1 < body.length) {
      current += body[index + 1]
      index += 1
      continue
    }
    if (char === '~') {
      fields.push(current)
      current = ''
      continue
    }
    current += char
  }
  fields.push(current)
  return fields
}

function textFields(doc: QrDoc) {
  const items = doc.items
    .map((item) => ({ label: plain(item.label), value: plain(item.value) }))
    .filter((item) => item.label || item.value)
    .map((item) => `${item.label}\u001f${item.value}`)
  if (doc.kind === 'vcard') {
    return [plain(doc.name), plain(doc.surname), plain(doc.role), plain(doc.text), plain(doc.phone), plain(doc.email), plain(doc.company), plain(doc.companyPhone), plain(doc.companyEmail), plain(doc.site), plain(doc.address)]
  }
  if (doc.kind === 'business') return [plain(doc.company), plain(doc.text), plain(doc.phone), plain(doc.email), plain(doc.site), plain(doc.address)]
  if (doc.kind === 'menu' || doc.kind === 'links' || doc.kind === 'images') return [plain(doc.title), ...items]
  if (doc.kind === 'social') return [plain(doc.title), plain(doc.url), plain(doc.name), plain(doc.phone), plain(doc.site)]
  if (doc.kind === 'coupon') return [plain(doc.title), plain(doc.code), plain(doc.text), plain(doc.message)]
  if (doc.kind === 'pdf') return [plain(doc.title), plain(doc.message)]
  if (doc.kind === 'video' || doc.kind === 'mp3') return [plain(doc.title), plain(doc.text), plain(doc.url)]
  return [plain(doc.title), plain(doc.text)]
}

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(code: string) {
  const padded = code.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (code.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeQrDoc(doc: QrDoc) {
  const fields = textFields(doc)
  const primary = plain(doc.primary).toUpperCase()
  const secondary = plain(doc.secondary).toUpperCase()
  if (primary && secondary && (primary !== '#527AC9' || secondary !== '#7EC09F')) fields.push(`${primary},${secondary}`)
  while (fields.length && !fields[fields.length - 1]) fields.pop()
  return toBase64Url(`1${kindCode[doc.kind]}~${fields.map(escapeField).join('~')}`)
}

function applyFields(doc: QrDoc, fields: string[]) {
  const next = [...fields]
  const color = next[next.length - 1] ?? ''
  if (/^#[0-9a-fA-F]{6},#[0-9a-fA-F]{6}$/.test(color)) {
    const [primary, secondary] = color.split(',')
    doc.primary = primary
    doc.secondary = secondary
    next.pop()
  }
  const take = () => next.shift() ?? ''
  const pairs = () =>
    next.map((field) => {
      const [label, value = ''] = field.split('\u001f')
      return { label, value }
    })
  if (doc.kind === 'vcard') {
    doc.name = take()
    doc.surname = take()
    doc.role = take()
    doc.text = take()
    doc.phone = take()
    doc.email = take()
    doc.company = take()
    doc.companyPhone = take()
    doc.companyEmail = take()
    doc.site = take()
    doc.address = take()
    return
  }
  if (doc.kind === 'business') {
    doc.company = take()
    doc.text = take()
    doc.phone = take()
    doc.email = take()
    doc.site = take()
    doc.address = take()
    return
  }
  if (doc.kind === 'menu' || doc.kind === 'links' || doc.kind === 'images') {
    doc.title = take()
    doc.items = pairs()
    return
  }
  if (doc.kind === 'social') {
    doc.title = take()
    doc.url = take()
    doc.name = take()
    doc.phone = take()
    doc.site = take()
    return
  }
  if (doc.kind === 'coupon') {
    doc.title = take()
    doc.code = take()
    doc.text = take()
    doc.message = take()
    return
  }
  if (doc.kind === 'pdf') {
    doc.title = take()
    doc.message = take()
    return
  }
  if (doc.kind === 'video' || doc.kind === 'mp3') {
    doc.title = take()
    doc.text = take()
    doc.url = take()
    return
  }
  doc.title = take()
  doc.text = take()
}

function decodeCompact(text: string): QrDoc | null {
  if (!text.startsWith('1') || text.length < 2) return null
  const kind = kindByCode[text[1]]
  if (!kind) return null
  const body = text[2] === '~' ? text.slice(3) : ''
  const doc = { ...emptyQrDoc(), kind, items: [] as QrItem[] }
  applyFields(doc, body ? splitFields(body) : [])
  return doc
}

export function decodeQrDoc(code: string): QrDoc | null {
  try {
    const text = fromBase64Url(code)
    if (text.startsWith('{')) {
      const parsed = JSON.parse(text) as Partial<QrDoc>
      if (!parsed.kind) return null
      return { ...emptyQrDoc(), ...parsed, items: parsed.items ?? [] }
    }
    return decodeCompact(text)
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

function vcardEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export function contactVCard(doc: QrDoc) {
  const name = doc.name.trim()
  const surname = doc.surname.trim()
  const full = [name, surname].filter(Boolean).join(' ')
  const site = doc.site.trim()
  const url = site.startsWith('data:') ? '' : site && (/^https?:\/\//i.test(site) ? site : `https://${site}`)
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcardEscape(surname)};${vcardEscape(name)};;;`,
    full && `FN:${vcardEscape(full)}`,
    doc.role.trim() && `TITLE:${vcardEscape(doc.role.trim())}`,
    doc.company.trim() && `ORG:${vcardEscape(doc.company.trim())}`,
    doc.phone.trim() && `TEL;TYPE=CELL:${vcardEscape(doc.phone.trim())}`,
    doc.companyPhone.trim() && `TEL;TYPE=WORK:${vcardEscape(doc.companyPhone.trim())}`,
    doc.email.trim() && `EMAIL:${vcardEscape(doc.email.trim())}`,
    doc.companyEmail.trim() && `EMAIL;TYPE=WORK:${vcardEscape(doc.companyEmail.trim())}`,
    url && `URL:${vcardEscape(url)}`,
    doc.address.trim() && `ADR:;;${vcardEscape(doc.address.trim())};;;;`,
    doc.text.trim() && `NOTE:${vcardEscape(doc.text.trim())}`,
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\n')
}

export function withProtocol(value: string) {
  const text = value.trim()
  if (!text) return ''
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}

const pageStore = 'duwmejik-qr-pages'

export function createQrId() {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function saveQrPage(id: string, doc: QrDoc) {
  if (typeof window === 'undefined' || !id) return
  try {
    const saved = JSON.parse(window.localStorage.getItem(pageStore) || '{}') as Record<string, QrDoc>
    delete saved[id]
    saved[id] = doc
    const keys = Object.keys(saved)
    while (keys.length > 8) {
      const oldest = keys.shift()
      if (oldest) delete saved[oldest]
    }
    window.localStorage.setItem(pageStore, JSON.stringify(saved))
  } catch {
    return
  }
}

export function loadQrPage(id: string) {
  if (typeof window === 'undefined' || !id) return null
  try {
    const saved = JSON.parse(window.localStorage.getItem(pageStore) || '{}') as Record<string, QrDoc>
    const doc = saved[id]
    if (!doc?.kind) return null
    return { ...emptyQrDoc(), ...doc, items: doc.items ?? [] }
  } catch {
    return null
  }
}

const mediaStore = 'duwmejik-qr-media'

type QrMedia = { photo?: string; url?: string; images?: string[] }

function mediaOf(doc: QrDoc): QrMedia {
  const media: QrMedia = {}
  if (doc.photo.startsWith('data:')) media.photo = doc.photo
  if (doc.url.startsWith('data:')) media.url = doc.url
  const images = doc.items.filter((item) => item.label.trim() || item.value.trim()).map((item) => item.image ?? '')
  if (images.some((image) => image.startsWith('data:'))) media.images = images
  return media
}

function rememberQrMedia(code: string, doc: QrDoc) {
  if (typeof window === 'undefined') return
  const media = mediaOf(doc)
  if (!media.photo && !media.url && !media.images) return
  try {
    const saved = JSON.parse(window.localStorage.getItem(mediaStore) || '{}') as Record<string, QrMedia>
    saved[code] = media
    const keys = Object.keys(saved)
    while (keys.length > 6) {
      const oldest = keys.shift()
      if (oldest) delete saved[oldest]
    }
    window.localStorage.setItem(mediaStore, JSON.stringify(saved))
  } catch {
    return
  }
}

export function withQrMedia(code: string, doc: QrDoc) {
  if (typeof window === 'undefined' || !code) return doc
  try {
    const saved = JSON.parse(window.localStorage.getItem(mediaStore) || '{}') as Record<string, QrMedia>
    const media = saved[code]
    if (!media) return doc
    return {
      ...doc,
      photo: media.photo || doc.photo,
      url: media.url || doc.url,
      items: doc.items.map((item, index) => ({ ...item, image: media.images?.[index] || item.image })),
    }
  } catch {
    return doc
  }
}

export function qrReady(doc: QrDoc) {
  if (doc.kind === 'pdf') return doc.url.startsWith('data:')
  if (doc.kind === 'website' || doc.kind === 'apps' || doc.kind === 'video' || doc.kind === 'mp3') {
    return Boolean(doc.url.trim())
  }
  if (doc.kind === 'contact') return Boolean(doc.name.trim() || doc.surname.trim() || doc.phone.trim() || doc.email.trim())
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
  if (doc.kind === 'contact') return contactVCard(doc)
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
  const code = encodeQrDoc(doc)
  rememberQrMedia(code, doc)
  return `${origin}/q?d=${code}`
}
