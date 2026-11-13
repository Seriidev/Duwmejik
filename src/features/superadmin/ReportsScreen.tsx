'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { ORDER_STATUS_LABEL } from '@/data/labels'
import { formatTmt } from '@/lib/superadmin/money'
import { buildReport, deltaLabel, type ReportRange } from '@/lib/superadmin/reports'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { useFollowStore } from '@/store/useFollowStore'
import type { OrderStatus } from '@/types'

const ranges: { id: ReportRange; label: string }[] = [
  { id: '7', label: '7 дней' },
  { id: '30', label: '30 дней' },
  { id: '90', label: 'Квартал' },
]

const statusColor: Record<OrderStatus, string> = {
  new: '#5967d8',
  accepted: '#6d3ef2',
  in_progress: '#00c4cc',
  ready: '#b76e00',
  issued: '#12a150',
  cancelled: '#d92d3a',
}

export function ReportsScreen() {
  const orders = useAccountStore((state) => state.orders)
  const purchases = useAccountStore((state) => state.purchases)
  const products = useCatalogStore((state) => state.products)
  const users = useAuthStore((state) => state.users)
  const following = useFollowStore((state) => state.following)
  const [range, setRange] = useState<ReportRange>('90')
  const report = useMemo(
    () => buildReport({ orders, purchases, products, users, following, range }),
    [orders, purchases, products, users, following, range],
  )
  const peak = Math.max(1, ...report.series.map((item) => item.orders + item.templates))
  const statusMax = Math.max(1, ...report.statusCounts.map((item) => item.count))
  const revenueDelta = deltaLabel(report.revenue, report.previousRevenue)
  const ordersDelta = deltaLabel(report.orders, report.previousOrders)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Отчётность</h1>
          <p className="mt-1 text-sm text-[#5b6472]">
            {formatSpan(report.period.start, report.period.end)} · сравнение с предыдущими {report.period.days} днями
          </p>
        </div>
        <div className="flex rounded-xl border border-[#e4e7ec] bg-white p-1">
          {ranges.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={cn('h-9 rounded-lg px-3 text-sm font-medium', range === item.id ? 'bg-[#6d3ef2] text-white' : 'text-[#5b6472]')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Kpi label="Выручка" value={formatTmt(report.revenue)} delta={revenueDelta.text} tone={revenueDelta.tone} />
        <Kpi label="Заказы" value={String(report.orders)} delta={ordersDelta.text} tone={ordersDelta.tone} />
        <Kpi label="Подписки на дизайнеров" value={String(report.subscriptions)} delta="сейчас на платформе" tone="flat" />
        <Kpi label="Новые пользователи" value="0" delta="дата регистрации не хранится" tone="flat" />
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] gap-4">
        <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Выручка по дням</h2>
            <div className="flex gap-3 text-xs text-[#5b6472]">
              <Legend color="#6d3ef2" label="Заказы" />
              <Legend color="#00c4cc" label="Шаблоны" />
            </div>
          </div>
          <div className="mt-6 flex h-48 items-end gap-1">
            {report.series.map((item, index) => {
              const ordersHeight = (item.orders / peak) * 100
              const templatesHeight = (item.templates / peak) * 100
              return (
                <div key={`${item.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2" title={`${item.label}: заказы ${formatTmt(item.orders)}, шаблоны ${formatTmt(item.templates)}`}>
                  <div className="flex h-36 w-full max-w-8 items-end">
                    <div className="flex w-full flex-col justify-end overflow-hidden rounded-t-md bg-[#f6f7f9]" style={{ height: '100%' }}>
                      <div style={{ height: `${templatesHeight}%`, background: '#00c4cc' }} />
                      <div style={{ height: `${ordersHeight}%`, background: '#6d3ef2' }} />
                    </div>
                  </div>
                  {report.series.length <= 16 && <span className="truncate text-[10px] text-[#8a93a1]">{item.label}</span>}
                </div>
              )
            })}
          </div>
          {report.revenue === 0 && <p className="mt-3 text-sm text-[#8a93a1]">За этот период выручки нет.</p>}
        </section>

        <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
          <h2 className="text-base font-semibold">Топ дизайнеров</h2>
          {report.designers.length === 0 ? (
            <p className="mt-6 text-sm text-[#8a93a1]">Опубликованных работ нет.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {report.designers.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-[#8a93a1]">{item.works} работ · {item.downloads} скачиваний</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{formatTmt(item.revenue)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
          <h2 className="text-base font-semibold">Статусы заказов</h2>
          <ul className="mt-4 grid gap-3">
            {report.statusCounts.map((item) => (
              <li key={item.status} className="grid grid-cols-[140px_1fr_2rem] items-center gap-3 text-sm">
                <span className="text-[#5b6472]">{ORDER_STATUS_LABEL[item.status]}</span>
                <span className="h-2 overflow-hidden rounded-full bg-[#f6f7f9]">
                  <span className="block h-full rounded-full" style={{ width: `${(item.count / statusMax) * 100}%`, background: statusColor[item.status] }} />
                </span>
                <span className="text-right font-medium">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
          <h2 className="text-base font-semibold">Очередь модерации</h2>
          {report.queue.length === 0 ? (
            <p className="mt-6 text-sm text-[#8a93a1]">На проверке ничего нет.</p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {report.queue.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-[#8a93a1]">{item.meta}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#efe9ff] px-2.5 py-1 text-xs font-medium text-[#4f26c9]">{item.kind}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
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
  const format = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
  return `${format.format(start).replace('.', '')} — ${format.format(end).replace('.', '')}`
}
