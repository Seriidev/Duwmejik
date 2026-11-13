'use client'

import { Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ORDER_STATUS_LABEL } from '@/data/labels'
import { formatPrice, plural } from '@/lib/format'
import { cn } from '@/lib/cn'
import { normalizePickupCode, useAccountStore } from '@/store/useAccountStore'
import type { CustomOrder, OrderStatus } from '@/types'

const CHECKS = ['Код клиента подтверждён', 'Заказ полностью оплачен', 'Комплектность проверена']

export function PickupDesk({ initialCode }: { initialCode: string }) {
  const orders = useAccountStore((state) => state.orders)
  const setOrderStatus = useAccountStore((state) => state.setOrderStatus)
  const [draft, setDraft] = useState(spaced(initialCode))
  const [code, setCode] = useState(normalizePickupCode(initialCode))
  const [issuedNow, setIssuedNow] = useState('')
  const order = code ? orders.find((item) => item.pickupCode === code) : undefined
  const today = new Date()
  const issuedToday = orders
    .filter((item) => item.status === 'issued' && item.issuedAt && sameDay(item.issuedAt, today))
    .sort((left, right) => (right.issuedAt ?? '').localeCompare(left.issuedAt ?? ''))
  const todayTitle = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(today).replace(' г.', '')

  function search(event: FormEvent) {
    event.preventDefault()
    setCode(normalizePickupCode(draft))
    setIssuedNow('')
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Выдача заказов</h1>
        <p className="pb-1 text-sm text-neutral-400">{todayTitle}</p>
      </div>

      <form onSubmit={search} className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="text-sm text-neutral-500">Код получения</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            inputMode="numeric"
            autoComplete="off"
            aria-label="Код получения"
            placeholder="0 0 0 0 0 0"
            value={draft}
            onChange={(event) => setDraft(spaced(event.target.value))}
            className="h-14 min-w-0 flex-1 rounded-xl bg-neutral-100 px-5 text-2xl font-semibold tracking-[0.35em] text-neutral-900 outline-none placeholder:text-neutral-300"
          />
          <button type="submit" className="h-14 shrink-0 rounded-xl bg-brand px-6 text-sm font-semibold text-white hover:brightness-110">
            Найти заказ
          </button>
        </div>
      </form>

      {code && !order && <p className="mt-4 text-sm text-rose-600">Заказ с кодом {spaced(code)} не найден. Проверьте цифры.</p>}

      {order && (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
          <article className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight">Заказ #{order.id}</h2>
              <span className={cn('inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', pill(order.status))}>
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              {shortName(order.customerName)}
              {order.phone ? ` · ${order.phone}` : ''}
            </p>
            <h3 className="mt-6 text-lg font-semibold">{order.subtype}</h3>
            <p className="mt-1 text-sm text-neutral-500">{specLine(order)}</p>
            {order.brief?.paper && <p className="mt-1 text-sm text-neutral-500">{order.brief.paper}</p>}
            <div className={cn('mt-5 flex items-center justify-between gap-3 rounded-xl px-4 py-3.5', order.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}>
              <p className="text-sm font-medium">{order.status === 'cancelled' ? 'Заказ отменён' : 'Оплачено полностью'}</p>
              <p className="text-xl font-semibold tracking-tight">{formatPrice(order.price)}</p>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="text-neutral-400">Создан</dt>
                <dd className="mt-1 font-medium">{stamp(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Готов</dt>
                <dd className="mt-1 font-medium">{stamp(dueDate(order))}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">Получение</dt>
                <dd className="mt-1 font-medium">Самовывоз</dd>
              </div>
            </dl>
          </article>

          <aside className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Перед выдачей</h2>
            <ul className="mt-4 grid gap-2.5">
              {CHECKS.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-neutral-700">
                  <Check className="size-4 text-emerald-500" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-5 text-neutral-500">Попросите клиента назвать код из SMS или личного кабинета.</p>
            <p className="mt-3 text-sm leading-5 text-neutral-500">После подтверждения заказ получит статус «Выдан».</p>
            {order.status === 'ready' ? (
              <button
                type="button"
                onClick={() => {
                  setOrderStatus(order.id, 'issued')
                  setIssuedNow(order.id)
                }}
                className="mt-5 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white hover:brightness-110"
              >
                Подтвердить выдачу
              </button>
            ) : (
              <p className={cn('mt-5 text-sm', order.status === 'cancelled' ? 'text-rose-600' : issuedNow === order.id ? 'font-semibold text-emerald-700' : 'text-neutral-500')}>
                {order.status === 'issued'
                  ? issuedNow === order.id
                    ? 'Готово: заказ выдан, код больше не действует.'
                    : `Заказ уже выдан${order.issuedAt ? ` ${stamp(order.issuedAt)}` : ''}.`
                  : order.status === 'cancelled'
                    ? 'Заказ отменён, выдавать нечего.'
                    : `Заказ ещё не готов, статус «${ORDER_STATUS_LABEL[order.status]}».`}
              </p>
            )}
          </aside>
        </div>
      )}

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4">
        <h2 className="text-base font-semibold">
          Сегодня выдано · {issuedToday.length} {plural(issuedToday.length, 'заказ', 'заказа', 'заказов')}
        </h2>
        {issuedToday.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400">Сегодня ещё ничего не выдавали.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100">
            {issuedToday.map((item) => (
              <li key={item.id} className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto_auto] items-center gap-3 py-3 text-sm">
                <span className="font-semibold text-[#5b4dff]">#{item.id}</span>
                <span className="text-neutral-700">{shortName(item.customerName)}</span>
                <span className="text-neutral-500">
                  {item.subtype} · {item.quantity} шт.
                </span>
                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  Выдан
                </span>
                <span className="tabular-nums text-neutral-400">{item.issuedAt ? clock(item.issuedAt) : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function spaced(value: string) {
  return normalizePickupCode(value).split('').join(' ')
}

function specLine(order: CustomOrder) {
  const parts = [`${order.quantity} шт.`]
  if (order.brief?.format) parts.push(order.brief.format)
  if (order.brief?.sides) parts.push(order.brief.sides.toLowerCase())
  return parts.join(' · ')
}

function dueDate(order: CustomOrder) {
  const due = new Date(order.createdAt)
  due.setDate(due.getDate() + order.days)
  return due
}

function stamp(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  const day = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date).replace('.', '')
  return `${day}, ${clock(date)}`
}

function clock(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function sameDay(iso: string, day: Date) {
  const date = new Date(iso)
  return date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate()
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return name
  return `${parts[0]} ${parts[1][0]}.`
}

function pill(status: OrderStatus) {
  if (status === 'ready' || status === 'issued') return 'bg-emerald-50 text-emerald-600'
  if (status === 'cancelled') return 'bg-rose-50 text-rose-600'
  if (status === 'accepted' || status === 'in_progress') return 'bg-amber-50 text-amber-600'
  return 'bg-neutral-100 text-neutral-500'
}
