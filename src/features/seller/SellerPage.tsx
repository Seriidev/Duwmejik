import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Gate } from '@/components/Gate'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Input'
import { LICENSE_LABEL, LICENSES, PRODUCT_STATUS_LABEL } from '@/data/labels'
import { ProductForm } from '@/features/catalog/ProductForm'
import { formatPrice } from '@/lib/format'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import type { LicenseId } from '@/types'

export function SellerPage() {
  const user = useAuthStore((state) => state.user)
  const products = useCatalogStore((state) => state.products)
  const addProduct = useCatalogStore((state) => state.addProduct)
  const updateProduct = useCatalogStore((state) => state.updateProduct)
  const purchases = useAccountStore((state) => state.purchases)
  const [notice, setNotice] = useState('')
  const [formKey, setFormKey] = useState(0)

  if (!user) {
    return (
      <Gate
        title="Кабинет дизайнера"
        text="Войдите как продавец, чтобы выкладывать шаблоны. Демо: seller@duwmejik.ru, пароль demo."
        action={
          <Link to="/login" state={{ from: '/seller' }} className={buttonClass()}>
            Войти
          </Link>
        }
      />
    )
  }

  if (user.role === 'buyer') {
    return (
      <Gate
        title="Нужна роль дизайнера"
        text="Покупательский аккаунт видит заказы, но не загружает макеты. Откройте демо seller@duwmejik.ru."
        action={
          <Link to="/login" state={{ from: '/seller' }} className={buttonClass()}>
            Сменить аккаунт
          </Link>
        }
      />
    )
  }

  const mine = products.filter((item) => item.authorId === user.id)
  const sales = purchases.filter((item) => mine.some((product) => product.id === item.productId))
  const revenue = sales.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">Кабинет дизайнера</h1>
      <p className="mt-2 text-muted">Новый шаблон уходит на модерацию. Цену и лицензию можно менять сразу.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Макеты" value={String(mine.length)} />
        <Stat label="Продажи" value={String(sales.length)} />
        <Stat label="Выручка" value={formatPrice(revenue)} />
      </div>

      <Card className="mt-8 p-5">
        <h2 className="text-xl font-semibold">Новый шаблон</h2>
        <div className="mt-4">
          <ProductForm
            key={formKey}
            submitLabel="Отправить на модерацию"
            onSubmit={(draft) => {
              addProduct(draft, { author: user.name, authorId: user.id, status: 'pending' })
              setNotice(`«${draft.title}» отправлен на проверку`)
              setFormKey((current) => current + 1)
            }}
          />
        </div>
        {notice && <p className="mt-3 text-sm text-emerald-700">{notice}</p>}
      </Card>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-2 font-medium">Макет</th>
              <th className="py-2 font-medium">Статус</th>
              <th className="py-2 font-medium">Цена</th>
              <th className="py-2 font-medium">Лицензия</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((product) => (
              <tr key={product.id} className="border-t border-line">
                <td className="py-3 font-medium">{product.title}</td>
                <td>
                  <Badge tone={product.status === 'published' ? 'ok' : product.status === 'pending' ? 'pending' : 'bad'}>
                    {PRODUCT_STATUS_LABEL[product.status]}
                  </Badge>
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    defaultValue={product.price}
                    aria-label={`Цена ${product.title}`}
                    className="h-9 w-28 rounded-lg border border-line bg-card px-2"
                    onBlur={(event) => updateProduct(product.id, { price: Math.max(0, Number(event.target.value) || 0) })}
                  />
                </td>
                <td>
                  <Select
                    value={product.license}
                    aria-label={`Лицензия ${product.title}`}
                    onChange={(event) => updateProduct(product.id, { license: event.target.value as LicenseId })}
                  >
                    {LICENSES.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mine.length === 0 && <p className="mt-4 text-sm text-muted">У вас пока нет макетов.</p>}
      </div>
      <p className="mt-4 text-xs text-muted">Подпись лицензии в каталоге: {LICENSE_LABEL.personal}, {LICENSE_LABEL.commercial}, {LICENSE_LABEL.extended}.</p>
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
