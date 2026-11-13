'use client'

import { BarChart3, Bell, Bookmark, ClipboardList, Eye, Heart, Images, LayoutTemplate, PanelLeftOpen, QrCode, Upload } from 'lucide-react'
import { MdOutlineImageSearch } from 'react-icons/md'
import { IconTip } from '@/components/ui/IconTip'
import cardPreview from '@/assets/card-preview.jpg'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Gate } from '@/components/Gate'
import { SearchBox } from '@/components/SearchBox'
import { SideMenu, AccountChip } from '@/components/layout/SideMenu'
import { buttonClass } from '@/components/ui/Button'
import { SavedNotice, useSavedNotice } from '@/components/ui/SavedNotice'
import { isPrintWork } from '@/data/catalog'
import { PreviewModal } from '@/features/catalog/PreviewModal'
import { QrGenerator } from '@/features/catalog/QrGenerator'
import { OrderWizardPage } from '@/features/orders/OrderWizardPage'
import { NoticeBoard } from '@/features/seller/NoticeBoard'
import { UploadWork, type WorkSubmission } from '@/features/seller/UploadWork'
import { WorksBoard } from '@/features/seller/WorksBoard'
import { cn } from '@/lib/cn'
import { dashboardFor, isStaff } from '@/lib/authHref'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { likeCount, useEngagementStore } from '@/store/useEngagementStore'
import { useNoticeStore } from '@/store/useNoticeStore'
import { useThemeStore } from '@/store/useThemeStore'
import type { Product, ProductStatus } from '@/types'

type Panel = 'works' | 'upload' | 'templates' | 'orders' | 'qr' | 'stats' | 'inbox'

const statusText: Record<ProductStatus, string> = {
  pending: 'На проверке',
  published: 'Одобрено',
  rejected: 'Отклонено',
}

export function SellerPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const products = useCatalogStore((state) => state.products)
  const categories = useCatalogStore((state) => state.categories)
  const addProduct = useCatalogStore((state) => state.addProduct)
  const removeProduct = useCatalogStore((state) => state.removeProduct)
  const views = useEngagementStore((state) => state.views)
  const likes = useEngagementStore((state) => state.likes)
  const theme = useThemeStore((state) => state.theme)
  const notices = useNoticeStore((state) => state.items)
  const markAllRead = useNoticeStore((state) => state.markAllRead)
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>('works')
  const [uploadedAt, setUploadedAt] = useState<Record<string, string>>({})
  const [incomingFile, setIncomingFile] = useState<File | null>(null)
  const [notice, setNotice] = useState('')
  const [templateDraft, setTemplateDraft] = useState('')
  const [templateQuery, setTemplateQuery] = useState('')
  const [templateChip, setTemplateChip] = useState<string | null>(null)
  const [templateSearchTick, setTemplateSearchTick] = useState(0)
  const [ordered, setOrdered] = useState<Product | null>(null)
  const [orderedFrom, setOrderedFrom] = useState<'gallery' | 'templates' | null>(null)
  const [picking, setPicking] = useState<'gallery' | 'templates' | null>(null)

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    const apply = () => setMenuOpen(wide.matches)
    apply()
    wide.addEventListener('change', apply)
    return () => wide.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const section = params.get('section')
    const product = useCatalogStore.getState().products.find((item) => item.id === params.get('product'))
    const pick = params.get('pick')
    if (product) {
      setOrdered(product)
      setOrderedFrom(isPrintWork(product) ? 'gallery' : 'templates')
      setPanel('orders')
    } else if (pick === 'gallery' || pick === 'templates') {
      setPicking(pick)
      setPanel('templates')
    } else if (section === 'orders' || section === 'qr') {
      setPanel(section)
    } else if (section === 'notification') {
      setPanel('inbox')
    } else if (section === 'templates' || section === 'gallery') {
      const text = params.get('q') ?? ''
      setTemplateDraft(text)
      setTemplateQuery(text)
      setTemplateChip(searchChip(`/templates?${params}`))
      setPanel('templates')
    }
  }, [])

  useEffect(() => {
    function leave() {
      if (!useAuthStore.getState().user) router.replace('/login')
    }
    if (useAuthStore.persist.hasHydrated()) {
      leave()
      return
    }
    return useAuthStore.persist.onFinishHydration(leave)
  }, [user, router])

  if (!user) return null

  if (isStaff(user.role)) {
    return (
      <div className="min-h-svh bg-white">
        <Gate
          title="Это кабинет дизайнера"
          text="У вашей роли своя рабочая страница."
          action={
            <Link href={dashboardFor(user.role)} className={buttonClass()}>
              Открыть рабочую страницу
            </Link>
          }
        />
      </div>
    )
  }

  if (user.role !== 'buyer' && !/^@[A-Za-z0-9_]{2,24}$/.test(user.handle ?? '')) {
    return (
      <div className="min-h-svh bg-white">
        <Gate
          title="Укажите имя пользователя"
          text="Имя пользователя начинается с @ и обязательно. Поле стоит в настройках профиля, сразу после почты."
          action={
            <Link href="/account?tab=settings" className={buttonClass()}>
              Открыть настройки
            </Link>
          }
        />
      </div>
    )
  }

  if (user.role === 'buyer') {
    return (
      <div className="min-h-svh bg-white">
        <Gate
          title={user.designerRequest?.status === 'pending' ? 'Заявка на проверке' : 'Сначала станьте дизайнером'}
          text={
            user.designerRequest?.status === 'pending'
              ? 'Администратор проверяет вашу заявку. После одобрения здесь откроется кабинет дизайнера.'
              : 'Подайте заявку в настройках профиля. Кабинет откроется после одобрения администратором.'
          }
          action={
            <Link href="/account?tab=settings" className={buttonClass()}>
              Открыть настройки
            </Link>
          }
        />
      </div>
    )
  }

  const mine = products.filter((item) => item.authorId === user.id)
  const inbox = notices.filter((item) => item.userId === user.id)
  const unread = inbox.filter((item) => !item.read).length
  const counts = {
    pending: mine.filter((item) => item.status === 'pending').length,
    published: mine.filter((item) => item.status === 'published').length,
    rejected: mine.filter((item) => item.status === 'rejected').length,
  }
  const totalViews = mine.reduce((sum, item) => sum + (views[item.id] ?? 0), 0)
  const totalLikes = mine.reduce((sum, item) => sum + likeCount(likes, item.id), 0)
  const totalDownloads = mine.reduce((sum, item) => sum + item.downloads, 0)

  function openPanel(next: Panel) {
    setPanel(next)
    setPicking(null)
    if (window.innerWidth < 1024) setMenuOpen(false)
  }

  function openPicker(from: 'gallery' | 'templates') {
    openPanel('templates')
    setPicking(from)
  }

  function orderDesign(product: Product) {
    setOrdered(product)
    setOrderedFrom(picking ?? (isPrintWork(product) ? 'gallery' : 'templates'))
    openPanel('orders')
  }

  function openInbox() {
    if (!user) return
    markAllRead(user.id)
    openPanel('inbox')
  }

  function openUpload(file?: File) {
    if (file) setIncomingFile(file)
    setNotice('')
    openPanel('upload')
  }

  function applyTemplateSearch(label: string, href?: string) {
    const text = label.trim()
    setTemplateDraft(text)
    setTemplateQuery(text)
    setTemplateChip(searchChip(href))
    setTemplateSearchTick((tick) => tick + 1)
  }

  function submitWork(draft: WorkSubmission) {
    if (!user) return
    const product = addProduct(
      {
        title: draft.title,
        description: draft.description,
        price: 0,
        categoryId: draft.categoryId,
        fileTypes: [draft.fileType],
        colors: [],
        style: 'minimal',
        orientation: 'landscape',
        license: 'personal',
        tags: draft.tags,
        image: draft.image,
        gallery: draft.gallery,
      },
      { author: user.name, authorId: user.id, status: 'pending' },
    )
    setUploadedAt((current) => ({ ...current, [product.id]: new Date().toISOString() }))
    setNotice('Работа отправлена на проверку')
    setIncomingFile(null)
    openPanel('works')
  }

  const title =
    panel === 'works'
      ? 'Мои работы'
      : panel === 'upload'
        ? 'Загрузить работу'
        : panel === 'templates'
          ? 'Home feed'
          : panel === 'orders'
            ? 'Способ заказа'
            : panel === 'qr'
            ? 'QR code generate'
            : panel === 'inbox'
              ? 'Сообщения'
              : 'Анализ работ'

  return (
    <div className={cn('flex h-svh overflow-hidden text-slate-900 lg:gap-3 lg:p-3', theme === 'dark' ? 'bg-[#121212]' : 'bg-[#f3f3f4]')}>
      <SideMenu
        expanded={menuOpen}
        onToggle={() => setMenuOpen((open) => !open)}
        loginHref="/login?from=%2Fseller"
        showAccount={false}
        items={[
          { id: 'templates', label: 'Home feed', short: 'Feed', icon: LayoutTemplate, active: panel === 'templates', onClick: () => openPanel('templates') },
          { id: 'qr', label: 'QR code generate', short: 'QR', icon: QrCode, active: panel === 'qr', onClick: () => openPanel('qr') },
          { id: 'orders', label: 'Orders', short: 'Orders', icon: ClipboardList, active: panel === 'orders', onClick: () => openPanel('orders') },
          { id: 'stats', label: 'Анализ', short: 'Анализ', icon: BarChart3, active: panel === 'stats', separator: true, onClick: () => openPanel('stats') },
          { id: 'works', label: 'Мои работы', short: 'Работы', icon: Images, active: panel === 'works', onClick: () => openPanel('works') },
          { id: 'upload', label: 'Загрузить работу', short: 'Загрузить', icon: Upload, active: panel === 'upload', onClick: () => openUpload() },
          { id: 'inbox', label: 'Уведомления', short: 'Увед.', icon: Bell, active: panel === 'inbox', separator: true, badge: unread, onClick: openInbox },
        ]}
      />

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:rounded-[28px]',
          panel === 'works' || panel === 'inbox' || panel === 'templates' ? 'bg-[#f6f7fb]' : panel === 'qr' ? 'bg-[#f4f7fb]' : 'bg-white',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 sm:px-6 lg:rounded-t-[28px]">
          <button
            type="button"
            aria-label="Открыть меню"
            onClick={() => setMenuOpen(true)}
            className={cn(
              'grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 lg:hidden',
              menuOpen && 'pointer-events-none opacity-0',
            )}
          >
            <PanelLeftOpen className="size-5" />
          </button>
          {panel === 'templates' ? (
            <div className="min-w-0 flex-1">
              <SearchBox
                appearance="bar"
                value={templateDraft}
                submitLabel="Search"
                placeholder=""
                onSubmit={(value) => applyTemplateSearch(value)}
                onPick={(pick) => applyTemplateSearch(pick.label, pick.href)}
              />
            </div>
          ) : panel === 'upload' ? (
            <div className="min-w-0 flex-1" />
          ) : (
            <h1 className="min-w-0 flex-1 text-xl font-semibold tracking-tight">{title}</h1>
          )}
          <AccountChip loginHref="/login?from=%2Fseller" className="shrink-0 text-slate-900" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {panel === 'works' ? (
          <WorksBoard
            mine={mine}
            views={views}
            likes={likes}
            categories={categories}
            uploadedAt={uploadedAt}
            notice={notice}
            onOpenUpload={openUpload}
            onRemove={removeProduct}
          />
        ) : panel === 'upload' ? (
          <UploadWork
            categories={categories}
            initialFile={incomingFile}
            onConsumeFile={() => setIncomingFile(null)}
            onSubmit={submitWork}
          />
        ) : panel === 'inbox' ? (
          <NoticeBoard userId={user.id} />
        ) : panel === 'qr' ? (
          <QrGenerator />
        ) : panel === 'orders' ? (
          <OrderWizardPage
            selectedProduct={ordered}
            selectedFrom={orderedFrom}
            onOpenGallery={() => openPicker('gallery')}
            onOpenTemplates={() => openPicker('templates')}
            onFinished={() => {
              setOrdered(null)
              openPanel('templates')
            }}
          />
        ) : panel === 'templates' ? (
          <TemplateCards
            products={products}
            query={templateQuery}
            chip={templateChip}
            searchTick={templateSearchTick}
            picking={Boolean(picking)}
            onOrder={orderDesign}
          />
        ) : (
          <section className="px-4 py-6 sm:px-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <Stat label="На проверке" value={String(counts.pending)} />
              <Stat label="Одобрено" value={String(counts.published)} />
              <Stat label="Отклонено" value={String(counts.rejected)} />
              <Stat label="Просмотры" value={String(totalViews)} />
              <Stat label="Лайки" value={String(totalLikes)} />
              <Stat label="Скачивания" value={String(totalDownloads)} />
            </div>
            <WorkList mine={mine} views={views} likes={likes} />
          </section>
        )}
        </div>
      </div>
    </div>
  )
}

const searchAliases: Record<string, string> = {
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

function matchesSearchChip(product: Product, chip: string) {
  if (chip === 'menu') {
    const text = `${product.title} ${product.tags.join(' ')}`.toLowerCase()
    return text.includes('меню') || text.includes('menu')
  }
  if (chip === 'tshirts') return product.tags.some((tag) => tag.toLowerCase().includes('футбол'))
  return product.categoryId === chip
}

function searchChip(href?: string) {
  if (!href) return null
  const url = new URL(href, 'http://local')
  const category = url.searchParams.get('category')
  const q = (url.searchParams.get('q') ?? '').toLowerCase()
  if (category === 'cards' || category === 'flyers' || category === 'banners' || category === 'postcards' || category === 'stickers') {
    return category
  }
  if (q.includes('меню') || q.includes('menu')) return 'menu'
  return null
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function TemplateCards({
  products,
  query,
  chip,
  searchTick,
  picking,
  onOrder,
}: {
  products: Product[]
  query: string
  chip: string | null
  searchTick: number
  picking: boolean
  onOrder: (product: Product) => void
}) {
  const user = useAuthStore((state) => state.user)
  const favorites = useAccountStore((state) => (user ? state.favorites[user.id] : undefined))
  const toggleFavorite = useAccountStore((state) => state.toggleFavorite)
  const views = useEngagementStore((state) => state.views)
  const likes = useEngagementStore((state) => state.likes)
  const addView = useEngagementStore((state) => state.addView)
  const toggleLike = useEngagementStore((state) => state.toggleLike)
  const [open, setOpen] = useState<Product | null>(null)
  const savedNotice = useSavedNotice()
  const [alike, setAlike] = useState<string | null>(null)
  const [seenSearch, setSeenSearch] = useState(searchTick)
  if (searchTick !== seenSearch) {
    setSeenSearch(searchTick)
    setAlike(null)
  }
  const published = products.filter((item) => item.status === 'published')
  const own = user ? products.filter((item) => item.authorId === user.id && item.status !== 'published') : []
  const feed = [...own, ...published]
  const text = query.trim().toLowerCase()
  const alias = searchAliases[text]
  const shown = feed.filter((item) => {
    if (alike && item.categoryId !== alike) return false
    if (chip && !matchesSearchChip(item, chip)) return false
    if (!text) return true
    if (alias && matchesSearchChip(item, alias)) return true
    const haystack = `${item.title} ${item.description} ${item.tags.join(' ')}`.toLowerCase()
    return haystack.includes(text)
  })
  if (feed.length === 0) {
    return <p className="px-6 py-16 text-center text-sm text-slate-500">В каталоге пока нет шаблонов.</p>
  }

  return (
    <>
      {picking && <p className="px-6 pt-6 text-sm text-slate-500">Нажмите на макет, чтобы открыть и посмотреть его.</p>}
      {alike && (
        <div className="flex items-center justify-between px-4 pt-6 sm:px-6">
          <p className="text-sm font-medium text-slate-700">Похожие</p>
          <button type="button" onClick={() => setAlike(null)} className="text-sm font-medium text-blue-600">
            Все шаблоны
          </button>
        </div>
      )}
      {shown.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-slate-500">Ничего не найдено.</p>
      ) : (
      <div className="grid grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-3 sm:gap-4 sm:px-6 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((product) => {
          const saved = Boolean(favorites?.includes(product.id))
          const liked = Boolean(user && likes[user.id]?.includes(product.id))
          return (
            <div key={product.id} className="group relative aspect-square overflow-hidden rounded-[22px] bg-[#6f7874]">
              <button
                type="button"
                onClick={() => {
                  addView(product.id)
                  setOpen(product)
                }}
                className="absolute inset-0"
              >
                <img src={product.image || cardPreview.src} alt="" className="size-full object-cover" />
              </button>
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Похожие"
                  onClick={() => setAlike(product.categoryId)}
                  className="group/tip pointer-events-none absolute left-3 top-3 grid size-10 place-items-center rounded-xl bg-[#4a4a4a] text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                >
                  <MdOutlineImageSearch className="size-5" />
                  <IconTip label="Похожие" side="right" />
                </button>
                <button
                  type="button"
                  aria-label={saved ? 'Сохранено' : 'Сохранить'}
                  aria-pressed={saved}
                  onClick={() => {
                    if (!user) return
                    const already = favorites?.includes(product.id)
                    toggleFavorite(user.id, product.id)
                    if (!already) savedNotice.show()
                  }}
                  className="group/tip pointer-events-none absolute right-3 top-3 grid size-10 place-items-center rounded-xl bg-[#4a4a4a] text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                >
                  <Bookmark className={cn('size-5', saved && 'fill-white')} />
                  <IconTip label={saved ? 'Сохранено' : 'Сохранить'} side="left" />
                </button>
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="group/tip relative flex h-8 items-center gap-1.5 rounded-full bg-[#4a4a4a] px-3 text-sm font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] group-hover:pointer-events-auto">
                    <Eye className="size-4" />
                    {views[product.id] ?? 0}
                    <IconTip label="Просмотры" side="up" />
                  </span>
                  <button
                    type="button"
                    aria-label={liked ? 'Убрать лайк' : 'Лайк'}
                    aria-pressed={liked}
                    onClick={() => {
                      if (!user) return
                      toggleLike(user.id, product.id)
                    }}
                    className="group/tip pointer-events-none relative flex h-8 items-center gap-1.5 rounded-full bg-[#4a4a4a] px-3 text-sm font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                  >
                    <Heart className={cn('size-4', liked && 'fill-white')} />
                    {likeCount(likes, product.id)}
                    <IconTip label={liked ? 'Убрать лайк' : 'Лайк'} side="up" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}
      <PreviewModal
        product={open}
        onClose={() => setOpen(null)}
        onOrder={() => {
          if (open) onOrder(open)
          setOpen(null)
        }}
      />
      <SavedNotice open={savedNotice.open} />
    </>
  )
}

function WorkList({
  mine,
  views,
  likes,
}: {
  mine: Product[]
  views: Record<string, number>
  likes: Record<string, string[]>
}) {
  if (mine.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-500">Пока нет работ. Новый шаблон появится здесь после загрузки.</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {mine.map((product) => (
        <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-950">{product.title}</p>
            <p className="mt-1 text-sm text-slate-500">{statusText[product.status]}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-4" />
              {views[product.id] ?? 0}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-4" />
              {likeCount(likes, product.id)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
