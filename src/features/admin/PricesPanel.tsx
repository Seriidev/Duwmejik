'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { SERVICE_ORDER, SERVICES } from '@/features/orders/pricing'
import { useCatalogStore } from '@/store/useCatalogStore'
import { usePriceStore } from '@/store/usePriceStore'

function readPrice(value: string) {
  const price = Number(value.replace(',', '.'))
  return Number.isFinite(price) && price > 0 ? Math.round(price * 100) / 100 : null
}

export function PricesPanel() {
  const categories = useCatalogStore((state) => state.categories)
  const products = useCatalogStore((state) => state.products)
  const addCategory = useCatalogStore((state) => state.addCategory)
  const renameCategory = useCatalogStore((state) => state.renameCategory)
  const setCategoryPrice = useCatalogStore((state) => state.setCategoryPrice)
  const removeCategory = useCatalogStore((state) => state.removeCategory)
  const serviceBase = usePriceStore((state) => state.serviceBase)
  const setServiceBase = usePriceStore((state) => state.setServiceBase)
  const [title, setTitle] = useState('')
  const [color, setColor] = useState('#dbeafe')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  return (
    <div className="mt-6 grid gap-8">
      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Категории и цена печати</h2>
          <p className="mt-1 text-sm text-muted">
            Цена за штуку используется в карточке шаблона и в форме заказа. Админ, принимая шаблон, выбирает категорию только из этого списка.
          </p>
        </div>
        <Card className="grid gap-3 p-4 sm:grid-cols-[1fr_8rem_6rem_auto] sm:items-end">
          <Input label="Новая категория" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Input label="TMT за шт." inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} />
          <Input label="Цвет" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          <Button
            onClick={() => {
              const unitPrice = readPrice(price)
              if (!title.trim()) return setError('Введите название')
              if (unitPrice === null) return setError('Укажите цену за штуку больше нуля')
              addCategory(title, color, unitPrice)
              setTitle('')
              setPrice('')
              setError('')
            }}
          >
            Добавить
          </Button>
        </Card>
        {error && <p className="text-sm text-rose-600">{error}</p>}
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
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  key={category.unitPrice}
                  defaultValue={String(category.unitPrice)}
                  inputMode="decimal"
                  aria-label={`Цена ${category.title}`}
                  className="h-10 w-24 rounded-xl border border-line bg-card px-3 text-ink"
                  onBlur={(event) => {
                    const next = readPrice(event.target.value)
                    if (next === null) {
                      event.target.value = String(category.unitPrice)
                      setError(`Цена для «${category.title}» должна быть больше нуля`)
                      return
                    }
                    setError('')
                    setCategoryPrice(category.id, next)
                  }}
                />
                TMT за шт.
              </label>
              <Button
                size="sm"
                variant="danger"
                disabled={used}
                onClick={() => {
                  if (!removeCategory(category.id)) setError('В категории ещё есть шаблоны')
                }}
              >
                {used ? 'Есть шаблоны' : 'Удалить'}
              </Button>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-semibold">Услуги без категории</h2>
          <p className="mt-1 text-sm text-muted">
            Базовая цена для заказов, у которых нет категории печати: логотип и айдентика, гравировка, дизайн для соцсетей.
          </p>
        </div>
        {SERVICE_ORDER.map((id) => (
          <Card key={id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{SERVICES[id].title}</p>
              <p className="text-sm text-muted">{SERVICES[id].subtypes.join(', ')}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                key={serviceBase[id]}
                defaultValue={String(serviceBase[id])}
                inputMode="decimal"
                aria-label={`Базовая цена ${SERVICES[id].title}`}
                className="h-10 w-28 rounded-xl border border-line bg-card px-3 text-ink"
                onBlur={(event) => {
                  const next = readPrice(event.target.value)
                  if (next === null) {
                    event.target.value = String(serviceBase[id])
                    return
                  }
                  setServiceBase(id, next)
                }}
              />
              TMT
            </label>
          </Card>
        ))}
      </section>
    </div>
  )
}
