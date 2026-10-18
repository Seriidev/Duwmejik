import { Suspense } from 'react'
import { TemplatesBoard } from '@/features/catalog/TemplatesBoard'

export default function Page() {
  return (
    <Suspense>
      <TemplatesBoard />
    </Suspense>
  )
}
