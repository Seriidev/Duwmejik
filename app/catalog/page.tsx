import { Suspense } from 'react'
import { CatalogPage } from '@/features/catalog/CatalogPage'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CatalogPage />
    </Suspense>
  )
}
