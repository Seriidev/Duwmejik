'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { cn } from '@/lib/cn'
import { formatDate, formatPrice } from '@/lib/format'
import { formatPickupCode } from '@/store/useAccountStore'
import type { CustomOrder } from '@/types'

export const PREPAY_SHARE = 0.5

export function prepaySplit(price: number) {
  const prepay = Math.round(price * PREPAY_SHARE * 100) / 100
  return { prepay, rest: Math.round((price - prepay) * 100) / 100 }
}

export function pickupUrl(code: string) {
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  return `${origin}/admin?pickup=${code}`
}

export function PickupPass({ order, className }: { order: CustomOrder; className?: string }) {
  const [src, setSrc] = useState('')
  const url = pickupUrl(order.pickupCode)
  const { prepay, rest } = prepaySplit(order.price)

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(url, { margin: 1, width: 220, color: { dark: '#0f172a', light: '#ffffff' } }).then((next) => {
      if (alive) setSrc(next)
    })
    return () => {
      alive = false
    }
  }, [url])

  if (order.status === 'cancelled') return null

  const note =
    order.status === 'issued'
      ? `Заказ выдан${order.issuedAt ? ` ${formatDate(order.issuedAt)}` : ''}, код больше не действует.`
      : order.status === 'ready'
        ? 'Заказ готов. Покажите код или QR в офисе, и вам выдадут заказ.'
        : 'Код сработает, когда заказ будет готов к выдаче. Мы сообщим об этом.'

  return (
    <div className={cn('flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center', className)}>
      {src ? (
        <img src={src} alt="QR-код для получения заказа" className={cn('size-36 shrink-0 rounded-xl', order.status === 'issued' && 'opacity-30')} />
      ) : (
        <div className="size-36 shrink-0 rounded-xl bg-slate-100" />
      )}
      <div className="min-w-0 text-center sm:text-left">
        <p className="text-xs text-slate-400">Код получения</p>
        <p className={cn('mt-0.5 text-3xl font-semibold tracking-[0.12em] text-slate-950', order.status === 'issued' && 'text-slate-400 line-through')}>
          {formatPickupCode(order.pickupCode)}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p>
        {order.status !== 'issued' && (
          <p className="mt-1 text-xs text-slate-400">
            Предоплата 50% — {formatPrice(prepay)}, при получении — {formatPrice(rest)}
          </p>
        )}
      </div>
    </div>
  )
}
