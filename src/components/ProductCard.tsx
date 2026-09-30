import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import cardPreview from '@/assets/card-preview.jpg'
import { cn } from '@/lib/cn'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import type { Product } from '@/types'

export function ProductCard({
  product,
  onPreview,
}: {
  product: Product
  onPreview?: (id: string) => void
}) {
  const navigate = useNavigate()
  const category = useCatalogStore((state) => state.categories.find((item) => item.id === product.categoryId))
  const user = useAuthStore((state) => state.user)
  const favorites = useAccountStore((state) => (user ? state.favorites[user.id] : undefined))
  const toggleFavorite = useAccountStore((state) => state.toggleFavorite)
  const liked = Boolean(favorites?.includes(product.id))

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => (onPreview ? onPreview(product.id) : navigate(`/product/${product.id}`))}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onPreview ? onPreview(product.id) : navigate(`/product/${product.id}`)
      }}
      className="flex h-full cursor-pointer flex-col rounded-[28px] bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(55,70,120,0.12)]"
    >
      <div className="relative">
        <button
          type="button"
          aria-label={liked ? 'Убрать из избранного' : 'В избранное'}
          onClick={(event) => {
            event.stopPropagation()
            if (!user) {
              navigate('/login')
              return
            }
            toggleFavorite(user.id, product.id)
          }}
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-xl bg-white text-slate-800 shadow-sm"
        >
          <Heart className={cn('size-4', liked && 'fill-rose-500 text-rose-500')} />
        </button>
        <img src={cardPreview} alt="" className="aspect-square w-full rounded-[22px] object-cover" />
      </div>
      <div className="px-2 py-3">
        <h3 className="line-clamp-1 text-base font-semibold leading-tight text-slate-950">{product.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{category?.title ?? product.author}</p>
      </div>
    </article>
  )
}
