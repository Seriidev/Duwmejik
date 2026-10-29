import { Briefcase, Globe, Mail, MapPin, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { isHostedQr, qrColor, qrFullName, qrTarget, withProtocol, type QrDoc } from '@/lib/qrDoc'

function safeUrl(value: string) {
  const url = withProtocol(value)
  return /^https?:\/\//i.test(url) ? url : ''
}

function photoSrc(photo: string) {
  if (/^data:image\/jpeg;base64,[a-z0-9+/=]+$/i.test(photo)) return photo
  if (/^https:\/\/.+/i.test(photo)) return photo
  return ''
}

export function QrCard({ doc }: { doc: QrDoc }) {
  const primary = qrColor(doc.primary, '#527AC9')
  const secondary = qrColor(doc.secondary, '#7EC09F')
  const photo = photoSrc(doc.photo)
  const person = doc.kind === 'vcard' || doc.kind === 'contact'
  const name = doc.kind === 'business' ? doc.company || 'Business' : person ? qrFullName(doc) || 'Your name' : doc.title || 'QR page'
  const role = person ? doc.role : ''

  if (!isHostedQr(doc.kind) && doc.kind !== 'contact') {
    const target = typeof window === 'undefined' ? '' : qrTarget(doc, window.location.origin)
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center bg-white px-6 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">QR code</p>
        <p className="mt-3 text-lg font-bold text-slate-950">{doc.kind === 'wifi' ? doc.ssid || 'Wi-Fi' : 'Opens directly'}</p>
        <p className="mt-2 break-all text-sm leading-6 text-slate-500">{target || 'Fill in the form to see where this QR code goes.'}</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden bg-white">
      <div className="px-5 pt-16 pb-8 text-center text-white" style={{ background: `linear-gradient(180deg, ${secondary} 0%, ${primary} 100%)` }}>
        {photo ? (
          <img src={photo} alt="" className="mx-auto size-16 rounded-full object-cover ring-4 ring-white/50" />
        ) : (
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/20 text-2xl font-semibold">
            {(name || '?').slice(0, 1)}
          </span>
        )}
        <h2 className="mt-3 break-words px-2 text-lg font-bold leading-tight">{name}</h2>
        {role && <p className="mt-1 text-xs text-white/80">{role}</p>}
        {person && (
          <div className="mt-3 flex justify-center gap-2">
            <Round href={doc.phone ? `tel:${doc.phone}` : undefined} icon={<Phone className="size-3.5" />} />
            <Round href={doc.email ? `mailto:${doc.email}` : undefined} icon={<Mail className="size-3.5" />} />
            <Round href={doc.address ? `https://maps.google.com/?q=${encodeURIComponent(doc.address)}` : undefined} icon={<MapPin className="size-3.5" />} />
          </div>
        )}
      </div>
      <div className="-mt-4 rounded-t-3xl bg-white px-3 pb-4 pt-4">
        {doc.text && <p className="text-center text-sm leading-6 text-slate-500">{doc.text}</p>}
        <div className="mt-3 grid w-full min-w-0 grid-cols-1 gap-2">{body(doc, primary)}</div>
      </div>
    </div>
  )
}

function Round({ href, icon }: { href?: string; icon: ReactNode }) {
  const className = 'grid size-9 place-items-center rounded-full bg-white text-slate-700 shadow-sm'
  if (!href) return <span className={className}>{icon}</span>
  return (
    <a href={href} className={className}>
      {icon}
    </a>
  )
}

function body(doc: QrDoc, primary: string) {
  if (doc.kind === 'vcard' || doc.kind === 'contact') {
    return (
      <>
        {doc.phone && <Row icon={<Phone className="size-4" />} label="Phone" value={doc.phone} href={`tel:${doc.phone}`} />}
        {doc.email && <Row icon={<Mail className="size-3.5" />} label="Email" value={doc.email} href={`mailto:${doc.email}`} />}
        {doc.company && <Row icon={<Briefcase className="size-3.5" />} label="Company" value={doc.company} />}
        {doc.companyPhone && <Row icon={<Phone className="size-3.5" />} label="Work phone" value={doc.companyPhone} href={`tel:${doc.companyPhone}`} />}
        {doc.companyEmail && <Row icon={<Mail className="size-3.5" />} label="Work email" value={doc.companyEmail} href={`mailto:${doc.companyEmail}`} />}
        {safeUrl(doc.site) && <Row icon={<Globe className="size-3.5" />} label="Website" value={doc.site} href={safeUrl(doc.site)} />}
        {doc.address && <Row icon={<MapPin className="size-4" />} label="Address" value={doc.address} />}
        <a href={vcardFile(doc)} download="contact.vcf" className="mt-1 flex h-11 w-full min-w-0 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white" style={{ background: primary }}>
          Save contact
        </a>
      </>
    )
  }
  if (doc.kind === 'business') {
    return (
      <>
        {doc.phone && <Row icon={<Phone className="size-4" />} label="Phone" value={doc.phone} href={`tel:${doc.phone}`} />}
        {doc.email && <Row icon={<Mail className="size-4" />} label="Email" value={doc.email} href={`mailto:${doc.email}`} />}
        {safeUrl(doc.site) && <Row icon={<Globe className="size-3.5" />} label="Website" value={doc.site} href={safeUrl(doc.site)} />}
        {doc.address && <Row icon={<MapPin className="size-4" />} label="Address" value={doc.address} />}
      </>
    )
  }
  if (doc.kind === 'menu') {
    return (
      <div className="divide-y divide-slate-100">
        {doc.items.filter((item) => item.label || item.value || item.image).map((item, index) => {
          const image = item.image ? photoSrc(item.image) : ''
          return (
            <div key={index} className="flex items-center gap-3 py-2 text-sm">
              {image && <img src={image} alt="" className="size-12 shrink-0 rounded-xl object-cover" />}
              <span className="min-w-0 flex-1 font-medium text-slate-900">{item.label}</span>
              <span className="text-slate-500">{item.value}</span>
            </div>
          )
        })}
      </div>
    )
  }
  if (doc.kind === 'coupon') {
    return (
      <div className="rounded-2xl border border-dashed px-4 py-6 text-center" style={{ borderColor: primary }}>
        <p className="text-xs uppercase tracking-wide text-slate-400">Code</p>
        <p className="mt-1 text-3xl font-bold tracking-widest text-slate-950">{doc.code || '—'}</p>
        {doc.message && <p className="mt-2 text-sm text-slate-500">Until {doc.message}</p>}
      </div>
    )
  }
  if (doc.kind === 'links' || doc.kind === 'social') {
    const links = doc.kind === 'social'
      ? [
          safeUrl(doc.url) && { label: 'Facebook', value: safeUrl(doc.url) },
          doc.name && { label: 'Instagram', value: `https://instagram.com/${doc.name.replace(/^@/, '')}` },
          doc.phone && { label: 'WhatsApp', value: `https://wa.me/${doc.phone.replace(/[^\d]/g, '')}` },
          safeUrl(doc.site) && { label: 'Website', value: safeUrl(doc.site) },
        ].filter((item): item is { label: string; value: string } => Boolean(item))
      : doc.items.filter((item) => safeUrl(item.value)).map((item) => ({ label: item.label || item.value, value: safeUrl(item.value) }))
    return links.map((item) => (
      <a key={item.label} href={item.value} className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-white" style={{ background: primary }}>
        {item.label}
      </a>
    ))
  }
  if (doc.kind === 'images') {
    return doc.items.filter((item) => /^https:\/\//i.test(item.value.trim())).map((item, index) => (
      <figure key={index}>
        <img src={item.value.trim()} alt={item.label || ''} className="w-full rounded-2xl object-cover" />
        {item.label && <figcaption className="mt-1 text-sm text-slate-500">{item.label}</figcaption>}
      </figure>
    ))
  }
  if (doc.kind === 'pdf' || doc.kind === 'video' || doc.kind === 'mp3') {
    const href = doc.url.startsWith('data:') ? doc.url : safeUrl(doc.url)
    return href ? (
      <a
        href={href}
        download={doc.kind === 'pdf' && doc.url.startsWith('data:') ? doc.message || 'file.pdf' : undefined}
        target={doc.url.startsWith('data:') ? undefined : '_blank'}
        rel="noreferrer"
        className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white"
        style={{ background: primary }}
      >
        {doc.kind === 'pdf' ? doc.message || 'Open PDF' : 'Open'}
      </a>
    ) : null
  }
  return null
}

function Row({ icon, label, value, href }: { icon?: ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <span className="flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-xl border border-slate-100 px-2.5 py-1.5">
      {icon && <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500">{icon}</span>}
      <span className="w-0 min-w-0 flex-1 text-left">
        <span className="block truncate text-[10px] leading-4 text-slate-400">{label}</span>
        <span className="block text-xs font-medium leading-4 break-all text-slate-800">{value}</span>
      </span>
    </span>
  )
  if (!href) return inner
  return (
    <a href={href} className="block w-full min-w-0 max-w-full">
      {inner}
    </a>
  )
}

function vcardFile(doc: QrDoc) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    qrFullName(doc) && `FN:${qrFullName(doc)}`,
    doc.phone && `TEL;TYPE=CELL:${doc.phone}`,
    doc.email && `EMAIL:${doc.email}`,
    doc.role && `TITLE:${doc.role}`,
    doc.company && `ORG:${doc.company}`,
    doc.companyPhone && `TEL;TYPE=WORK:${doc.companyPhone}`,
    doc.companyEmail && `EMAIL;TYPE=WORK:${doc.companyEmail}`,
    safeUrl(doc.site) && `URL:${safeUrl(doc.site)}`,
    doc.address && `ADR:;;${doc.address};;;;`,
    'END:VCARD',
  ].filter(Boolean)
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(lines.join('\n'))}`
}
