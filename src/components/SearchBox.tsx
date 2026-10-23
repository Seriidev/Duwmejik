import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/cn'
import { useCatalogStore } from '@/store/useCatalogStore'
import { useLocaleStore, type Locale } from '@/store/useLocaleStore'

type Pick = { href: string; image: string; ru: string; en: string; tk: string }
type Recent = { label: string; href: string; image: string }

const recentKey = 'duwmejik-recent-searches'

const quickPicks: Pick[] = [
  { href: '/templates?category=cards', image: '/categories/cards.jpg', ru: 'Визитки', en: 'Cards', tk: 'Wizitkalar' },
  { href: '/templates?category=flyers', image: '/categories/flyer.jpg', ru: 'Флаеры', en: 'Flyers', tk: 'Flaerler' },
  { href: '/templates?category=brochures', image: '/categories/booklet.jpg', ru: 'Буклеты', en: 'Brochures', tk: 'Bukletler' },
  { href: '/templates?q=меню', image: '/categories/menu.png', ru: 'Меню', en: 'Menus', tk: 'Menýu' },
  { href: '/templates?category=banners', image: '/categories/banner.png', ru: 'Баннеры', en: 'Banners', tk: 'Bannerler' },
  { href: '/templates?category=stickers', image: '/categories/sticker.png', ru: 'Наклейки', en: 'Stickers', tk: 'Stikerler' },
  { href: '/templates?category=packaging', image: '/categories/packaging.png', ru: 'Упаковка', en: 'Packaging', tk: 'Gaplama' },
  { href: '/templates?category=postcards', image: '/categories/postcard.jpg', ru: 'Открытки', en: 'Postcards', tk: 'Açyk hatlar' },
  { href: '/templates?q=бокал', image: '/categories/glasses.jpg', ru: 'Бокалы', en: 'Glasses', tk: 'Bokalary' },
  { href: '/templates?category=pens', image: '/categories/pens.jpg', ru: 'Ручки', en: 'Pens', tk: 'Ruçkalar' },
  { href: '/templates?category=notebooks', image: '/categories/notebooks.jpg', ru: 'Блокноты', en: 'Notebooks', tk: 'Bloknotlar' },
  { href: '/templates?q=гравировка', image: '/categories/engraving.jpg', ru: 'Гравировки', en: 'Engraving', tk: 'Grawirleme' },
]

const ideas: Pick[] = [
  { href: '/product/tpl-card-nord', image: '/products/nord.jpg', ru: 'Визитка «Норд»', en: 'Nord card', tk: 'Nord wizitka' },
  { href: '/product/tpl-card-startup', image: '/products/startup.jpg', ru: 'Визитка стартапа', en: 'Startup card', tk: 'Startap wizitkasy' },
  { href: '/product/tpl-broch-cafe', image: '/products/broch-cafe.jpg', ru: 'Меню кафе', en: 'Cafe menu', tk: 'Kofe menýusy' },
  { href: '/product/tpl-flyer-sale', image: '/products/flyer-sale.jpg', ru: 'Флаер акции', en: 'Sale flyer', tk: 'Aksiýa flaeri' },
  { href: '/product/tpl-banner-expo', image: '/products/banner-expo.jpg', ru: 'Баннер выставки', en: 'Expo banner', tk: 'Sergi bannery' },
  { href: '/product/tpl-pack-box', image: '/products/pack-box.jpg', ru: 'Коробка продукта', en: 'Product box', tk: 'Önüm gutusy' },
]

const headings: Record<Locale, { recent: string; quick: string; ideas: string }> = {
  ru: { recent: 'Недавние запросы', quick: 'Быстрый поиск', ideas: 'Идеи для вас' },
  en: { recent: 'Recent searches', quick: 'Quick search', ideas: 'Ideas for you' },
  tk: { recent: 'Soňky gözlegler', quick: 'Çalt gözleg', ideas: 'Size üçin pikirler' },
}

const categoryImage: Record<string, string> = {
  cards: '/categories/cards.jpg',
  flyers: '/categories/flyer.jpg',
  brochures: '/categories/booklet.jpg',
  banners: '/categories/banner.png',
  stickers: '/categories/sticker.png',
  packaging: '/categories/packaging.png',
  postcards: '/categories/postcard.jpg',
  pens: '/categories/pens.jpg',
  notebooks: '/categories/notebooks.jpg',
  mugs: '/products/mug-morning.jpg',
  books: '/products/book-poetry.jpg',
  forms: '/products/form-letter.jpg',
}

function readRecent(): Recent[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(recentKey) ?? '[]') as Recent[]
    return Array.isArray(parsed) ? parsed.slice(0, 4) : []
  } catch {
    return []
  }
}

function saveRecent(item: Recent) {
  try {
    const next = [item, ...readRecent().filter((entry) => entry.label !== item.label)].slice(0, 4)
    localStorage.setItem(recentKey, JSON.stringify(next))
  } catch {
    /* ignore private-mode storage */
  }
}

function matches(label: string, query: string) {
  return label.toLowerCase().includes(query)
}

export function SearchBox({
  value,
  onSubmit,
  large = false,
  showFilters = false,
  placeholder = 'Искать что угодно…',
  appearance = 'default',
  submitLabel = 'Поиск',
  onPick,
}: {
  value?: string
  onSubmit?: (query: string) => void
  onPick?: (pick: { href: string; label: string }) => void
  large?: boolean
  showFilters?: boolean
  placeholder?: string
  appearance?: 'default' | 'hero' | 'bar'
  submitLabel?: string
}) {
  const router = useRouter()
  const locale = useLocaleStore((state) => state.locale)
  const products = useCatalogStore((state) => state.products)
  const categories = useCatalogStore((state) => state.categories)
  const external = value ?? ''
  const [tracked, setTracked] = useState(external)
  const [text, setText] = useState(external)
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<Recent[]>([])
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const debounced = useDebouncedValue(text, 200)
  const title = headings[locale]

  if (value !== undefined && external !== tracked) {
    setTracked(external)
    setText(external)
  }

  function place() {
    const node = boxRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const width = appearance === 'hero' ? Math.min(680, window.innerWidth - 32) : rect.width
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 16)
    setBox({ top: rect.bottom + 10, left, width })
  }

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (!boxRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  useEffect(() => {
    if (!open) return
    place()
    setRecent(readRecent())
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, appearance])

  const query = debounced.trim().toLowerCase()
  const shownQuick = useMemo(
    () => quickPicks.filter((item) => !query || matches(item[locale], query)),
    [query, locale],
  )
  const shownIdeas = useMemo(
    () => ideas.filter((item) => !query || matches(item[locale], query)),
    [query, locale],
  )
  const shownProducts = useMemo(() => {
    if (!query) return []
    return products
      .filter((item) => item.status === 'published')
      .filter((item) => {
        const category = categories.find((entry) => entry.id === item.categoryId)?.title ?? ''
        return `${item.title} ${item.description} ${item.tags.join(' ')} ${category}`.toLowerCase().includes(query)
      })
      .slice(0, 6)
  }, [query, products, categories])

  function go(href: string, label: string, image: string) {
    saveRecent({ label, href, image })
    setRecent(readRecent())
    setText(label)
    setOpen(false)
    if (onPick) onPick({ href, label })
    else router.push(href)
  }

  function submit(next: string) {
    const clean = next.trim()
    setOpen(false)
    if (!clean) {
      if (onSubmit) onSubmit('')
      else router.push('/templates')
      return
    }
    const hit = quickPicks.find((item) => item[locale].toLowerCase() === clean.toLowerCase())
    saveRecent({
      label: clean,
      href: hit?.href ?? `/templates?q=${encodeURIComponent(clean)}`,
      image: hit?.image ?? '/categories/cards.jpg',
    })
    if (onSubmit) onSubmit(clean)
    else router.push(hit?.href ?? `/templates?q=${encodeURIComponent(clean)}`)
  }

  const panel =
    open && box && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            style={{ top: box.top, left: box.left, width: box.width }}
            className="fixed z-50 max-h-[min(560px,70vh)] overflow-y-auto rounded-[28px] bg-white p-4 text-left shadow-[0_18px_60px_rgba(20,24,40,0.18)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {recent.length > 0 && !query && (
              <PickGrid title={title.recent} items={recent.map((item) => ({ ...item, name: item.label }))} onPick={go} />
            )}
            {shownQuick.length > 0 && (
              <PickGrid
                title={title.quick}
                items={shownQuick.map((item) => ({ href: item.href, image: item.image, name: item[locale] }))}
                onPick={go}
              />
            )}
            {shownProducts.length > 0 && (
              <PickGrid
                title={title.ideas}
                items={shownProducts.map((item) => ({
                  href: `/product/${item.id}`,
                  image: categoryImage[item.categoryId] ?? '/categories/cards.jpg',
                  name: item.title,
                }))}
                onPick={go}
              />
            )}
            {!query && shownIdeas.length > 0 && (
              <PickGrid
                title={title.ideas}
                items={shownIdeas.map((item) => ({ href: item.href, image: item.image, name: item[locale] }))}
                onPick={go}
              />
            )}
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={boxRef} className="relative text-left">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          submit(text.trim())
        }}
      >
        <label className="sr-only" htmlFor="site-search">
          Поиск
        </label>
        <Search
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400',
            large ? 'left-5 size-5' : 'left-4 size-4',
          )}
        />
        <input
          id="site-search"
          value={text}
          placeholder={placeholder}
          onChange={(event) => {
            setText(event.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            place()
            setOpen(true)
          }}
          className={cn(
            'w-full rounded-full bg-white text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-white/70',
            appearance === 'hero'
              ? 'h-12 border-0 pl-11 pr-28 text-sm shadow-[0_10px_28px_rgba(49,16,140,0.18)]'
              : appearance === 'bar'
                ? 'h-11 border border-slate-200 pl-11 pr-28 text-sm shadow-none focus:ring-blue-500/30'
                : cn(
                    'border border-white/80 shadow-[0_12px_40px_rgba(47,107,255,0.14)] ring-blue-500/30',
                    large ? 'h-14 pl-14 text-base' : 'h-12 pl-11 pr-4 text-sm',
                    large && (showFilters ? 'pr-28' : 'pr-6'),
                  ),
          )}
        />
        {(appearance === 'hero' || appearance === 'bar' || (large && showFilters)) && (
          <button
            type="submit"
            className={cn(
              'absolute top-1/2 -translate-y-1/2 rounded-full text-sm font-semibold text-white',
              appearance === 'bar' ? 'right-1 h-9 bg-blue-600 px-4 hover:bg-blue-700' : appearance === 'hero' ? 'right-1.5 h-9 bg-brand px-4' : 'right-2 h-10 bg-brand px-5',
            )}
          >
            {submitLabel}
          </button>
        )}
      </form>
      {panel}
    </div>
  )
}

function PickGrid({
  title,
  items,
  onPick,
}: {
  title: string
  items: { href: string; image: string; name: string }[]
  onPick: (href: string, name: string, image: string) => void
}) {
  return (
    <section className="mb-4 last:mb-0">
      <h3 className="px-1 text-[15px] font-bold text-slate-950">{title}</h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <button
            key={`${item.href}-${item.name}`}
            type="button"
            onClick={() => onPick(item.href, item.name, item.image)}
            className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#F4F5F7] p-2 pr-3 text-left hover:bg-[#E8EAEE]"
          >
            <img src={item.image} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
            <span className="truncate text-[15px] font-medium text-slate-900">{item.name}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
