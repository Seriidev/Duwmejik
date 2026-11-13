import { addDays, inSpan, startOfDay } from './reports.ts'

export type BooksRange = 'day' | 'week' | 'month' | 'year'

export type BooksOrder = {
  id: string
  createdAt: string
  price: number
  status: string
  customerName: string
  subtype: string
  productId?: string
}

export type BooksPurchase = { purchasedAt: string; price: number }

export type BooksSpan = { start: Date; end: Date }

function endOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

export function booksSpan(range: BooksRange | 'quarter', now = new Date()): BooksSpan {
  const today = startOfDay(now)
  if (range === 'day') return { start: today, end: endOfDay(today) }
  if (range === 'week') {
    const offset = today.getDay() === 0 ? 6 : today.getDay() - 1
    const start = addDays(today, -offset)
    return { start, end: endOfDay(addDays(start, 6)) }
  }
  if (range === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))
    return { start, end }
  }
  if (range === 'quarter') {
    const quarter = Math.floor(today.getMonth() / 3)
    const start = new Date(today.getFullYear(), quarter * 3, 1)
    const end = endOfDay(new Date(today.getFullYear(), quarter * 3 + 3, 0))
    return { start, end }
  }
  const start = new Date(today.getFullYear(), 0, 1)
  return { start, end: endOfDay(new Date(today.getFullYear(), 11, 31)) }
}

export function previousSpan(range: BooksRange, now = new Date()): BooksSpan {
  const current = booksSpan(range, now)
  if (range === 'day') {
    const start = addDays(current.start, -1)
    return { start, end: endOfDay(start) }
  }
  if (range === 'week') {
    const start = addDays(current.start, -7)
    return { start, end: endOfDay(addDays(start, 6)) }
  }
  if (range === 'month') {
    const start = new Date(current.start.getFullYear(), current.start.getMonth() - 1, 1)
    const end = endOfDay(new Date(current.start.getFullYear(), current.start.getMonth(), 0))
    return { start, end }
  }
  const start = new Date(current.start.getFullYear() - 1, 0, 1)
  return { start, end: endOfDay(new Date(current.start.getFullYear() - 1, 11, 31)) }
}

function paid(order: BooksOrder) {
  return order.status !== 'cancelled'
}

function money(orders: BooksOrder[], purchases: BooksPurchase[], span: BooksSpan) {
  const chosen = orders.filter((item) => paid(item) && inSpan(item.createdAt, span.start, span.end))
  const sales = purchases.filter((item) => inSpan(item.purchasedAt, span.start, span.end))
  return {
    orders: chosen.length,
    orderRevenue: chosen.reduce((sum, item) => sum + item.price, 0),
    templateRevenue: sales.reduce((sum, item) => sum + item.price, 0),
    revenue: chosen.reduce((sum, item) => sum + item.price, 0) + sales.reduce((sum, item) => sum + item.price, 0),
  }
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(date).replace('.', '')
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date).replace('.', '')
}

export function buildBooks(input: {
  orders: BooksOrder[]
  purchases: BooksPurchase[]
  range: BooksRange
  now?: Date
}) {
  const now = input.now ?? new Date()
  const span = booksSpan(input.range, now)
  const previous = previousSpan(input.range, now)
  const current = money(input.orders, input.purchases, span)
  const before = money(input.orders, input.purchases, previous)
  const series: { label: string; orders: number; templates: number }[] = []

  if (input.range === 'year') {
    for (let month = 0; month < 12; month += 1) {
      const start = new Date(span.start.getFullYear(), month, 1)
      const bucket = { start, end: endOfDay(new Date(span.start.getFullYear(), month + 1, 0)) }
      const slice = money(input.orders, input.purchases, bucket)
      series.push({ label: monthLabel(start), orders: slice.orderRevenue, templates: slice.templateRevenue })
    }
  } else {
    const cursor = new Date(span.start)
    while (cursor.getTime() <= span.end.getTime()) {
      const bucket = { start: startOfDay(cursor), end: endOfDay(cursor) }
      const slice = money(input.orders, input.purchases, bucket)
      series.push({ label: dayLabel(cursor), orders: slice.orderRevenue, templates: slice.templateRevenue })
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  const summary = (['week', 'month', 'quarter', 'year'] as const).map((range) => {
    const slice = money(input.orders, input.purchases, booksSpan(range, now))
    return { range, orders: slice.orders, revenue: slice.revenue }
  })

  const rows = input.orders
    .filter((item) => inSpan(item.createdAt, span.start, span.end))
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return { span, previous, ...current, previousRevenue: before.revenue, previousOrders: before.orders, series, summary, rows }
}
