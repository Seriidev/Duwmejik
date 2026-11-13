'use client'

import { useMemo, useState } from 'react'
import { ORDER_STATUS_LABEL } from '@/data/labels'
import { cn } from '@/lib/cn'
import { buildBooks, type BooksRange } from '@/lib/superadmin/accounting'
import { formatTmt } from '@/lib/superadmin/money'
import { deltaLabel } from '@/lib/superadmin/reports'
import { useAccountStore } from '@/store/useAccountStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import type { OrderStatus } from '@/types'

const ranges: { id: BooksRange; label: string }[] = [
  { id: 'day', label: 'День' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
]

const summaryLabel: Record<string, string> = {
  week: 'Неделя',
  month: 'Месяц',
  quarter: 'Квартал',
  year: 'Год',
}

const statusColor: Record<OrderStatus, string> = {
  new: '#5967d8',
  accepted: '#6d3ef2',
  in_progress: '#00c4cc',
  ready: '#b76e00',
  issued: '#12a150',
  cancelled: '#d92d3a',
}

type DiscountFilter = 'all' | 'with' | 'without'

const PAGE = 8

export function AccountingScreen() {
  const orders = useAccountStore((state) => state.orders)
  const purchases = useAccountStore((state) => state.purchases)
  const products = useCatalogStore((state) => state.products)
  const [range, setRange] = useState<BooksRange>('year')
  const [discount, setDiscount] = useState<DiscountFilter>('all')
  const [page, setPage] = useState(0)
  const books = useMemo(() => buildBooks({ orders, purchases, range }), [orders, purchases, range])
  const authorOf = (productId?: string) => products.find((item) => item.id === productId)?.author
  const filtered = books.rows.filter(() => (discount === 'with' ? false : true))
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const safePage = Math.min(page, pages - 1)
  const visible = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE)
  const peak = Math.max(1, ...books.series.map((item) => item.orders + item.templates))
  const revenueDelta = deltaLabel(books.revenue, books.previousRevenue)
  const ordersDelta = deltaLabel(books.orders, books.previousOrders)

  function exportCsv() {
    const lines = [['Номер', 'Дата', 'Клиент', 'Изделие', 'Исполнитель', 'Сумма TMT', 'Статус']]
    for (const order of filtered) {
      lines.push([
        order.id,
        new Date(order.createdAt).toLocaleString('ru-RU'),
        order.customerName,
        order.subtype,
        authorOf(order.productId) ?? '',
        String(order.price).replace('.', ','),
        ORDER_STATUS_LABEL[order.status as OrderStatus] ?? order.status,
      ])
    }
    const blob = new Blob([`\uFEFF${lines.map((row) => row.map(csv).join(';')).join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'zakazy.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Заказы и бухгалтерия</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#5b6472]">
            {formatSpan(books.span.start, books.span.end)}. Выручка — сумма заказа и продаж шаблонов. Скидка и себестоимость в заказе не записываются, поэтому прибыль здесь не считается.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-[#e4e7ec] bg-white p-1">
            {ranges.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setRange(item.id)
                  setPage(0)
                }}
                className={cn('h-9 rounded-lg px-3 text-sm font-medium', range === item.id ? 'bg-[#6d3ef2] text-white' : 'text-[#5b6472]')}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={exportCsv} className="h-10 rounded-[10px] border border-[#e4e7ec] bg-white px-4 text-sm font-semibold text-[#0e1116]">
            Экспорт
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="Выручка" value={formatTmt(books.revenue)} delta={revenueDelta.text} tone={revenueDelta.tone} />
        <Kpi label="Заказы" value={String(books.orders)} delta={ordersDelta.text} tone={ordersDelta.tone} />
        <Kpi label="Выдано скидок" value="—" delta="скидка в заказе не записывается" tone="flat" />
        <Kpi label="Чистая прибыль" value="—" delta="себестоимость в заказе не записывается" tone="flat" />
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] gap-4">
        <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{range === 'year' ? 'Выручка по месяцам' : 'Выручка по дням'}</h2>
            <div className="flex gap-3 text-xs text-[#5b6472]">
              <Legend color="#6d3ef2" label="Заказы" />
              <Legend color="#00c4cc" label="Шаблоны" />
            </div>
          </div>
          <div className="mt-6 flex h-48 items-end gap-1">
            {books.series.map((item, index) => (
              <div key={`${item.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2" title={`${item.label}: ${formatTmt(item.orders + item.templates)}`}>
                <div className="flex h-36 w-full max-w-8 items-end">
                  <div className="flex h-full w-full flex-col justify-end overflow-hidden rounded-t-md bg-[#f6f7f9]">
                    <div style={{ height: `${(item.templates / peak) * 100}%`, background: '#00c4cc' }} />
                    <div style={{ height: `${(item.orders / peak) * 100}%`, background: '#6d3ef2' }} />
                  </div>
                </div>
                {books.series.length <= 16 && <span className="truncate text-[10px] text-[#8a93a1]">{item.label}</span>}
              </div>
            ))}
          </div>
          {books.revenue === 0 && <p className="mt-3 text-sm text-[#8a93a1]">За этот период выручки нет.</p>}
        </section>

        <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
          <h2 className="text-base font-semibold">Сводка по периодам</h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-xs text-[#8a93a1]">
              <tr>
                <th className="py-2 font-medium">Период</th>
                <th className="py-2 font-medium">Заказов</th>
                <th className="py-2 text-right font-medium">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {books.summary.map((item) => (
                <tr key={item.range} className="border-t border-[#e4e7ec]">
                  <td className="py-2.5">{summaryLabel[item.range]}</td>
                  <td className="py-2.5">{item.orders}</td>
                  <td className="py-2.5 text-right font-medium">{formatTmt(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-[#e4e7ec] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Заказы</h2>
          <div className="flex rounded-xl bg-[#f6f7f9] p-1">
            {(
              [
                ['all', 'Все'],
                ['with', 'Со скидкой'],
                ['without', 'Без скидки'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setDiscount(id)
                  setPage(0)
                }}
                className={cn('h-8 rounded-lg px-3 text-xs font-semibold', discount === id ? 'bg-white text-[#4f26c9]' : 'text-[#5b6472]')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {discount === 'with' && <p className="mt-3 text-sm text-[#8a93a1]">Скидка в заказе не записывается, таких строк нет.</p>}
        {visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#8a93a1]">{discount === 'with' ? 'Заказов со скидкой нет.' : 'В этом периоде заказов нет.'}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="text-xs text-[#8a93a1]">
                <tr>
                  {['№', 'Дата', 'Клиент', 'Изделие', 'Исполнитель', 'Сумма', 'Скидка', 'Итого', 'Статус'].map((label) => (
                    <th key={label} className="px-2 py-2 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => (
                  <tr key={order.id} className="border-t border-[#e4e7ec]">
                    <td className="px-2 py-3 font-medium">{order.id}</td>
                    <td className="px-2 py-3 text-[#5b6472]">{stamp(order.createdAt)}</td>
                    <td className="px-2 py-3">{order.customerName}</td>
                    <td className="px-2 py-3">{order.subtype}</td>
                    <td className="px-2 py-3">{authorOf(order.productId) ?? '—'}</td>
                    <td className="px-2 py-3">{formatTmt(order.price)}</td>
                    <td className="px-2 py-3 text-[#8a93a1]">—</td>
                    <td className="px-2 py-3 font-medium">{formatTmt(order.price)}</td>
                    <td className="px-2 py-3">
                      <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: statusColor[order.status as OrderStatus], background: `${statusColor[order.status as OrderStatus]}1a` }}>
                        {ORDER_STATUS_LABEL[order.status as OrderStatus] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2 text-sm">
            <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="h-9 rounded-[10px] border border-[#e4e7ec] px-3 disabled:text-[#8a93a1]">
              Назад
            </button>
            <span className="text-[#5b6472]">
              {safePage + 1} / {pages}
            </span>
            <button type="button" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} className="h-9 rounded-[10px] border border-[#e4e7ec] px-3 disabled:text-[#8a93a1]">
              Дальше
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

function Kpi({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: 'up' | 'down' | 'flat' }) {
  return (
    <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
      <p className="text-sm text-[#5b6472]">{label}</p>
      <p className="mt-2 text-[26px] font-semibold tracking-tight">{value}</p>
      <p className={cn('mt-2 text-xs', tone === 'up' && 'text-[#12a150]', tone === 'down' && 'text-[#d92d3a]', tone === 'flat' && 'text-[#8a93a1]')}>{delta}</p>
    </section>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function formatSpan(start: Date, end: Date) {
  const format = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${format.format(start).replace('.', '')} — ${format.format(end).replace('.', '')}`
}

function stamp(iso: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(iso)).replace('.', '')
}

function csv(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}
