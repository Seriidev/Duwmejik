'use client'

import { Bell, Bookmark, ClipboardList, Eye, Heart, Image as ImageIcon, LayoutGrid, PanelLeftClose, PanelLeftOpen, QrCode } from 'lucide-react'
import cardPreview from '@/assets/card-preview.jpg'
import logoBell from '@/assets/logo-bell.png'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { isPrintWork } from '@/data/catalog'
import { LanguageMenu } from '@/components/LanguageMenu'
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
  { id: 'popular', label: 'Popular' },
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

function isPanel(value: string | null): value is Panel {
  return value === 'gallery' || value === 'templates' || value === 'orders' || value === 'qr' || value === 'notification'
}

function panelUrl(next: Panel) {
  return next === 'templates' ? '/templates' : `/templates?section=${next}`
}

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
  if (chip === 'all' || chip === 'popular') return true
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
  const params = useSearchParams()
  const pick = params.get('pick')
  const section = params.get('section')
  const products = useCatalogStore((state) => state.products)
  const user = useAuthStore((state) => state.user)
  const favorites = useAccountStore((state) => (user ? state.favorites[user.id] : undefined))
  const orders = useAccountStore((state) => state.orders)
  const toggleFavorite = useAccountStore((state) => state.toggleFavorite)
  const views = useEngagementStore((state) => state.views)
  const likes = useEngagementStore((state) => state.likes)
  const addView = useEngagementStore((state) => state.addView)
  const toggleLike = useEngagementStore((state) => state.toggleLike)
  const [menuOpen, setMenuOpen] = useState(true)
  const [panel, setPanel] = useState<Panel>(isPanel(section) ? section : 'templates')
  const [chip, setChip] = useState<ChipId>('all')
  const [alike, setAlike] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<Product | null>(null)
  const [pickedFrom, setPickedFrom] = useState<'gallery' | 'templates' | null>(null)

  useEffect(() => {
    function onPop() {
      const value = new URLSearchParams(window.location.search).get('section')
      setPanel(isPanel(value) ? value : 'templates')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (pick !== 'gallery' && pick !== 'templates') return
    setPicking(true)
    setChip('all')
    setAlike(null)
    setQuery('')
    setDraft('')
    window.history.replaceState({ panel: pick }, '', panelUrl(pick))
    setPanel(pick)
  }, [pick])

  function go(next: Panel) {
    if (next === panel) return
    window.history.pushState({ panel: next }, '', panelUrl(next))
    setPanel(next)
  }

  function openForPick(next: 'gallery' | 'templates') {
    setPicking(true)
    go(next)
    setChip('all')
    setAlike(null)
    setQuery('')
    setDraft('')
  }

  function chooseDesign(product: Product) {
    setPicked(product)
    setPickedFrom(panel === 'gallery' ? 'gallery' : 'templates')
    setPicking(false)
    go('orders')
  }

  const published = products.filter((item) => item.status === 'published')
  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    const alias = searchAliases[text]
    const collection = published.filter((product) =>
      panel === 'gallery' ? isPrintWork(product) : !isPrintWork(product),
    )
    const matched = collection.filter((product) => {
      if (alike && product.categoryId !== alike) return false
      if (!matchesChip(product, chip)) return false
      if (!text) return true
      if (alias && matchesChip(product, alias)) return true
      const haystack = `${product.title} ${product.description} ${product.tags.join(' ')}`.toLowerCase()
      return haystack.includes(text)
    })
    if (chip !== 'popular') return matched
    const demand = new Map<string, number>()
    orders.forEach((order) => {
      if (!order.productId) return
      demand.set(order.productId, (demand.get(order.productId) ?? 0) + 1)
    })
    return [...matched]
      .sort((a, b) => (demand.get(b.id) ?? 0) * 500 + b.downloads - ((demand.get(a.id) ?? 0) * 500 + a.downloads))
      .slice(0, 8)
  }, [published, chip, query, alike, panel, orders])

  function showSimilar(product: Product) {
    const next = similarChip(product)
    setQuery('')
    setDraft('')
    go(isPrintWork(product) ? 'gallery' : 'templates')
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
              go('gallery')
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
              go('templates')
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
              go('orders')
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
            onClick={() => {
              setPicking(false)
              go('qr')
            }}
            className={cn(
              'flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium',
              panel === 'qr' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            <QrCode className="size-5 shrink-0" />
            QR code generate
          </button>
        </nav>

        <div className="mt-auto flex items-center gap-1 pt-4">
          <Link
            href={user ? '/account' : '/login?from=%2Ftemplates'}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1.5 hover:bg-slate-50"
          >
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-600 text-xs font-semibold text-white">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="size-full object-cover" />
              ) : (
                (user?.name ?? 'L')
                  .split(' ')
                  .slice(0, 2)
                  .map((part) => part[0] ?? '')
                  .join('')
                  .toUpperCase()
              )}
            </span>
            <span className="truncate text-sm font-medium text-slate-800">{user?.name ?? 'Log in'}</span>
          </Link>
          <LanguageMenu direction="up" trigger="dots" />
        </div>
      </aside>
      </div>

      <div className={cn('flex min-h-svh min-w-0 flex-1 flex-col', panel === 'qr' && 'bg-surface')}>
        {panel === 'orders' && (
          <PanelHeader title="Способ заказа" menuOpen={menuOpen} onShowMenu={() => setMenuOpen(true)} onBell={() => { setPicking(false); go('notification') }} />
        )}
        {panel === 'qr' && (
          <PanelHeader title="QR code generate" menuOpen={menuOpen} onShowMenu={() => setMenuOpen(true)} onBell={() => { setPicking(false); go('notification') }} />
        )}
        {panel === 'orders' ? (
          <OrderWizardPage
            selectedProduct={picked}
            selectedFrom={pickedFrom}
            onOpenGallery={() => openForPick('gallery')}
            onOpenTemplates={() => openForPick('templates')}
            onFinished={() => go('templates')}
          />
        ) : panel === 'qr' ? (
          <QrGenerator />
        ) : (
        <>
        <div className="sticky top-0 z-20 bg-white px-6 pb-4 pt-5">
          {panel === 'notification' ? (
            <PanelHeader
              title="Notification"
              menuOpen={menuOpen}
              onShowMenu={() => setMenuOpen(true)}
              onBell={() => {
                setPicking(false)
                go('notification')
              }}
              bellActive
              bare
            />
          ) : (
          <form
            className="flex items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              setQuery(draft)
            }}
          >
            <button
              type="button"
              aria-label="Show menu"
              onClick={() => setMenuOpen(true)}
              className={cn(
                'grid h-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 text-slate-500 transition-all duration-500 ease-in-out hover:bg-slate-100',
                menuOpen ? 'pointer-events-none -mr-3 w-0 min-w-0 border-0 px-0 opacity-0' : 'w-11 bg-white opacity-100',
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
            <button
              type="button"
              aria-label="Notification"
              onClick={() => {
                setPicking(false)
                go('notification')
              }}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-400 hover:text-slate-600"
            >
              <Bell className="size-5" />
            </button>
          </form>
          )}

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

function PanelHeader({
  title,
  menuOpen,
  onShowMenu,
  onBell,
  bellActive = false,
  bare = false,
}: {
  title: string
  menuOpen: boolean
  onShowMenu: () => void
  onBell: () => void
  bellActive?: boolean
  bare?: boolean
}) {
  const row = (
    <div className="flex h-11 items-center gap-3">
      <button
        type="button"
        aria-label="Show menu"
        onClick={onShowMenu}
        className={cn(
          'grid h-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 text-slate-500 transition-all duration-500 ease-in-out hover:bg-slate-100',
          menuOpen ? 'pointer-events-none -mr-3 w-0 min-w-0 border-0 px-0 opacity-0' : 'w-11 bg-white opacity-100',
        )}
      >
        <PanelLeftOpen className="size-5" />
      </button>
      <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <button
        type="button"
        aria-label="Notification"
        onClick={onBell}
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-full border',
          bellActive ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600',
        )}
      >
        <Bell className="size-5" />
      </button>
    </div>
  )
  if (bare) return row
  return <div className="sticky top-0 z-20 bg-white px-6 pb-4 pt-5">{row}</div>
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
