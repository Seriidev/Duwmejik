'use client'

import {
  BarChart3,
  Check,
  ClipboardList,
  Copy,
  FolderOpen,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Palette,
  QrCode,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import logoBell from '@/assets/logo-bell.png'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ORDER_STATUS_LABEL, ROLE_LABEL } from '@/data/labels'
import { AdminLogin } from '@/features/admin/AdminLogin'
import { FilesPanel } from '@/features/admin/FilesPanel'
import { PickupDesk } from '@/features/admin/PickupDesk'
import { DesignersDesk } from '@/features/admin/DesignersDesk'
import { TemplatesDesk } from '@/features/admin/TemplatesDesk'
import { PricesPanel } from '@/features/admin/PricesPanel'
import { ReportsPanel } from '@/features/admin/ReportsPanel'
import { ProductForm } from '@/features/catalog/ProductForm'
import { SERVICES } from '@/features/orders/pricing'
import { isStaff } from '@/lib/authHref'
import { formatDate, formatPrice, plural } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAdminRightsStore, type AdminRight } from '@/store/useAdminRightsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useFileStore } from '@/store/useFileStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { useNoticeStore, verdictMessage, type NoticeVerdict } from '@/store/useNoticeStore'
import type { CustomOrder, OrderStatus, Product, ProductStatus, Role } from '@/types'

type TabId = 'summary' | 'orders' | 'pickup' | 'files' | 'products' | 'designers' | 'prices' | 'reports' | 'users'

const TAB_LABEL: Record<TabId, string> = {
  summary: 'Сводка',
  orders: 'Заказы',
  pickup: 'Выдача',
  files: 'Файлы',
  products: 'Шаблоны',
  designers: 'Дизайнеры',
  prices: 'Категории и цены',
  reports: 'Отчёты',
  users: 'Пользователи',
}

const ADMIN_TABS: TabId[] = ['summary', 'orders', 'pickup', 'files', 'products', 'designers']

const TABS_FOR: Partial<Record<Role, TabId[]>> = {
  admin: ADMIN_TABS,
  superadmin: ['summary', 'reports', 'prices', ...ADMIN_TABS.filter((item) => item !== 'summary'), 'users'],
}

const TAB_ICON: Record<TabId, LucideIcon> = {
  summary: LayoutDashboard,
  orders: ClipboardList,
  pickup: QrCode,
  files: FolderOpen,
  products: LayoutTemplate,
  designers: Palette,
  prices: Tags,
  reports: BarChart3,
  users: Users,
}

export function AdminPage({ seat }: { seat?: 'u-admin' | 'u-workshop' }) {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const users = useAuthStore((state) => state.users)
  const setRole = useAuthStore((state) => state.setRole)
  const reviewDesigner = useAuthStore((state) => state.reviewDesigner)
  const categories = useCatalogStore((state) => state.categories)
  const products = useCatalogStore((state) => state.products)
  const addProduct = useCatalogStore((state) => state.addProduct)
  const updateProduct = useCatalogStore((state) => state.updateProduct)
  const removeProduct = useCatalogStore((state) => state.removeProduct)
  const setStatus = useCatalogStore((state) => state.setStatus)
  const pushNotice = useNoticeStore((state) => state.push)
  const incomingFiles = useFileStore((state) => state.files.filter((item) => item.toId === user?.id && !item.downloaded).length)
  const orders = useAccountStore((state) => state.orders)
  const setOrderStatus = useAccountStore((state) => state.setOrderStatus)
  const [tab, setTab] = useState<TabId | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pickupCode, setPickupCode] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [openedOrderId, setOpenedOrderId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [editStatus, setEditStatus] = useState<ProductStatus>('published')
  const [creating, setCreating] = useState(false)
  const adminRights = useAdminRightsStore((state) => state.admin)
  const baseTabs = (user && TABS_FOR[user.role]) || []
  const allowed =
    user?.role === 'admin'
      ? baseTabs.filter((item) => item === 'summary' || adminRights[item as AdminRight])
      : baseTabs
  const activeTab = tab && allowed.includes(tab) ? tab : allowed[0]

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('pickup')
    if (!code) return
    setPickupCode(code)
    setTab('pickup')
  }, [])
  function reviewApplication(id: string, approve: boolean, note: string) {
    const message = reviewDesigner(id, approve, note)
    if (message) return message
    if (approve) {
      pushNotice({
        userId: id,
        productId: '',
        title: 'Заявка дизайнера',
        verdict: 'accepted',
        message: note.trim() || 'Заявка одобрена. Кабинет дизайнера открыт.',
      })
    }
    return null
  }

  function decideProduct(product: Product, verdict: NoticeVerdict, categoryId: string, message: string) {
    const accepted = verdict === 'accepted'
    const reason = message.trim()
    if (accepted && !categoryId) return false
    if (!accepted && !reason) return false
    updateProduct(product.id, {
      ...(accepted && categoryId !== product.categoryId ? { categoryId } : {}),
      reviewNote: accepted ? '' : reason,
    })
    setStatus(product.id, accepted ? 'published' : 'rejected')
    pushNotice({
      userId: product.authorId,
      productId: product.id,
      title: product.title,
      verdict,
      message: accepted ? reason || verdictMessage(product.title, verdict) : reason,
    })
    return true
  }

  if (seat && user?.id !== seat) return <AdminLogin seat={seat} />
  if (!user || !isStaff(user.role)) return <AdminLogin />

  const pending = products.filter((item) => item.status === 'pending')
  const applicants = users.filter((item) => item.designerRequest?.status === 'pending')
  const countOrders = (status: OrderStatus) => orders.filter((item) => item.status === status).length
  const badges: Partial<Record<TabId, number>> = {
    orders: countOrders('new'),
    files: incomingFiles,
    products: pending.length,
    designers: applicants.length,
  }

  const openedOrder = orders.find((item) => item.id === openedOrderId) ?? null
  const openTab = (next: TabId) => {
    setTab(next)
    setMenuOpen(false)
  }

  return (
    <div className="flex min-h-svh bg-[#f4f5f7] text-neutral-950">
      {menuOpen && <button type="button" aria-label="Закрыть меню" className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMenuOpen(false)} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex h-svh w-[232px] flex-col border-r border-neutral-200 bg-white transition-transform lg:sticky lg:top-0 lg:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2 px-5 pb-2 pt-5">
          <img src={logoBell.src} alt="" className="size-9 object-contain" />
          <p className="text-[17px] font-semibold tracking-tight">Duwmejik</p>
        </div>
        <nav className="mt-4 grid flex-1 gap-1 content-start overflow-y-auto px-3">
          {allowed.map((item) => {
            const Icon = TAB_ICON[item]
            const active = item === activeTab
            return (
              <button
                key={item}
                type="button"
                onClick={() => openTab(item)}
                className={cn(
                  'flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium',
                  active ? 'bg-[#efe9ff] text-[#4f26c9]' : 'text-[#5b6472] hover:bg-[#f6f7f9]',
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                <span className="min-w-0 flex-1 truncate">{TAB_LABEL[item]}</span>
                {badges[item] ? <span className={cn('text-xs', active ? 'text-[#6d3ef2]' : 'text-[#8a93a1]')}>{badges[item]}</span> : null}
              </button>
            )
          })}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
        >
          <LogOut className="size-4" />
          Выйти
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center px-4 lg:hidden">
          <button type="button" aria-label="Открыть меню" className="grid size-9 place-items-center rounded-lg text-neutral-700 hover:bg-white" onClick={() => setMenuOpen(true)}>
            <Menu className="size-5" />
          </button>
        </header>

        <div className="px-4 pb-12 pt-2 sm:px-8 lg:pt-8">
          {activeTab !== 'summary' && activeTab !== 'orders' && activeTab !== 'pickup' && activeTab !== 'files' && activeTab !== 'products' && activeTab !== 'designers' && (
            <h1 className="text-[26px] font-semibold tracking-tight">{TAB_LABEL[activeTab]}</h1>
          )}
          {activeTab === 'summary' && (
            <SummaryBoard
              orders={orders}
              pending={pending.length}
              applicants={applicants.length}
              files={incomingFiles}
              onOrders={() => openTab('orders')}
              onProducts={() => {
                setStatusFilter('pending')
                openTab('products')
              }}
              onDesigners={() => openTab('designers')}
              onFiles={() => openTab('files')}
              onOpenOrder={setOpenedOrderId}
            />
          )}

      {activeTab === 'reports' && <ReportsPanel />}

      {activeTab === 'prices' && <PricesPanel />}

      {activeTab === 'pickup' && <PickupDesk key={pickupCode} initialCode={pickupCode} />}

      {activeTab === 'files' && <FilesPanel />}

      {activeTab === 'products' && (
        <TemplatesDesk
          products={products}
          categories={categories}
          focus={statusFilter}
          onCreate={() => setCreating(true)}
          onEdit={(product) => {
            setEditing(product)
            setEditStatus(product.status)
          }}
          onRemove={removeProduct}
          onDecide={decideProduct}
        />
      )}

      {activeTab === 'orders' && <OrdersBoard orders={orders} onOpen={setOpenedOrderId} />}

      {activeTab === 'designers' && <DesignersDesk users={users} products={products} categories={categories} onReview={reviewApplication} />}

      {activeTab === 'users' && (
        <div className="mt-6 grid gap-3">
          {users.map((account) => (
            <Card key={account.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{account.name}</p>
                <p className="text-sm text-muted">{account.email}</p>
              </div>
              <Select
                aria-label={`Роль ${account.name}`}
                value={account.role}
                disabled={account.id === user.id}
                onChange={(event) => setRole(account.id, event.target.value as Role)}
              >
                {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </option>
                ))}
              </Select>
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(editing)} title="Редактирование" onClose={() => setEditing(null)}>
        {editing && (
          <ProductForm
            key={editing.id}
            initial={editing}
            status={editStatus}
            onStatus={setEditStatus}
            submitLabel="Сохранить"
            onSubmit={(draft) => {
              updateProduct(editing.id, { ...draft, status: editStatus })
              if (editStatus !== editing.status && (editStatus === 'published' || editStatus === 'rejected')) {
                const verdict: NoticeVerdict = editStatus === 'published' ? 'accepted' : 'rejected'
                pushNotice({
                  userId: editing.authorId,
                  productId: editing.id,
                  title: draft.title,
                  verdict,
                  message: verdictMessage(draft.title, verdict),
                })
              }
              setEditing(null)
            }}
          />
        )}
      </Modal>
      <Drawer open={Boolean(openedOrder)} onClose={() => setOpenedOrderId(null)}>
        {openedOrder && (
          <OrderDetails
            order={openedOrder}
            product={products.find((item) => item.id === openedOrder.productId)}
            onStatus={(status) => setOrderStatus(openedOrder.id, status)}
            onClose={() => setOpenedOrderId(null)}
          />
        )}
      </Drawer>
      <Modal open={creating} title="Новый макет" onClose={() => setCreating(false)}>
        <ProductForm
          submitLabel="Опубликовать"
          onSubmit={(draft) => {
            addProduct(draft, { author: user.name, authorId: user.id, status: 'published' })
            setCreating(false)
          }}
        />
      </Modal>
        </div>
      </div>
    </div>
  )
}

type OrderGroup = 'all' | 'new' | 'work' | 'cancelled'

const ORDER_GROUPS: { id: OrderGroup; label: string; match: (order: CustomOrder) => boolean }[] = [
  { id: 'all', label: 'Все', match: () => true },
  { id: 'new', label: 'Новые', match: (order) => order.status === 'new' },
  { id: 'work', label: 'В работе', match: (order) => order.status === 'accepted' || order.status === 'in_progress' },
  { id: 'cancelled', label: 'Отклонено', match: (order) => order.status === 'cancelled' },
]

function dotDate(iso: string) {
  const date = new Date(iso)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${date.getFullYear()}`
}

function deadlineLabel(order: CustomOrder) {
  if (order.days === 3) return 'Обычный 2–3 дня'
  if (order.days === 1) return 'Срочно 1 день'
  if (order.days === 0) return 'Экстра срочно'
  const saved = order.brief?.deadline?.trim()
  return saved || orderDays(order.days)
}

function OrdersBoard({ orders, onOpen }: { orders: CustomOrder[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<OrderGroup>('all')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 6
  const todayTitle = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  const sorted = [...orders].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  const needle = query.trim().toLowerCase()
  const filtered = sorted.filter((order) => {
    if (!ORDER_GROUPS.find((item) => item.id === group)?.match(order)) return false
    if (date) {
      const [year, month, day] = date.split('-').map(Number)
      if (dayKey(new Date(order.createdAt)) !== `${year}-${month - 1}-${day}`) return false
    }
    if (!needle) return true
    return [order.id, order.customerName, order.phone, order.email].join(' ').toLowerCase().includes(needle)
  })
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const shown = filtered.slice((current - 1) * pageSize, current * pageSize)
  const pageButtons = pages <= 5 ? Array.from({ length: pages }, (_, index) => index + 1) : [1, 2, 3, '…', pages]

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Заказы</h1>
        <p className="pb-1 text-sm text-neutral-400">{todayTitle}</p>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          placeholder="Поиск по номеру, имени или телефону"
          className="h-12 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none placeholder:text-neutral-400"
        />
        <label className="relative inline-flex h-12 shrink-0 items-center rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-700">
          <span>{date ? dotDate(`${date}T00:00:00`) : 'Все даты'}</span>
          <input
            type="date"
            value={date}
            aria-label="Дата заказа"
            onChange={(event) => {
              setDate(event.target.value)
              setPage(1)
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
      <div className="mt-4 inline-flex flex-wrap gap-1 rounded-xl bg-white p-1">
        {ORDER_GROUPS.map((item) => {
          const count = sorted.filter(item.match).length
          const active = group === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setGroup(item.id)
                setPage(1)
              }}
              className={cn('rounded-lg px-3 py-1.5 text-sm', active ? 'bg-[#5b4dff] font-medium text-white' : 'text-neutral-600 hover:bg-neutral-50')}
            >
              {item.label} · {count}
            </button>
          )
        })}
      </div>
      <section className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {shown.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-neutral-400">Заказов нет.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs text-neutral-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Name/Surname</th>
                  <th className="px-3 py-4 font-medium">Code</th>
                  <th className="px-3 py-4 font-medium">Type of product</th>
                  <th className="px-3 py-4 font-medium">Срок сдачи</th>
                  <th className="px-3 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((order) => (
                  <tr key={order.id} onClick={() => onOpen(order.id)} className="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50">
                    <td className="px-5 py-4 font-medium">{shortName(order.customerName)}</td>
                    <td className="px-3 py-4 font-medium text-[#5b4dff]">#{order.id}</td>
                    <td className="px-3 py-4 font-medium text-[#5b4dff]">{order.subtype}</td>
                    <td className="px-3 py-4">
                      <span className="inline-flex rounded-full bg-[#efeaff] px-3 py-1 text-xs font-medium text-[#5b4dff]">{deadlineLabel(order)}</span>
                    </td>
                    <td className="px-3 py-4 font-medium text-[#5b4dff]">{dotDate(order.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex min-w-[104px] justify-center rounded-full px-4 py-1.5 text-xs font-medium', statusPill(order.status))}>
                        {ORDER_STATUS_LABEL[order.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-4 text-sm text-neutral-400">
          <p>
            Показано {shown.length} из {filtered.length} {filtered.length % 10 === 1 && filtered.length % 100 !== 11 ? 'заказа' : 'заказов'}
          </p>
          <div className="flex items-center gap-1 text-[#5b4dff]">
            <button type="button" aria-label="Предыдущая страница" disabled={current === 1} onClick={() => setPage(current - 1)} className="grid size-8 place-items-center rounded-lg disabled:opacity-30">
              ←
            </button>
            {pageButtons.map((item, index) =>
              item === '…' ? (
                <span key={`gap-${index}`} className="px-1 text-neutral-300">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={cn('grid size-8 place-items-center rounded-lg', item === current ? 'font-semibold' : 'text-neutral-400')}
                >
                  {item}
                </button>
              ),
            )}
            <button type="button" aria-label="Следующая страница" disabled={current === pages} onClick={() => setPage(current + 1)} className="grid size-8 place-items-center rounded-lg disabled:opacity-30">
              →
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

const BRIEF_VALUE: Record<string, string> = {
  upload: 'Загруженный файл',
  catalog: 'Каталог',
}

function orderDays(days: number) {
  if (days === 0) return 'в тот же день'
  if (days === 1) return '1 день'
  if (days === 3) return '2–3 дня'
  return `около ${days} дней`
}

const CATEGORY_COVER: Record<string, string> = {
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

function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-neutral-950/30" aria-label="Закрыть" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-labelledby="order-drawer-title" className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-[-16px_0_40px_rgba(15,23,42,0.12)]">
        {children}
      </aside>
    </div>
  )
}

function OrderDetails({
  order,
  product,
  onStatus,
  onClose,
}: {
  order: CustomOrder
  product?: Product
  onStatus: (status: OrderStatus) => void
  onClose: () => void
}) {
  const brief = order.brief ?? {}
  const cover = product?.image || product?.gallery?.[0] || (order.categoryId ? CATEGORY_COVER[order.categoryId] : '')
  const next =
    order.status === 'new'
      ? { status: 'accepted' as const, label: 'Принять' }
      : order.status === 'accepted'
        ? { status: 'in_progress' as const, label: 'Взять в работу' }
        : order.status === 'in_progress'
          ? { status: 'ready' as const, label: 'Готово к выдаче' }
          : null
  const canCancel = next && order.status !== 'in_progress'
  const files = (order.references ?? []).filter(Boolean)

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-5">
        <h2 id="order-drawer-title" className="truncate text-lg font-semibold tracking-tight">
          Заказ #{order.id}
        </h2>
        <span className={cn('inline-flex shrink-0 justify-center rounded-full px-4 py-1.5 text-xs font-medium', statusPill(order.status))}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <InfoBlock title="Информация о клиенте">
          <Fact label="Имя фамилия" value={order.customerName || '—'} />
          <Fact label="Почта" value={order.email || '—'} />
          <Fact label="Телефон" value={order.phone || '—'} />
        </InfoBlock>
        <InfoBlock title="Параметры заказа">
          <Fact label="Номер" value={order.id} />
          <Fact label="Услуга" value={SERVICES[order.service]?.title ?? order.service} />
          <Fact label="Дата" value={formatDate(order.createdAt)} />
          {order.pickupCode && <Fact label="Код получения" value={order.pickupCode} copy />}
        </InfoBlock>
        <InfoBlock title="Детали заказа">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <Fact label="Изделие" value={order.subtype || '—'} />
            <Fact label="Тираж, шт." value={String(order.quantity)} />
            <Fact label="Размер" value={brief.format || '—'} />
            <Fact label="Края" value={brief.edges || '—'} />
            <Fact label="Бумага" value={brief.paper || '—'} />
            <Fact label="Срок сдачи" value={brief.deadline || deadlineLabel(order)} />
            <Fact label="Стороны" value={brief.sides || '—'} />
            <Fact label="Источник" value={BRIEF_VALUE[brief.source] || brief.source || '—'} />
          </div>
          <Fact label="Описание задачи" value={order.comment || '—'} />
          {files.length > 0 && <Fact label="Файлы" value={files.join(', ')} />}
        </InfoBlock>
        {cover && <img src={cover} alt={product?.title || order.subtype} className="mt-4 h-52 w-full rounded-2xl object-cover" />}
        <div className={cn('mt-4 rounded-2xl px-4 py-3', order.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>
          <p className="text-sm">{order.status === 'cancelled' ? 'Заказ отменён' : 'Оплачено полностью'}</p>
          <p className="text-2xl font-semibold tracking-tight">{formatPrice(order.price)}</p>
        </div>
      </div>
      <footer className="flex gap-2 border-t border-neutral-100 px-5 py-4">
        <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50">
          Закрыть
        </button>
        {canCancel && (
          <button type="button" onClick={() => onStatus('cancelled')} className="h-11 flex-1 rounded-xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50">
            Отменить
          </button>
        )}
        {next && (
          <button type="button" onClick={() => onStatus(next.status)} className="h-11 flex-1 rounded-xl bg-brand text-sm font-semibold text-white hover:brightness-110">
            {next.label}
          </button>
        )}
      </footer>
    </>
  )
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-neutral-200 py-4 first:border-t-0 first:pt-2">
      <h3 className="mb-2.5 text-sm font-semibold text-[#5b4dff]">{title}</h3>
      <div className="grid gap-1.5">{children}</div>
    </section>
  )
}

function Fact({ label, value, copy = false }: { label: string; value: string; copy?: boolean }) {
  const [done, setDone] = useState(false)

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const area = document.createElement('textarea')
      area.value = value
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    setDone(true)
    window.setTimeout(() => setDone(false), 1200)
  }

  return (
    <p className="flex items-center gap-1.5 text-sm leading-5 text-neutral-900">
      <span>
        {label}
        <span className="text-neutral-400"> : </span>
        {value}
      </span>
      {copy && (
        <button
          type="button"
          onClick={() => void copyValue()}
          aria-label={done ? 'Скопировано' : 'Копировать код'}
          className="grid size-6 shrink-0 place-items-center rounded-md text-[#5b4dff] hover:bg-[#efeaff]"
        >
          {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      )}
    </p>
  )
}

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function shiftDay(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function sameDay(iso: string, day: Date) {
  return dayKey(new Date(iso)) === dayKey(day)
}

function deltaText(today: number, yesterday: number, unit: 'count' | 'money') {
  if (unit === 'count') {
    const delta = today - yesterday
    if (delta > 0) return { text: `+${delta} к вчерашнему дню`, up: true }
    if (delta < 0) return { text: `${delta} к вчерашнему дню`, up: false }
    return { text: 'как вчера', up: false }
  }
  if (yesterday === 0) return { text: today === 0 ? 'как вчера' : 'новые оплаты', up: today > 0 }
  const percent = Math.round(((today - yesterday) / yesterday) * 100)
  if (percent > 0) return { text: `+${percent}% к вчерашнему дню`, up: true }
  if (percent < 0) return { text: `${percent}% к вчерашнему дню`, up: false }
  return { text: 'как вчера', up: false }
}

function dueLabel(order: CustomOrder) {
  const created = new Date(order.createdAt)
  const due = shiftDay(created, order.days)
  const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(created)
  if (dayKey(due) === dayKey(new Date())) return `Сегодня, ${time}`
  const date = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(due).replace('.', '')
  return `${date}, ${time}`
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return name
  return `${parts[0]} ${parts[1][0]}.`
}

function statusPill(status: OrderStatus) {
  if (status === 'ready' || status === 'issued') return 'bg-emerald-50 text-emerald-600'
  if (status === 'accepted' || status === 'in_progress') return 'bg-amber-50 text-amber-600'
  if (status === 'cancelled') return 'bg-rose-50 text-rose-600'
  return 'bg-neutral-100 text-neutral-500'
}

function SummaryBoard({
  orders,
  pending,
  applicants,
  files,
  onOrders,
  onProducts,
  onDesigners,
  onFiles,
  onOpenOrder,
}: {
  orders: CustomOrder[]
  pending: number
  applicants: number
  files: number
  onOrders: () => void
  onProducts: () => void
  onDesigners: () => void
  onFiles: () => void
  onOpenOrder: (id: string) => void
}) {
  const today = new Date()
  const yesterday = shiftDay(today, -1)
  const active = orders.filter((order) => order.status !== 'cancelled')
  const todayOrders = active.filter((order) => sameDay(order.createdAt, today))
  const yesterdayOrders = active.filter((order) => sameDay(order.createdAt, yesterday))
  const todayPaid = todayOrders.reduce((sum, order) => sum + order.price, 0)
  const yesterdayPaid = yesterdayOrders.reduce((sum, order) => sum + order.price, 0)
  const orderDelta = deltaText(todayOrders.length, yesterdayOrders.length, 'count')
  const paidDelta = deltaText(todayPaid, yesterdayPaid, 'money')
  const production = orders.filter((order) => order.status === 'accepted' || order.status === 'in_progress')
  const dueToday = production.filter((order) => dayKey(shiftDay(new Date(order.createdAt), order.days)) === dayKey(today)).length
  const ready = orders.filter((order) => order.status === 'ready').length
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDay(today, index - 6)
    return {
      key: dayKey(date),
      label: WEEKDAYS[date.getDay()],
      count: active.filter((order) => sameDay(order.createdAt, date)).length,
      today: index === 6,
    }
  })
  const peak = Math.max(1, ...week.map((day) => day.count))
  const first = week[0]
  const last = week[6]
  const rangeStart = new Date(today)
  rangeStart.setDate(today.getDate() - 6)
  const sameMonth = rangeStart.getMonth() === today.getMonth()
  const range = sameMonth
    ? `${rangeStart.getDate()}–${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(today)}`
    : `${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(rangeStart).replace('.', '')} – ${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(today).replace('.', '')}`
  const recent = [...orders].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 4)
  const todayTitle = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(today)
  const attention = [
    { count: pending, title: 'Работ на проверке', text: 'Выбрать категории и опубликовать', onClick: onProducts },
    { count: applicants, title: 'Заявок дизайнеров', text: 'Проверить портфолио', onClick: onDesigners },
    { count: files, title: 'Новых файлов', text: 'От команды и суперадмина', onClick: onFiles },
  ]

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Дашборд</h1>
        <p className="pb-1 text-sm text-neutral-400">{todayTitle}</p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Заказы сегодня" value={String(todayOrders.length)} hint={orderDelta.text} up={orderDelta.up} />
        <Stat
          label="В производстве"
          value={String(production.length)}
          hint={dueToday > 0 ? `${dueToday} ${plural(dueToday, 'заказ', 'заказа', 'заказов')} — на сегодня` : 'на сегодня нет'}
        />
        <Stat label="Готовы к выдаче" value={String(ready)} hint="Ожидают получения" />
        <Stat label="Оплачено сегодня" value={todayPaid === 0 ? '0 TMT' : formatPrice(todayPaid)} hint={paidDelta.text} up={paidDelta.up} />
      </div>
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold">Заказы за неделю</h2>
            <p className="text-xs text-neutral-400">{range}</p>
          </div>
          <div className="mt-6 flex h-44 items-end gap-2 sm:gap-4">
            {week.map((day) => (
              <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className="text-xs text-neutral-400">{day.count}</span>
                <div className="flex h-28 w-full items-end justify-center">
                  <div
                    className={cn('w-full max-w-10 rounded-t-lg', day.today ? 'bg-[#5b4dff]' : 'bg-[#e4defe]')}
                    style={{ height: `${Math.max(day.count === 0 ? 6 : 12, Math.round((day.count / peak) * 112))}px` }}
                  />
                </div>
                <span className="text-xs text-neutral-400">{day.label}</span>
              </div>
            ))}
          </div>
          <p className="sr-only">
            С {first.label} по {last.label}
          </p>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-base font-semibold">Требуют внимания</h2>
          <ul className="mt-4 grid gap-4">
            {attention.map((item) => (
              <li key={item.title}>
                <button type="button" onClick={item.onClick} className="flex w-full items-center gap-3 text-left">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#efeaff] text-sm font-semibold text-[#5b4dff]">{item.count}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-neutral-400">{item.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Последние заказы</h2>
          <button type="button" onClick={onOrders} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Все заказы →
          </button>
        </div>
        {recent.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-400">Заказов пока нет.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-xs text-neutral-400">
                <tr>
                  <th className="pb-3 font-medium">Заказ</th>
                  <th className="pb-3 font-medium">Клиент / продукция</th>
                  <th className="pb-3 font-medium">Статус</th>
                  <th className="pb-3 font-medium">Сумма</th>
                  <th className="pb-3 font-medium">Срок</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order.id} className="border-t border-neutral-100">
                    <td className="py-3">
                      <button type="button" onClick={() => onOpenOrder(order.id)} className="font-medium text-[#5b4dff]">
                        #{order.id}
                      </button>
                    </td>
                    <td className="py-3 text-neutral-700">
                      {shortName(order.customerName)} · {order.subtype}
                    </td>
                    <td className="py-3">
                      <span className={cn('inline-flex min-w-[104px] justify-center rounded-full px-4 py-1.5 text-xs font-medium', statusPill(order.status))}>
                        {ORDER_STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td className="py-3">{formatPrice(order.price)}</td>
                    <td className="py-3 text-neutral-500">{dueLabel(order)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, hint, up = false }: { label: string; value: string; hint: string; up?: boolean }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight">{value}</p>
      <p className={cn('mt-2 text-xs', up ? 'text-emerald-500' : 'text-neutral-400')}>{hint}</p>
    </section>
  )
}
