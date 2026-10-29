'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { QrCard } from '@/features/catalog/QrCard'
import { decodeQrDoc, loadQrPage, withQrMedia, type QrDoc } from '@/lib/qrDoc'

export function QrPage() {
  const code = useSearchParams().get('d') ?? ''
  const [doc, setDoc] = useState<QrDoc | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = loadQrPage(code)
    const decoded = stored ?? decodeQrDoc(code)
    setDoc(stored ? stored : decoded ? withQrMedia(code, decoded) : null)
    setReady(true)
  }, [code])

  return (
    <div className="min-h-svh bg-[#eef3f8] px-4 py-8">
      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[28px] shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
        {doc ? <QrCard doc={doc} /> : <div className="bg-white px-6 py-16 text-center text-sm text-slate-500">{ready ? 'This QR link is empty or damaged.' : ''}</div>}
      </div>
    </div>
  )
}
