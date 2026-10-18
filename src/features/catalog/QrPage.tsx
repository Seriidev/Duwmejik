'use client'

import { useSearchParams } from 'next/navigation'
import { QrCard } from '@/features/catalog/QrCard'
import { decodeQrDoc } from '@/lib/qrDoc'

export function QrPage() {
  const code = useSearchParams().get('d') ?? ''
  const doc = decodeQrDoc(code)
  return (
    <div className="min-h-svh bg-[#eef3f8] px-4 py-8">
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[28px] shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
        {doc ? <QrCard doc={doc} /> : <div className="bg-white px-6 py-16 text-center text-sm text-slate-500">This QR link is empty or damaged.</div>}
      </div>
    </div>
  )
}
