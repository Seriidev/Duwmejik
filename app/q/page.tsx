import { Suspense } from 'react'
import { QrPage } from '@/features/catalog/QrPage'

export default function Page() {
  return (
    <Suspense>
      <QrPage />
    </Suspense>
  )
}
