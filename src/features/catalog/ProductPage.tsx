import { Heart, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductCard } from '@/components/ProductCard'
import { TemplateArt } from '@/components/TemplateArt'
import { Badge, PriceBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { COLORS, LICENSES, ORIENTATION_LABEL, STYLE_LABEL } from '@/data/labels'
import { downloadTemplate } from '@/lib/download'
import { createId, formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCartStore } from '@/store/useCartStore'
import { useCatalogStore } from '@/store/useCatalogStore'

export function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = useCatalogStore((state) => state.products.find((item) => item.id === id))
  const category = useCatalogStore((state) => state.categories.find((item) => item.id === product?.categoryId))
  const related = useCatalogStore((state) =>
    state.products.filter((item) => item.status === 'published' && item.categoryId === product?.categoryId && item.id !== product?.id).slice(0, 3),
  )
  const user = useAuthStore((state) => state.user)
  const add = useCartStore((state) => state.add)
  const inCart = useCartStore((state) => (product ? state.items.includes(product.id) : false))
  const purchases = useAccountStore((state) => state.purchases)
  const addPurchases = useAccountStore((state) => state.addPurchases)
  const toggleFavorite = useAccountStore((state) => state.toggleFavorite)
  const favorites = useAccountStore((state) => (user ? state.favorites[user.id] : undefined))
  const [slide, setSlide] = useState(0)

  if (!product || product.status !== 'published') {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">Макет не найден</h1>
        <Link to="/catalog" className={cn('mt-6 inline-flex', 'text-violet-600')}>
          Вернуться в каталог
        </Link>
      </div>
    )
  }

  const license = LICENSES.find((item) => item.id === product.license)
  const owned = Boolean(user && purchases.some((item) => item.userId === user.id && item.productId === product.id))
  const liked = Boolean(favorites?.includes(product.id))

  function buy() {
    add(product!.id)
    navigate('/checkout')
  }

  function downloadFree() {
    if (!user) {
      navigate('/login', { state: { from: `/product/${product!.id}` } })
      return
    }
    if (!owned) {
      addPurchases([
        {
          id: createId('p'),
          userId: user.id,
          productId: product!.id,
          title: product!.title,
          price: 0,
          purchasedAt: new Date().toISOString(),
        },
      ])
    }
    downloadTemplate(product!.title)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link to="/catalog">Каталог</Link>
        {category && (
          <>
            {' / '}
            <Link to={`/catalog?category=${category.id}`}>{category.title}</Link>
          </>
        )}
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <TemplateArt
            categoryId={product.categoryId}
            accent={product.accent}
            seed={product.seed + slide}
            className="aspect-[4/3] rounded-3xl border border-line"
          />
          <div className="mt-3 flex gap-3">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                type="button"
                aria-label={`Превью ${index + 1}`}
                onClick={() => setSlide(index)}
                className={cn('w-24 overflow-hidden rounded-xl border', slide === index ? 'border-violet-600' : 'border-line')}
              >
                <TemplateArt categoryId={product.categoryId} accent={product.accent} seed={product.seed + index} className="aspect-[4/3]" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <PriceBadge price={product.price} />
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{product.title}</h1>
          <p className="mt-2 text-muted">
            {product.author} · {product.downloads} скачиваний
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            {product.rating.toFixed(1)}
          </p>
          <p className="mt-4 text-3xl font-semibold">{formatPrice(product.price)}</p>
          <p className="mt-4 leading-7">{product.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.fileTypes.map((file) => (
              <Badge key={file}>{file}</Badge>
            ))}
            <Badge>{STYLE_LABEL[product.style]}</Badge>
            <Badge>{ORIENTATION_LABEL[product.orientation]}</Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.colors.map((color) => {
              const swatch = COLORS.find((item) => item.id === color)
              return (
                <span key={color} className="inline-flex items-center gap-2 rounded-full bg-soft px-3 py-1 text-sm">
                  <span className="size-3 rounded-full border border-line" style={{ background: swatch?.hex }} />
                  {color}
                </span>
              )
            })}
          </div>
          <div className="mt-5 rounded-2xl bg-soft p-4 text-sm leading-6">
            <p className="font-semibold">Лицензия: {license?.label}</p>
            <p className="mt-1 text-muted">{license?.text}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {product.price === 0 ? (
              <Button onClick={downloadFree}>{owned ? 'Скачать снова' : 'Скачать бесплатно'}</Button>
            ) : (
              <Button onClick={buy}>Купить и скачать</Button>
            )}
            <Button variant="secondary" onClick={() => add(product.id)} disabled={inCart}>
              {inCart ? 'В корзине' : 'Добавить в корзину'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (!user) {
                  navigate('/login', { state: { from: `/product/${product.id}` } })
                  return
                }
                toggleFavorite(user.id, product.id)
              }}
            >
              <Heart className={cn('size-4', liked && 'fill-rose-500 text-rose-500')} />
              {liked ? 'В избранном' : 'В избранное'}
            </Button>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Похожие макеты</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
