import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Gate } from '@/components/Gate'
import { Badge } from '@/components/ui/Badge'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ORDER_STATUS_LABEL, PRODUCT_STATUS_LABEL, ROLE_LABEL } from '@/data/labels'
import { ProductForm } from '@/features/catalog/ProductForm'
import { SERVICES } from '@/features/orders/pricing'
import { formatDate, formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import type { OrderStatus, Product, ProductStatus, Role } from '@/types'

const tabs = ['Сводка', 'Товары', 'Категории', 'Заявки', 'Пользователи'] as const

export function AdminPage() {
  const user = useAuthStore((state) => state.user)
  const users = useAuthStore((state) => state.users)
  const setRole = useAuthStore((state) => state.setRole)
  const categories = useCatalogStore((state) => state.categories)
  const products = useCatalogStore((state) => state.products)
  const addProduct = useCatalogStore((state) => state.addProduct)
  const updateProduct = useCatalogStore((state) => state.updateProduct)
  const removeProduct = useCatalogStore((state) => state.removeProduct)
  const setStatus = useCatalogStore((state) => state.setStatus)
  const addCategory = useCatalogStore((state) => state.addCategory)
  const renameCategory = useCatalogStore((state) => state.renameCategory)
  const removeCategory = useCatalogStore((state) => state.removeCategory)
  const orders = useAccountStore((state) => state.orders)
  const purchases = useAccountStore((state) => state.purchases)
  const setOrderStatus = useAccountStore((state) => state.setOrderStatus)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Сводка')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [editing, setEditing] = useState<Product | null>(null)
  const [editStatus, setEditStatus] = useState<ProductStatus>('published')
  const [creating, setCreating] = useState(false)
  const [categoryTitle, setCategoryTitle] = useState('')
  const [categoryColor, setCategoryColor] = useState('#dbeafe')
  const [categoryError, setCategoryError] = useState('')

  if (!user || user.role !== 'admin') {
    return (
      <Gate
        title="Админка закрыта"
        text="Нужна роль администратора. Демо: admin@duwmejik.ru, пароль demo."
        action={
          <Link to="/login" state={{ from: '/admin' }} className={buttonClass()}>
            Войти как админ
          </Link>
        }
      />
    )
  }

  const pending = products.filter((item) => item.status === 'pending')
  const revenue = purchases.reduce((sum, item) => sum + item.price, 0)
  const visibleProducts = products.filter((item) => statusFilter === 'all' || item.status === statusFilter)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">Админка</h1>
      <p className="mt-2 text-muted">Каталог, модерация, заявки и роли. Доступ только у администратора.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={cn('rounded-full px-4 py-2 text-sm font-semibold', tab === item ? 'bg-neutral-950 text-white' : 'bg-soft')}
          >
            {item}
            {item === 'Товары' && pending.length > 0 ? ` · ${pending.length}` : ''}
          </button>
        ))}
      </div>

      {tab === 'Сводка' && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Макеты" value={String(products.length)} />
          <Stat label="На модерации" value={String(pending.length)} />
          <Stat label="Заявки" value={String(orders.length)} />
          <Stat label="Выручка шаблонов" value={formatPrice(revenue)} />
        </div>
      )}

      {tab === 'Товары' && (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(['all', 'pending', 'published', 'rejected'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatusFilter(item)}
                className={cn('rounded-full px-3 py-1.5 text-sm', statusFilter === item ? 'bg-neutral-950 text-white' : 'bg-soft')}
              >
                {item === 'all' ? 'Все' : PRODUCT_STATUS_LABEL[item]}
              </button>
            ))}
            <Button size="sm" className="ml-auto" onClick={() => setCreating(true)}>
              Добавить
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 font-medium">Название</th>
                  <th className="py-2 font-medium">Автор</th>
                  <th className="py-2 font-medium">Цена</th>
                  <th className="py-2 font-medium">Статус</th>
                  <th className="py-2 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id} className="border-t border-line">
                    <td className="py-3 font-medium">{product.title}</td>
                    <td>{product.author}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      <Badge tone={product.status === 'published' ? 'ok' : product.status === 'pending' ? 'pending' : 'bad'}>
                        {PRODUCT_STATUS_LABEL[product.status]}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        {product.status !== 'published' && (
                          <Button size="sm" variant="secondary" onClick={() => setStatus(product.id, 'published')}>
                            Опубликовать
                          </Button>
                        )}
                        {product.status === 'pending' && (
                          <Button size="sm" variant="ghost" onClick={() => setStatus(product.id, 'rejected')}>
                            Отклонить
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(product)
                            setEditStatus(product.status)
                          }}
                        >
                          Править
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => removeProduct(product.id)}>
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'Категории' && (
        <div className="mt-6 grid gap-4">
          <Card className="grid gap-3 p-4 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
            <Input label="Новая категория" value={categoryTitle} onChange={(event) => setCategoryTitle(event.target.value)} />
            <Input label="Цвет" type="color" value={categoryColor} onChange={(event) => setCategoryColor(event.target.value)} />
            <Button
              onClick={() => {
                if (!categoryTitle.trim()) {
                  setCategoryError('Введите название')
                  return
                }
                addCategory(categoryTitle, categoryColor)
                setCategoryTitle('')
                setCategoryError('')
              }}
            >
              Добавить
            </Button>
          </Card>
          {categoryError && <p className="text-sm text-rose-600">{categoryError}</p>}
          {categories.map((category) => {
            const used = products.some((item) => item.categoryId === category.id)
            return (
              <Card key={category.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="size-8 rounded-full border border-line" style={{ background: category.color }} />
                <input
                  defaultValue={category.title}
                  aria-label={`Название ${category.title}`}
                  className="h-10 min-w-48 flex-1 rounded-xl border border-line bg-card px-3"
                  onBlur={(event) => {
                    if (event.target.value.trim()) renameCategory(category.id, event.target.value)
                  }}
                />
                <Button
                  size="sm"
                  variant="danger"
                  disabled={used}
                  onClick={() => {
                    if (!removeCategory(category.id)) setCategoryError('В категории ещё есть макеты')
                  }}
                >
                  {used ? 'Есть макеты' : 'Удалить'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'Заявки' && (
        <div className="mt-6 grid gap-3">
          {orders.length === 0 && <p className="text-muted">Заявок нет.</p>}
          {orders.map((order) => (
            <Card key={order.id} className="grid gap-3 p-4 md:grid-cols-[1fr_14rem] md:items-center">
              <div>
                <p className="font-semibold">
                  {order.id} · {order.customerName}
                </p>
                <p className="text-sm text-muted">
                  {SERVICES[order.service].title} · {order.subtype} · {formatPrice(order.price)} · {order.email} · {formatDate(order.createdAt)}
                </p>
                {order.comment && <p className="mt-1 text-sm">{order.comment}</p>}
              </div>
              <Select
                aria-label={`Статус ${order.id}`}
                value={order.status}
                onChange={(event) => setOrderStatus(order.id, event.target.value as OrderStatus)}
              >
                {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABEL[status]}
                  </option>
                ))}
              </Select>
            </Card>
          ))}
        </div>
      )}

      {tab === 'Пользователи' && (
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
              setEditing(null)
            }}
          />
        )}
      </Modal>
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
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  )
}
