import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { categorySeed, DEFAULT_UNIT_PRICE, productSeed } from '@/data/catalog'
import { createId } from '@/lib/format'
import type { Category, Product, ProductDraft, ProductStatus } from '@/types'

interface CatalogState {
  categories: Category[]
  products: Product[]
  addProduct: (draft: ProductDraft, meta: Pick<Product, 'author' | 'authorId' | 'status'>) => Product
  updateProduct: (id: string, patch: Partial<Product>) => void
  removeProduct: (id: string) => void
  removeByAuthor: (authorId: string) => void
  setStatus: (id: string, status: ProductStatus) => void
  addCategory: (title: string, color: string, unitPrice: number) => void
  renameCategory: (id: string, title: string) => void
  setCategoryPrice: (id: string, unitPrice: number) => void
  removeCategory: (id: string) => boolean
}

function withPrice(category: Partial<Category> & Pick<Category, 'id'>): Category {
  const seed = categorySeed.find((item) => item.id === category.id)
  return {
    title: '',
    color: '#dbeafe',
    blurb: '',
    ...category,
    unitPrice: typeof category.unitPrice === 'number' ? category.unitPrice : seed?.unitPrice ?? DEFAULT_UNIT_PRICE,
  } as Category
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      categories: categorySeed,
      products: productSeed,
      addProduct: (draft, meta) => {
        const category = get().categories.find((item) => item.id === draft.categoryId)
        const product: Product = {
          ...draft,
          id: createId('tpl'),
          author: meta.author,
          authorId: meta.authorId,
          status: meta.status,
          downloads: 0,
          rating: 5,
          accent: category?.color ?? '#c4b5fd',
          seed: Math.floor(Math.random() * 24) + 1,
        }
        set({ products: [product, ...get().products] })
        return product
      },
      updateProduct: (id, patch) =>
        set({
          products: get().products.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        }),
      removeProduct: (id) => set({ products: get().products.filter((item) => item.id !== id) }),
      removeByAuthor: (authorId) => set({ products: get().products.filter((item) => item.authorId !== authorId) }),
      setStatus: (id, status) =>
        set({
          products: get().products.map((item) => (item.id === id ? { ...item, status } : item)),
        }),
      addCategory: (title, color, unitPrice) =>
        set({
          categories: [
            ...get().categories,
            { id: createId('cat'), title: title.trim(), color, blurb: 'Новая категория каталога', unitPrice },
          ],
        }),
      renameCategory: (id, title) =>
        set({
          categories: get().categories.map((item) =>
            item.id === id ? { ...item, title: title.trim() } : item,
          ),
        }),
      setCategoryPrice: (id, unitPrice) =>
        set({
          categories: get().categories.map((item) => (item.id === id ? { ...item, unitPrice } : item)),
        }),
      removeCategory: (id) => {
        if (get().products.some((item) => item.categoryId === id)) return false
        set({ categories: get().categories.filter((item) => item.id !== id) })
        return true
      },
    }),
    {
      name: 'duwmejik-catalog',
      version: 2,
      migrate: (persisted) => {
        const saved = (persisted ?? {}) as Partial<CatalogState>
        return { ...saved, categories: (saved.categories ?? categorySeed).map(withPrice) } as CatalogState
      },
    },
  ),
)
