'use client'

import { Bell, Bookmark, ClipboardList, Eye, Heart, Image as ImageIcon, LayoutGrid, PanelLeftOpen, QrCode } from 'lucide-react'
import { MdOutlineImageSearch } from 'react-icons/md'
import cardPreview from '@/assets/card-preview.jpg'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { SideMenu } from '@/components/layout/SideMenu'
import { SearchBox } from '@/components/SearchBox'
import { isPrintWork } from '@/data/catalog'
import { PreviewModal } from '@/features/catalog/PreviewModal'
import { OrderWizardPage } from '@/features/orders/OrderWizardPage'
import { QrGenerator } from '@/features/catalog/QrGenerator'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { likeCount, useEngagementStore } from '@/store/useEngagementStore'
import { useThemeStore } from '@/store/useThemeStore'
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
  const theme = useThemeStore((state) => state.theme)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    const apply = () => setMenuOpen(wide.matches)
    apply()
    wide.addEventListener('change', apply)
    return () => wide.removeEventListener('change', apply)
  }, [])
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
    const category = params.get('category')
    const q = params.get('q')
    if (!category && !q) return
    setAlike(null)
    setPicking(false)
    if (q && !category) {
      const lower = q.toLowerCase()
      if (lower.includes('меню') || lower.includes('menu')) {
        setChip('menu')
        setQuery('')
        setDraft('')
        return
      }
      setChip('all')
      setQuery(q)
      setDraft(q)
      return
    }
    if (!category) return
    const known = chips.find((item) => item.id === category)
    if (known && known.id !== 'all' && known.id !== 'popular') {
      setChip(known.id)
      setQuery('')
      setDraft('')
      return
    }
    setChip('all')
    setAlike(category)
    setQuery('')
    setDraft('')
  }, [params])

  useEffect(() => {
    const id = params.get('product')
    if (!id) return
    const product = products.find((item) => item.id === id)
    if (!product) return
    setPicked(product)
    setPickedFrom(isPrintWork(product) ? 'gallery' : 'templates')
    setPanel('orders')
  }, [params, products])

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
    if (next !== panel) {
      window.history.pushState({ panel: next }, '', panelUrl(next))
      setPanel(next)
    }
    if (window.innerWidth < 1024) setMenuOpen(false)
  }

  function applySearch(label: string, href?: string) {
    const text = label.trim()
    setDraft(text)
    setQuery(text)
    setAlike(null)
    let nextChip: ChipId = 'all'
    if (href) {
      const url = new URL(href, 'http://local')
      const category = url.searchParams.get('category')
      const q = (url.searchParams.get('q') ?? '').toLowerCase()
      if (category === 'cards' || category === 'flyers' || category === 'banners' || category === 'postcards' || category === 'stickers') {
        nextChip = category
      } else if (q.includes('меню') || q.includes('menu')) {
        nextChip = 'menu'
      }
    }
    setChip(nextChip)
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
    <div className={cn('flex h-svh overflow-hidden text-slate-900 lg:gap-3 lg:p-3', theme === 'dark' ? 'bg-[#121212]' : 'bg-[#f3f3f4]')}>
      <SideMenu
        expanded={menuOpen}
        onToggle={() => setMenuOpen((open) => !open)}
        loginHref="/login?from=%2Ftemplates"
        items={[
          {
            id: 'gallery',
            label: 'Our Gallery',
            short: 'Gallery',
            icon: ImageIcon,
            active: panel === 'gallery',
            onClick: () => {
              setPicking(false)
              go('gallery')
              setChip('all')
              setAlike(null)
              setQuery('')
              setDraft('')
            },
          },
          {
            id: 'templates',
            label: 'Templates',
            short: 'Templates',
            icon: LayoutGrid,
            active: panel === 'templates',
            onClick: () => {
              setPicking(false)
              go('templates')
              setChip('all')
              setAlike(null)
              setQuery('')
              setDraft('')
            },
          },
          {
            id: 'qr',
            label: 'QR code generate',
            short: 'QR',
            icon: QrCode,
            active: panel === 'qr',
            onClick: () => {
              setPicking(false)
              go('qr')
            },
          },
          {
            id: 'orders',
            label: 'Orders',
            short: 'Orders',
            icon: ClipboardList,
            active: panel === 'orders',
            onClick: () => {
              setPicking(false)
              go('orders')
            },
          },
        ]}
      />

      <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:rounded-[28px]', panel === 'qr' ? 'bg-[#f4f7fb]' : 'bg-white')}>
        {panel === 'orders' && (
          <PanelHeader title="Способ заказа" menuOpen={menuOpen} onShowMenu={() => setMenuOpen(true)} onBell={() => { setPicking(false); go('notification') }} />
        )}
        {panel === 'qr' && (
          <PanelHeader title="QR code generate" menuOpen={menuOpen} onShowMenu={() => setMenuOpen(true)} onBell={() => { setPicking(false); go('notification') }} />
        )}
        {panel === 'orders' ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
          <OrderWizardPage
            selectedProduct={picked}
            selectedFrom={pickedFrom}
            onOpenGallery={() => openForPick('gallery')}
            onOpenTemplates={() => openForPick('templates')}
            onFinished={() => go('templates')}
          />
          </div>
        ) : panel === 'qr' ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <QrGenerator />
          </div>
        ) : (
        <>
        <div className="shrink-0 bg-white px-4 pb-4 pt-4 sm:px-6 sm:pt-5 lg:rounded-t-[28px]">
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Show menu"
              onClick={() => setMenuOpen(true)}
              className={cn(
                'grid h-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 text-slate-500 transition-all duration-500 ease-in-out hover:bg-slate-100 lg:hidden',
                menuOpen ? 'pointer-events-none -mr-3 w-0 min-w-0 border-0 px-0 opacity-0' : 'w-11 bg-white opacity-100',
              )}
            >
              <PanelLeftOpen className="size-5" />
            </button>
            <div className="min-w-0 flex-1">
              <SearchBox
                appearance="bar"
                value={draft}
                submitLabel="Search"
                placeholder="Search: business card, flyers, banners, t-shirts..."
                onSubmit={(value) => applySearch(value)}
                onPick={(pick) => applySearch(pick.label, pick.href)}
              />
            </div>
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
          </div>
          )}

          {(panel === 'gallery' || panel === 'templates') && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {chips.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setAlike(null)
                    setChip(item.id)
                  }}
                  className={cn(
                    'h-9 shrink-0 rounded-full px-4 text-sm font-medium',
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
        <div className="min-h-0 flex-1 overflow-y-auto">
        {panel === 'gallery' || panel === 'templates' ? (
          <>
            {picking && (
              <p className="px-6 pb-4 text-sm text-slate-500">Нажмите на макет, чтобы открыть и посмотреть его.</p>
            )}
            {visible.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-slate-500">Nothing found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 px-4 pb-6 sm:grid-cols-3 sm:gap-4 sm:px-6 lg:grid-cols-4 xl:grid-cols-5">
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
                          <MdOutlineImageSearch className="size-5" />
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
        </div>
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
          'grid h-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 text-slate-500 transition-all duration-500 ease-in-out hover:bg-slate-100 lg:hidden',
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
  return <div className="shrink-0 border-b border-slate-100 bg-white px-6 pb-4 pt-5 lg:rounded-t-[28px]">{row}</div>
}

