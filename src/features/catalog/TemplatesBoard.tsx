'use client'

import { Bell, Bookmark, ChevronDown, ClipboardList, Eye, Globe, Heart, Image as ImageIcon, LayoutGrid, PanelLeftClose, PanelLeftOpen, QrCode, User } from 'lucide-react'
import cardPreview from '@/assets/card-preview.jpg'
import logoBell from '@/assets/logo-bell.png'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isPrintWork } from '@/data/catalog'
import { PreviewModal } from '@/features/catalog/PreviewModal'
import { OrderWizardPage } from '@/features/orders/OrderWizardPage'
import { QrGenerator } from '@/features/catalog/QrGenerator'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { likeCount, useEngagementStore } from '@/store/useEngagementStore'
import type { Product } from '@/types'

const chips = [
  { id: 'all', label: 'All' },
  { id: 'cards', label: 'Business cards' },
  { id: 'flyers', label: 'Flyers' },
  { id: 'banners', label: 'Banners' },
  { id: 'tshirts', label: 'T-shirts' },
  { id: 'postcards', label: 'Postcards' },
  { id: 'stickers', label: 'Stickers' },
  { id: 'menu', label: 'Menu' },
] as const

type ChipId = (typeof chips)[number]['id']
type Panel = 'gallery' | 'templates' | 'orders' | 'qr' | 'notification'

const languages = [
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'it', label: 'Italiano' },
  { id: 'rm', label: 'Rumantsch' },
  { id: 'es', label: 'Español' },
  { id: 'zh', label: '中文' },
] as const

const searchAliases: Record<string, ChipId> = {
  'business card': 'cards',
  'business cards': 'cards',
  flyer: 'flyers',
  flyers: 'flyers',
  banner: 'banners',
  banners: 'banners',
  't-shirt': 'tshirts',
  't-shirts': 'tshirts',
  tshirt: 'tshirts',
  postcard: 'postcards',
  postcards: 'postcards',
  sticker: 'stickers',
  stickers: 'stickers',
  menu: 'menu',
}

function matchesChip(product: Product, chip: ChipId) {
  if (chip === 'all') return true
  if (chip === 'menu') {
    const text = `${product.title} ${product.tags.join(' ')}`.toLowerCase()
    return text.includes('меню') || text.includes('menu')
  }
  if (chip === 'tshirts') return product.tags.some((tag) => tag.toLowerCase().includes('футбол'))
  return product.categoryId === chip
}

function similarChip(product: Product): ChipId | null {
  const known = chips.find((item) => item.id === product.categoryId)
  if (known) return known.id
  if (matchesChip(product, 'menu')) return 'menu'
  if (matchesChip(product, 'tshirts')) return 'tshirts'
  return null
}

export function TemplatesBoard() {
  const router = useRouter()
  const pick = useSearchParams().get('pick')
  const products = useCatalogStore((state) => state.products)
  const user = useAuthStore((state) => state.user)
  const favorites = useAccountStore((state) => (user ? state.favorites[user.id] : undefined))
  const toggleFavorite = useAccountStore((state) => state.toggleFavorite)
  const views = useEngagementStore((state) => state.views)
  const likes = useEngagementStore((state) => state.likes)
  const addView = useEngagementStore((state) => state.addView)
  const toggleLike = useEngagementStore((state) => state.toggleLike)
  const [menuOpen, setMenuOpen] = useState(true)
  const [panel, setPanel] = useState<Panel>('templates')
  const [chip, setChip] = useState<ChipId>('all')
  const [alike, setAlike] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<Product | null>(null)
  const [pickedFrom, setPickedFrom] = useState<'gallery' | 'templates' | null>(null)
  const [language, setLanguage] = useState<(typeof languages)[number]['id']>('en')
  const [languagesOpen, setLanguagesOpen] = useState(false)
  const languageRef = useRef<HTMLDivElement>(null)
  const currentLanguage = languages.find((item) => item.id === language) ?? languages[0]

  useEffect(() => {
    if (!languagesOpen) return
    function onPointerDown(event: MouseEvent) {
      if (!languageRef.current?.contains(event.target as Node)) setLanguagesOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setLanguagesOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [languagesOpen])

  useEffect(() => {
    if (pick !== 'gallery' && pick !== 'templates') return
    setPicking(true)
    setPanel(pick)
    setChip('all')
    setAlike(null)
    setQuery('')
    setDraft('')
    router.replace('/templates')
  }, [pick, router])

  function openForPick(next: 'gallery' | 'templates') {
    setPicking(true)
    setPanel(next)
    setChip('all')
    setAlike(null)
    setQuery('')
    setDraft('')
  }

  function chooseDesign(product: Product) {
    setPicked(product)
    setPickedFrom(panel === 'gallery' ? 'gallery' : 'templates')
    setPicking(false)
    setPanel('orders')
  }

  const published = products.filter((item) => item.status === 'published')
  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    const alias = searchAliases[text]
    const collection = published.filter((product) =>
      panel === 'gallery' ? isPrintWork(product) : !isPrintWork(product),
    )
    return collection.filter((product) => {
      if (alike && product.categoryId !== alike) return false
      if (!matchesChip(product, chip)) return false
      if (!text) return true
      if (alias && matchesChip(product, alias)) return true
      const haystack = `${product.title} ${product.description} ${product.tags.join(' ')}`.toLowerCase()
      return haystack.includes(text)
    })
  }, [published, chip, query, alike, panel])

  function showSimilar(product: Product) {
    const next = similarChip(product)
    setQuery('')
    setDraft('')
    setPanel(isPrintWork(product) ? 'gallery' : 'templates')
    if (next) {
      setAlike(null)
      setChip(next)
      return
    }
    setChip('all')
    setAlike(product.categoryId)
  }

  function requireUser() {
    if (user) return true
    router.push('/login?from=%2Ftemplates')
    return false
  }

  const preview = published.find((item) => item.id === previewId) ?? null

  return (
    <div className="flex min-h-svh bg-white text-slate-900">
      <div
        className={cn(
          'sticky top-0 h-svh shrink-0 overflow-hidden transition-[width] duration-500 ease-in-out',
          menuOpen ? 'w-[248px]' : 'w-0',
        )}
      >
      <aside
        className={cn(
          'flex h-full w-[248px] flex-col border-r border-slate-100 px-4 py-5 transition-transform duration-500 ease-in-out',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-1 px-2">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5">
            <img src={logoBell.src} alt="" className="size-9 object-contain" />
            <span className="truncate text-[17px] font-bold tracking-tight">Duwmejik</span>
          </Link>
          <button
            type="button"
            aria-label="Collapse menu"
            onClick={() => setMenuOpen(false)}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <PanelLeftClose className="size-5" />
          </button>
        </div>

        <nav className="mt-8 grid gap-1">
          <button
            type="button"
            onClick={() => {
              setPicking(false)
              setPanel('gallery')
              setChip('all')
              setAlike(null)
              setQuery('')
              setDraft('')
            }}
            className={cn(
              'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium',
              panel === 'gallery' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            <ImageIcon className="size-5" />
            Our Gallery
          </button>
          <button
            type="button"
            onClick={() => {
              setPicking(false)
              setPanel('templates')
              setChip('all')
              setAlike(null)
              setQuery('')
              setDraft('')
            }}
            className={cn(
              'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium',
              panel === 'templates' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            <LayoutGrid className="size-5" />
            Templates
          </button>
          <button
            type="button"
            onClick={() => {
              setPicking(false)
              setPanel('orders')
            }}
            className={cn(
              'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium',
              panel === 'orders' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            <ClipboardList className="size-5" />
            Orders
          </button>
          <button
            type="button"
            onClick={() => setPanel('qr')}
            className={cn(
              'flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium',
              panel === 'qr' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            <QrCode className="size-5 shrink-0" />
            QR code generate
          </button>
          <button
            type="button"
            onClick={() => setPanel('notification')}
            className={cn(
              'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium',
              panel === 'notification' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            <Bell className="size-5" />
            Notification
          </button>
        </nav>

        <div ref={languageRef} className="relative mt-auto">
          <div
            className={cn(
              'absolute bottom-full left-0 right-0 z-30 mb-2 origin-bottom rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_12px_32px_rgba(15,23,42,0.12)] transition duration-200 ease-out',
              languagesOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
            )}
          >
            {languages
              .filter((item) => item.id !== language)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setLanguage(item.id)
                    setLanguagesOpen(false)
                  }}
                  className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span className="size-4 shrink-0 rounded-full border border-slate-300" />
                  {item.label}
                </button>
              ))}
          </div>
          <button
            type="button"
            aria-expanded={languagesOpen}
            onClick={() => setLanguagesOpen((open) => !open)}
            className="flex h-12 w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm"
          >
            <Globe className="size-4 text-slate-400" />
            <span className="min-w-0 flex-1 truncate text-left">{currentLanguage.label}</span>
            <ChevronDown className={cn('size-4 text-slate-400 transition duration-200', languagesOpen && 'rotate-180')} />
          </button>
        </div>
      </aside>
      </div>

      <div className={cn('min-w-0 flex-1', (panel === 'orders' || panel === 'qr') && 'bg-surface')}>
        {panel === 'orders' ? (
          <OrderWizardPage
            selectedProduct={picked}
            selectedFrom={pickedFrom}
            onOpenGallery={() => openForPick('gallery')}
            onOpenTemplates={() => openForPick('templates')}
            onFinished={() => setPanel('templates')}
          />
        ) : panel === 'qr' ? (
          <QrGenerator />
        ) : (
        <>
        <div className="sticky top-0 z-20 bg-white px-6 pb-4 pt-5">
          <form
            className="flex items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              setQuery(draft)
              if (panel === 'notification') setPanel('templates')
            }}
          >
            <button
              type="button"
              aria-label="Show menu"
              onClick={() => setMenuOpen(true)}
              className={cn(
                'grid h-11 shrink-0 place-items-center overflow-hidden rounded-xl text-slate-500 transition-all duration-500 ease-in-out hover:bg-slate-100',
                menuOpen ? 'pointer-events-none -mr-3 w-0 min-w-0 px-0 opacity-0' : 'w-11 opacity-100',
              )}
            >
              <PanelLeftOpen className="size-5" />
            </button>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Search: business card, flyers, banners, t-shirts..."
              className="h-11 min-w-0 flex-1 rounded-full border border-slate-200 px-5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500"
            />
            <button type="submit" className="h-11 shrink-0 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">
              Search
            </button>
            <Link
              href={user ? '/account' : '/login'}
              aria-label={user ? user.name : 'Account'}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-400 hover:text-slate-600"
            >
              <User className="size-5" />
            </Link>
          </form>

          {(panel === 'gallery' || panel === 'templates') && (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setAlike(null)
                    setChip(item.id)
                  }}
                  className={cn(
                    'h-9 rounded-full px-4 text-sm font-medium',
                    chip === item.id
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {panel === 'gallery' || panel === 'templates' ? (
          <>
            {picking && (
              <p className="px-6 pb-4 text-sm text-slate-500">Нажмите на макет, чтобы открыть и посмотреть его.</p>
            )}
            {visible.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-slate-500">Nothing found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 px-6 pb-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visible.map((product) => {
                  const saved = Boolean(favorites?.includes(product.id))
                  const liked = Boolean(user && likes[user.id]?.includes(product.id))
                  return (
                    <div key={product.id} className="group relative aspect-square overflow-hidden rounded-[22px] bg-[#6f7874]">
                      <button
                        type="button"
                        onClick={() => {
                          addView(product.id)
                          setPreviewId(product.id)
                        }}
                        className="absolute inset-0"
                      >
                        <img src={cardPreview.src} alt="" className="size-full object-cover" />
                      </button>
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
                        <button
                          type="button"
                          aria-label="Similar"
                          onClick={() => showSimilar(product)}
                          className="pointer-events-none absolute left-3 top-3 grid size-10 place-items-center rounded-xl bg-[#4a4a4a] text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                        >
                          <SimilarIcon />
                        </button>
                        <button
                          type="button"
                          aria-label={saved ? 'Saved' : 'Save'}
                          aria-pressed={saved}
                          onClick={() => {
                            if (!requireUser() || !user) return
                            toggleFavorite(user.id, product.id)
                          }}
                          className="pointer-events-none absolute right-3 top-3 grid size-10 place-items-center rounded-xl bg-[#4a4a4a] text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                        >
                          <Bookmark className={cn('size-5', saved && 'fill-white')} />
                        </button>
                        <div className="absolute bottom-3 left-3 flex gap-2">
                          <span className="flex h-8 items-center gap-1.5 rounded-full bg-[#4a4a4a] px-3 text-sm font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)]">
                            <Eye className="size-4" />
                            {views[product.id] ?? 0}
                          </span>
                          <button
                            type="button"
                            aria-label={liked ? 'Liked' : 'Like'}
                            aria-pressed={liked}
                            onClick={() => {
                              if (!requireUser() || !user) return
                              toggleLike(user.id, product.id)
                            }}
                            className="pointer-events-none flex h-8 items-center gap-1.5 rounded-full bg-[#4a4a4a] px-3 text-sm font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                          >
                            <Heart className={cn('size-4', liked && 'fill-white')} />
                            {likeCount(likes, product.id)}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="grid min-h-[60vh] place-items-center text-center">
            <div>
              <p className="text-lg font-semibold">Notification</p>
              <p className="mt-2 text-sm text-slate-500">No new notifications.</p>
            </div>
          </div>
        )}
        </>
        )}
      </div>

      <PreviewModal
        product={preview}
        onClose={() => setPreviewId(null)}
        onOrder={
          picking && preview
            ? () => {
                chooseDesign(preview)
                setPreviewId(null)
              }
            : undefined
        }
      />
    </div>
  )
}

function SimilarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="12" height="10" rx="2" />
      <circle cx="7" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <path d="M4 13.2 7.2 10.4 10.2 12.6" />
      <circle cx="16.2" cy="16.2" r="2.7" />
      <path d="m18.3 18.3 2.2 2.2" />
    </svg>
  )
}
