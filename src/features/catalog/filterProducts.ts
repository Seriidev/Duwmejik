import { isFileType, isOrientation, isStyle } from '@/data/labels'
import type { Product } from '@/types'

export interface ProductQuery {
  q: string
  category: string
  file: string
  color: string
  style: string
  orientation: string
  price: '' | 'free' | 'paid'
}

export function filterProducts(
  products: Product[],
  query: ProductQuery,
  categories: { id: string; title: string }[] = [],
) {
  const text = query.q.trim().toLowerCase()
  return products
    .filter((product) => product.status === 'published')
    .filter((product) => {
      if (query.category && product.categoryId !== query.category) return false
      if (query.file && isFileType(query.file) && !product.fileTypes.includes(query.file)) return false
      if (query.color && !product.colors.includes(query.color)) return false
      if (query.style && isStyle(query.style) && product.style !== query.style) return false
      if (query.orientation && isOrientation(query.orientation) && product.orientation !== query.orientation) {
        return false
      }
      if (query.price === 'free' && product.price !== 0) return false
      if (query.price === 'paid' && product.price === 0) return false
      if (!text) return true
      const category = categories.find((item) => item.id === product.categoryId)?.title ?? ''
      const haystack = `${product.title} ${product.description} ${product.author} ${product.tags.join(' ')} ${category}`.toLowerCase()
      return haystack.includes(text)
    })
    .sort((a, b) => b.downloads - a.downloads)
}
