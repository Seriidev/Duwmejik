import { HiOutlineSquares2X2 } from 'react-icons/hi2'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CategoryPill } from '@/components/CategoryPill'
import { ProductCard } from '@/components/ProductCard'
import { Reveal } from '@/components/Reveal'
import { SearchBox } from '@/components/SearchBox'
import { filterProducts, type ProductQuery } from '@/features/catalog/filterProducts'
import { PreviewModal } from '@/features/catalog/PreviewModal'
import { plural } from '@/lib/format'
import { useCatalogStore } from '@/store/useCatalogStore'

function readPrice(value: string | null): ProductQuery['price'] {
  return value === 'free' || value === 'paid' ? value : ''
}

export function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const products = useCatalogStore((state) => state.products)
  const categories = useCatalogStore((state) => state.categories)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const query: ProductQuery = {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    file: params.get('file') ?? '',
    color: params.get('color') ?? '',
    style: params.get('style') ?? '',
    orientation: params.get('orientation') ?? '',
    price: readPrice(params.get('price')),
  }

  function setFilter(key: keyof ProductQuery, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  const visible = filterProducts(products, query, categories)
  const preview = products.find((item) => item.id === previewId) ?? null

  return (
    <div>
      <div>
        <Reveal>
        <div className="mx-auto max-w-3xl px-4 py-10 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Каталог шаблонов</h1>
          <p className="mx-auto mt-2 max-w-2xl text-muted">Выберите категорию или найдите макет по словам.</p>
          <div className="mt-6 text-left">
            <SearchBox value={query.q} onSubmit={(value) => setFilter('q', value)} large showFilters />
          </div>
        </div>
        </Reveal>
        <div className="mx-auto mt-5 max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Reveal>
            <button
              type="button"
              onClick={() => setFilter('category', '')}
              className={`flex min-h-[72px] items-center gap-3 rounded-2xl bg-white px-3.5 py-3 text-left shadow-[0_8px_24px_rgba(55,70,120,0.06)] transition hover:shadow-[0_12px_28px_rgba(55,70,120,0.1)] ${query.category ? 'ring-1 ring-white' : 'ring-2 ring-blue-600'}`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
                <HiOutlineSquares2X2 className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium leading-tight text-slate-800">Все</span>
            </button>
            </Reveal>
            {categories.map((category, index) => (
              <Reveal key={category.id} delay={(index % 5) * 60}>
                <CategoryPill category={category} active={query.category === category.id} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div>
          <p className="mb-4 text-sm text-muted">
            {visible.length} {plural(visible.length, 'макет', 'макета', 'макетов')}
          </p>
          {visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line px-6 py-16 text-center">
              <p className="text-lg font-semibold">Ничего не нашлось</p>
              <p className="mt-2 text-sm text-muted">Снимите часть фильтров или поищите другое слово.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visible.map((product, index) => (
                <Reveal key={product.id} delay={(index % 4) * 70} className="h-full">
                  <ProductCard product={product} onPreview={setPreviewId} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>
      <PreviewModal product={preview} onClose={() => setPreviewId(null)} />
    </div>
  )
}
