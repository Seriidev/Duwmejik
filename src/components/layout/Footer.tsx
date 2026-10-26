'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import logoBell from '@/assets/logo-bell.png'
import 'leaflet/dist/leaflet.css'
import { Reveal } from '@/components/Reveal'
import { cn } from '@/lib/cn'
import { useLocaleStore } from '@/store/useLocaleStore'

const offices = [
  {
    lat: 37.913772,
    lon: 58.382669,
    address: {
      ru: 'Дом 79, просп. Великого Сапармурата Туркменбаши 79, Aşgabat 744000, Turkmenistan',
      en: '79 Saparmurat Turkmenbashi Ave, Ashgabat 744000, Turkmenistan',
      tk: 'Saparmyrat Türkmenbaşy şaýoly, 79 jaý, Aşgabat 744000, Türkmenistan',
    },
  },
  {
    lat: 37.92862,
    lon: 58.389627,
    address: {
      ru: 'ул. Галкыныш, Aşgabat 744005, Turkmenistan',
      en: 'Galkynysh St, Ashgabat 744005, Turkmenistan',
      tk: 'Galkynyş köçesi, Aşgabat 744005, Türkmenistan',
    },
  },
] as const

const copy = {
  ru: {
    blurb: 'Платформа для дизайна, шаблонов и печати. Выберите шаблон, настройте заказ и получите готовый материал в вашем регионе.',
    email: 'Электронная почта',
    phones: 'Телефоны',
    address: 'Адрес',
    map: 'Карта офиса',
    first: 'Первая точка',
    second: 'Вторая точка',
    office: 'Адрес офиса',
    note: 'Дизайн и печать · Маркетплейс шаблонов и онлайн-заказ',
    terms: 'Условия',
    rules: 'Правила контента',
    report: 'Пожаловаться',
    contacts: 'Контакты',
  },
  en: {
    blurb: 'A platform for design, templates, and print. Pick a template, set up the order, and get the finished piece in your area.',
    email: 'Email',
    phones: 'Phones',
    address: 'Address',
    map: 'Office map',
    first: 'First point',
    second: 'Second point',
    office: 'Office address',
    note: 'Design and print · Template marketplace and online orders',
    terms: 'Terms',
    rules: 'Content rules',
    report: 'Report',
    contacts: 'Contacts',
  },
  tk: {
    blurb: 'Dizaýn, şablon we çap platformasy. Şablon saýlaň, sargydy düzüň we taýýar materialy öz sebitiňizde alyň.',
    email: 'Elektron poçta',
    phones: 'Telefonlar',
    address: 'Salgy',
    map: 'Ofisiň kartasy',
    first: 'Birinji nokat',
    second: 'Ikinji nokat',
    office: 'Ofisiň salgysy',
    note: 'Dizaýn we çap · Şablon bazary we onlaýn sargyt',
    terms: 'Şertler',
    rules: 'Kontent düzgünleri',
    report: 'Şikaýat',
    contacts: 'Kontaktlar',
  },
} as const

export function Footer() {
  const locale = useLocaleStore((state) => state.locale)
  const page = copy[locale]
  const [point, setPoint] = useState(0)
  const links = [
    { href: '/#about', label: page.terms },
    { href: '/templates', label: page.rules },
    { href: '/#contacts', label: page.report },
    { href: '/#contacts', label: page.contacts },
  ]

  return (
    <footer className="px-4 pb-6 pt-4 sm:px-6">
      <Reveal>
      <div className="mx-auto max-w-[1180px] rounded-[24px] bg-brand px-4 py-6 text-white sm:rounded-[28px] sm:px-8 sm:py-8">
        <div className="grid items-start gap-6 md:grid-cols-2 md:gap-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 font-bold">
              <img src={logoBell.src} alt="" className="size-9 object-contain" />
              Duwmejik
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">{page.blurb}</p>
            <div className="mt-8 grid gap-5 text-sm">
              <div>
                <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">{page.email}</p>
                <a href="mailto:info@duwmejik.com" className="mt-1 inline-block text-white/90 hover:text-white">
                  info@duwmejik.com
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">{page.phones}</p>
                <a href="tel:+99312228605" className="mt-1 inline-block text-white/90 hover:text-white">
                  +(993 12) 22-86-05
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">{page.address}</p>
                <p className="mt-1 max-w-sm leading-6 text-white/90">{offices[0].address[locale]}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[22px] bg-white p-4 text-slate-950 sm:p-5">
            <p className="px-1 text-sm font-semibold">{page.map}</p>
            <OfficeMap active={point} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPoint(0)}
                className={cn(
                  'h-11 rounded-xl text-sm font-semibold',
                  point === 0 ? 'bg-neutral-950 text-white' : 'border border-slate-200 bg-white text-slate-800',
                )}
              >
                {page.first}
              </button>
              <button
                type="button"
                onClick={() => setPoint(1)}
                className={cn(
                  'h-11 rounded-xl text-sm font-semibold',
                  point === 1 ? 'bg-neutral-950 text-white' : 'border border-slate-200 bg-white text-slate-800',
                )}
              >
                {page.second}
              </button>
            </div>
            <p className="mt-4 px-1 text-sm font-semibold">{page.office}</p>
            <p className="mt-1 px-1 text-sm leading-6 text-slate-500">{offices[point].address[locale]}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-4 text-xs text-white/75">
          <p>© {new Date().getFullYear()} Duwmejik · {page.note}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      </Reveal>
    </footer>
  )
}

function OfficeMap({ active }: { active: number }) {
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markersRef = useRef<import('leaflet').Marker[]>([])
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    let cancelled = false
    const node = nodeRef.current
    if (!node) return

    void import('leaflet/dist/leaflet-src.esm.js')
      .then((mod) => {
        if (cancelled || mapRef.current) return
        const loaded = mod as unknown as typeof import('leaflet') & { default?: typeof import('leaflet') }
        const leaflet = typeof loaded.map === 'function' ? loaded : loaded.default
        if (!leaflet?.map) return
        leafletRef.current = leaflet
        const start = offices[activeRef.current]
        const map = leaflet.map(node, { zoomControl: false, scrollWheelZoom: false }).setView([start.lat, start.lon], 15)
        leaflet
          .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
          })
          .addTo(map)
        markersRef.current = offices.map((office, index) =>
          leaflet
            .marker([office.lat, office.lon], { icon: pinIcon(leaflet, index === activeRef.current) })
            .addTo(map),
        )
        mapRef.current = map
        window.setTimeout(() => map.invalidateSize(), 80)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current = []
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const leaflet = leafletRef.current
    if (!map || !leaflet) return
    const office = offices[active]
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) map.setView([office.lat, office.lon], 16)
    else map.flyTo([office.lat, office.lon], 16, { duration: 0.9 })
    markersRef.current.forEach((marker, index) => marker.setIcon(pinIcon(leaflet, index === active)))
  }, [active])

  return (
    <div className="relative mt-3 h-[180px] overflow-hidden rounded-2xl bg-[#E6E8EE] sm:h-[210px]">
      <div ref={nodeRef} className="absolute inset-0" />
    </div>
  )
}

function pinIcon(leaflet: typeof import('leaflet'), on: boolean) {
  return leaflet.divIcon({
    className: 'office-pin',
    html: `<span style="display:block;width:16px;height:16px;border-radius:999px;background:${on ? '#2f6bff' : '#111827'};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}
