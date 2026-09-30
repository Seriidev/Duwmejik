import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Gate } from '@/components/Gate'
import { ProductCard } from '@/components/ProductCard'
import { Badge } from '@/components/ui/Badge'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ORDER_STATUS_LABEL } from '@/data/labels'
import { PreviewModal } from '@/features/catalog/PreviewModal'
import { SERVICES, TARIFFS } from '@/features/orders/pricing'
import { formatDate, formatPrice } from '@/lib/format'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'

export function AccountPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const orders = useAccountStore((state) => state.orders)
  const favorites = useAccountStore((state) => state.favorites)
  const products = useCatalogStore((state) => state.products)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const preview = products.find((item) => item.id === previewId) ?? null

  if (!user) {
    return (
      <Gate
        title="Войдите в кабинет"
        text="Здесь хранятся покупки, скачанные файлы, избранное и статус заявок."
        action={
          <Link to="/login" state={{ from: '/account' }} className={buttonClass()}>
            Войти
          </Link>
        }
      />
    )
  }

  const mineOrders = orders.filter(
    (item) => item.userId === user.id || item.email.toLowerCase() === user.email.toLowerCase(),
  )
  const inProgress = mineOrders.filter((item) => item.status === 'new' || item.status === 'in_progress').length
  const done = mineOrders.filter((item) => item.status === 'done').length
  const liked = (favorites[user.id] ?? [])
    .map((id) => products.find((product) => product.id === id && product.status === 'published'))
    .filter((item) => item != null)
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-slate-400">
        <Link to="/" className="hover:text-slate-700">
          Главная
        </Link>
        <span className="px-2">›</span>
        Кабинет
      </p>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-full bg-blue-600 text-lg font-semibold text-white">
              {initials || 'A'}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-sm text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat label="Заказы" value={String(mineOrders.length)} />
            <Stat label="В работе" value={String(inProgress)} />
            <Stat label="Готово" value={String(done)} />
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-5 h-11 w-full rounded-full border border-rose-200 text-sm font-semibold text-rose-500 hover:bg-rose-50"
          >
            Выйти
          </button>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <h1 className="text-lg font-semibold text-slate-900">История заказов</h1>
          <div className="mt-4 grid gap-3">
            {mineOrders.length === 0 && <Empty text="Заявок пока нет." />}
            {mineOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    {order.id} · {SERVICES[order.service].title}
                  </p>
                  <Badge tone={order.status === 'done' ? 'ok' : order.status === 'cancelled' ? 'bad' : 'info'}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {order.subtype} · {TARIFFS[order.tariff].title} · {formatPrice(order.price)} · около {order.days} дней ·{' '}
                  {formatDate(order.createdAt)}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {liked.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Избранное</h2>
          <div className="mt-4 flex flex-wrap gap-4">
            {liked.map((product) => (
              <div key={product.id} className="w-[220px]">
                <ProductCard product={product} onPreview={setPreviewId} />
              </div>
            ))}
          </div>
        </section>
      )}
      <PreviewModal product={preview} onClose={() => setPreviewId(null)} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f4f7fb] px-2 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-3xl border border-dashed border-line px-5 py-10 text-center text-muted">{text}</p>
}
