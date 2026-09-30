import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { createId, formatPrice } from '@/lib/format'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import type { Purchase } from '@/types'

export function CheckoutPage() {
  const user = useAuthStore((state) => state.user)
  const ids = useCartStore((state) => state.items)
  const clear = useCartStore((state) => state.clear)
  const products = useCatalogStore((state) => state.products)
  const updateProduct = useCatalogStore((state) => state.updateProduct)
  const addPurchases = useAccountStore((state) => state.addPurchases)
  const items = ids.map((id) => products.find((product) => product.id === id)).filter((item) => item != null)
  const total = items.reduce((sum, item) => sum + item.price, 0)
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [card, setCard] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<Purchase[] | null>(null)

  if (!user) return <Navigate to="/login" state={{ from: '/checkout' }} replace />

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CircleCheck className="mx-auto size-12 text-emerald-600" />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Оплата прошла</h1>
        <p className="mt-3 text-muted">
          Это учебный чекаут: деньги не списывались. Файлы лежат в кабинете, номер заказа {done[0]?.id}.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/account" className={buttonClass()}>
            К покупкам
          </Link>
          <Link to="/catalog" className={buttonClass('secondary')}>
            В каталог
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold">Корзина пуста</h1>
        <Link to="/catalog" className={buttonClass('primary', 'md', 'mt-6')}>
          Выбрать макет
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_18rem]">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Оформление</h1>
        <p className="mt-2 text-muted">Данные карты никуда не отправляются и не сохраняются.</p>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
              setError('Укажите имя и почту')
              return
            }
            if (total > 0) {
              const digits = card.replace(/\s/g, '')
              if (!/^\d{16}$/.test(digits) || !/^\d{2}\/\d{2}$/.test(expiry) || !/^\d{3}$/.test(cvc)) {
                setError('Карта: 16 цифр, срок ММ/ГГ и трёхзначный код')
                return
              }
            }
            const purchasedAt = new Date().toISOString()
            const purchases: Purchase[] = items.map((item) => ({
              id: createId('p'),
              userId: user.id,
              productId: item.id,
              title: item.title,
              price: item.price,
              purchasedAt,
            }))
            items.forEach((item) => updateProduct(item.id, { downloads: item.downloads + 1 }))
            addPurchases(purchases)
            clear()
            setCard('')
            setCvc('')
            setDone(purchases)
          }}
        >
          <Input label="Имя" value={name} onChange={(event) => setName(event.target.value)} />
          <Input label="Почта" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          {total > 0 && (
            <>
              <Input
                label="Номер карты"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                value={card}
                onChange={(event) => setCard(event.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Срок"
                  autoComplete="cc-exp"
                  placeholder="ММ/ГГ"
                  value={expiry}
                  onChange={(event) => setExpiry(event.target.value)}
                />
                <Input
                  label="Код"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  value={cvc}
                  onChange={(event) => setCvc(event.target.value)}
                />
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          )}
          <Button type="submit" size="lg">
            {total === 0 ? 'Получить бесплатно' : `Оплатить ${formatPrice(total)}`}
          </Button>
        </form>
      </div>
      <Card className="h-fit p-5">
        <p className="font-semibold">Состав</p>
        <ul className="mt-3 grid gap-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>{item.title}</span>
              <span className="shrink-0">{formatPrice(item.price)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between border-t border-line pt-4 font-semibold">
          <span>Итого</span>
          <span>{formatPrice(total)}</span>
        </p>
      </Card>
    </div>
  )
}
