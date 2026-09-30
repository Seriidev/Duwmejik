import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { categorySeed, productSeed } from '@/data/catalog'
import { createId } from '@/lib/format'
import type { Category, Product, ProductDraft, ProductStatus } from '@/types'

interface CatalogState {
  categories: Category[]
  products: Product[]
  addProduct: (draft: ProductDraft, meta: Pick<Product, 'author' | 'authorId' | 'status'>) => Product
  updateProduct: (id: string, patch: Partial<Product>) => void
  removeProduct: (id: string) => void
  setStatus: (id: string, status: ProductStatus) => void
  addCategory: (title: string, color: string) => void
  renameCategory: (id: string, title: string) => void
  removeCategory: (id: string) => boolean
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
      setStatus: (id, status) =>
        set({
          products: get().products.map((item) => (item.id === id ? { ...item, status } : item)),
        }),
      addCategory: (title, color) =>
        set({
          categories: [
            ...get().categories,
            { id: createId('cat'), title: title.trim(), color, blurb: 'Новая категория каталога' },
          ],
        }),
      renameCategory: (id, title) =>
        set({
          categories: get().categories.map((item) =>
            item.id === id ? { ...item, title: title.trim() } : item,
          ),
        }),
      removeCategory: (id) => {
        if (get().products.some((item) => item.categoryId === id)) return false
        set({ categories: get().categories.filter((item) => item.id !== id) })
        return true
      },
    }),
    { name: 'duwmejik-catalog', version: 1 },
  ),
)
