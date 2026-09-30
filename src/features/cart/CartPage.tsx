import { Link } from 'react-router-dom'
import { TemplateArt } from '@/components/TemplateArt'
import { Button, buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatPrice } from '@/lib/format'
import { useCartStore } from '@/store/useCartStore'
import { useCatalogStore } from '@/store/useCatalogStore'

export function CartPage() {
  const ids = useCartStore((state) => state.items)
  const remove = useCartStore((state) => state.remove)
  const products = useCatalogStore((state) => state.products)
  const items = ids.map((id) => products.find((product) => product.id === id)).filter((item) => item != null)
  const total = items.reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-semibold tracking-tight">Корзина</h1>
      {items.length === 0 ? (
        <Card className="mt-8 px-6 py-16 text-center">
          <p className="text-lg font-semibold">Пока пусто</p>
          <p className="mt-2 text-muted">Добавьте макеты из каталога — можно несколько сразу.</p>
          <Link to="/catalog" className={buttonClass('primary', 'md', 'mt-6')}>
            В каталог
          </Link>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="grid gap-3">
            {items.map((item) => (
              <Card key={item.id} className="flex items-center gap-4 p-3">
                <TemplateArt categoryId={item.categoryId} accent={item.accent} seed={item.seed} className="size-20 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${item.id}`} className="font-semibold">
                    {item.title}
                  </Link>
                  <p className="text-sm text-muted">{item.fileTypes.join(', ')}</p>
                </div>
                <p className="font-semibold">{formatPrice(item.price)}</p>
                <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>
                  Убрать
                </Button>
              </Card>
            ))}
          </div>
          <Card className="h-fit p-5">
            <p className="text-sm text-muted">К оплате</p>
            <p className="mt-1 text-3xl font-semibold">{formatPrice(total)}</p>
            <p className="mt-2 text-sm text-muted">{items.length} поз.</p>
            <Link to="/checkout" className={buttonClass('primary', 'md', 'mt-5 w-full')}>
              {total === 0 ? 'Получить файлы' : 'Оформить'}
            </Link>
          </Card>
        </div>
      )}
    </div>
  )
}
