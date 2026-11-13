'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { ORDER_STATUS_LABEL } from '@/data/labels'
import { prepaySplit } from '@/features/orders/PickupPass'
import { SERVICES } from '@/features/orders/pricing'
import { formatDate } from '@/lib/format'
import { formatPickupCode, useAccountStore } from '@/store/useAccountStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import type { OrderStatus } from '@/types'

function monthKey(iso: string) {
  return iso.slice(0, 7)
}

function monthTitle(key: string) {
  const [year, month] = key.split('-').map(Number)
  const title = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
  return title.charAt(0).toUpperCase() + title.slice(1)
}

function csvCell(value: string | number) {
  const text = String(value)
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function tmt(value: number) {
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)} TMT`
}

function csvMoney(value: number) {
  return value.toFixed(2).replace('.', ',')
}

export function ReportsPanel() {
  const orders = useAccountStore((state) => state.orders)
  const purchases = useAccountStore((state) => state.purchases)
  const categories = useCatalogStore((state) => state.categories)
  const current = monthKey(new Date().toISOString())
  const months = [...new Set([current, ...orders.map((item) => monthKey(item.createdAt))])].sort().reverse()
  const [month, setMonth] = useState(current)

  const inMonth = orders.filter((item) => monthKey(item.createdAt) === month)
  const active = inMonth.filter((item) => item.status !== 'cancelled')
  const issued = inMonth.filter((item) => item.status === 'issued')
  const total = active.reduce((sum, item) => sum + item.price, 0)
  const issuedTotal = issued.reduce((sum, item) => sum + item.price, 0)
  const templateSales = purchases.filter((item) => monthKey(item.purchasedAt) === month).reduce((sum, item) => sum + item.price, 0)
  const categoryTitle = (id?: string) => categories.find((item) => item.id === id)?.title ?? 'Без категории'

  const byCategory = new Map<string, { count: number; quantity: number; sum: number }>()
  for (const order of active) {
    const key = order.categoryId ? categoryTitle(order.categoryId) : `${SERVICES[order.service]?.title ?? order.service} · ${order.subtype}`
    const row = byCategory.get(key) ?? { count: 0, quantity: 0, sum: 0 }
    byCategory.set(key, { count: row.count + 1, quantity: row.quantity + order.quantity, sum: row.sum + order.price })
  }
  const categoryRows = [...byCategory.entries()].sort((a, b) => b[1].sum - a[1].sum)
  const statusCounts = (Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((status) => ({
    status,
    count: inMonth.filter((item) => item.status === status).length,
  }))

  function download() {
    const lines: (string | number)[][] = [
      ['Отчёт Duwmejik', monthTitle(month)],
      ['Заказов', inMonth.length],
      ['Сумма заказов без отменённых, TMT', csvMoney(total)],
      ['Выдано заказов', issued.length],
      ['Сумма выданных, TMT', csvMoney(issuedTotal)],
      ['Продажи шаблонов, TMT', csvMoney(templateSales)],
      [],
      ['Категория', 'Заказов', 'Тираж, шт.', 'Сумма, TMT'],
      ...categoryRows.map(([title, row]) => [title, row.count, row.quantity, csvMoney(row.sum)]),
      [],
      ['Номер', 'Дата', 'Клиент', 'Телефон', 'Почта', 'Изделие', 'Категория', 'Тираж, шт.', 'Сумма, TMT', 'Предоплата 50%, TMT', 'Статус', 'Код получения', 'Выдан'],
      ...inMonth.map((order) => [
        order.id,
        formatDate(order.createdAt),
        order.customerName,
        order.phone,
        order.email,
        order.subtype,
        order.categoryId ? categoryTitle(order.categoryId) : '',
        order.quantity,
        csvMoney(order.price),
        csvMoney(prepaySplit(order.price).prepay),
        ORDER_STATUS_LABEL[order.status],
        formatPickupCode(order.pickupCode),
        order.issuedAt ? formatDate(order.issuedAt) : '',
      ]),
    ]
    const csv = `\uFEFF${lines.map((line) => line.map(csvCell).join(';')).join('\r\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `duwmejik-otchet-${month}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mt-6 grid gap-4">
      <Card className="flex flex-wrap items-end gap-3 p-4">
        <div className="w-64">
          <Select label="Месяц" value={month} onChange={(event) => setMonth(event.target.value)}>
            {months.map((key) => (
              <option key={key} value={key}>
                {monthTitle(key)}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={download}>Скачать отчёт (Excel)</Button>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Заказов" value={String(inMonth.length)} />
        <Stat label="Сумма заказов" value={tmt(total)} />
        <Stat label="Выдано" value={`${issued.length} · ${tmt(issuedTotal)}`} />
        <Stat label="Продажи шаблонов" value={tmt(templateSales)} />
      </div>
      <Card className="p-4">
        <p className="font-semibold">По статусам</p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {statusCounts.map((item) => (
            <span key={item.status}>
              {ORDER_STATUS_LABEL[item.status]}: <span className="font-semibold">{item.count}</span>
            </span>
          ))}
        </div>
      </Card>
      <Card className="overflow-x-auto p-4">
        <p className="font-semibold">По категориям</p>
        {categoryRows.length === 0 ? (
          <p className="mt-2 text-sm text-muted">В этом месяце заказов нет.</p>
        ) : (
          <table className="mt-2 w-full min-w-[480px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 font-medium">Категория</th>
                <th className="py-2 font-medium">Заказов</th>
                <th className="py-2 font-medium">Тираж</th>
                <th className="py-2 font-medium">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {categoryRows.map(([title, row]) => (
                <tr key={title} className="border-t border-line">
                  <td className="py-2">{title}</td>
                  <td>{row.count}</td>
                  <td>{row.quantity} шт.</td>
                  <td>{tmt(row.sum)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <p className="text-sm text-muted">
        Файл открывается в Excel. Пока отчёт собирается из данных этого браузера, общий отчёт по всем точкам появится после подключения сервера.
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </Card>
  )
}
