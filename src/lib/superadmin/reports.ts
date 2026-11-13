export type ReportRange = '7' | '30' | '90'

export type ReportOrder = { createdAt: string; price: number; status: string; productId?: string }
export type ReportPurchase = { purchasedAt: string; price: number }
export type ReportProduct = { id: string; title: string; author: string; authorId: string; downloads: number; status: string }
export type ReportUser = { id: string; name: string; designerRequest?: { status: string; createdAt: string } }

export function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function periodFor(range: ReportRange, now = new Date()) {
  const days = range === '7' ? 7 : range === '30' ? 30 : 90
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const start = startOfDay(addDays(end, -(days - 1)))
  const previousEnd = new Date(start.getTime() - 1)
  const previousStart = startOfDay(addDays(previousEnd, -(days - 1)))
  return { days, start, end, previousStart, previousEnd }
}

export function inSpan(iso: string, start: Date, end: Date) {
  const time = new Date(iso).getTime()
  return time >= start.getTime() && time <= end.getTime()
}

function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function dayKeys(start: Date, end: Date) {
  const keys: string[] = []
  const cursor = startOfDay(start)
  const last = startOfDay(end)
  while (cursor.getTime() <= last.getTime()) {
    keys.push(dayKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

export function deltaLabel(current: number, previous: number) {
  if (current === previous) return { text: 'без изменений', tone: 'flat' as const }
  if (previous === 0) return { text: 'новое за период', tone: 'up' as const }
  const percent = Math.round(((current - previous) / previous) * 100)
  if (percent === 0) return { text: 'без изменений', tone: 'flat' as const }
  const sign = percent > 0 ? '+' : '−'
  return { text: `${sign}${Math.abs(percent)}% к прошлому периоду`, tone: percent > 0 ? ('up' as const) : ('down' as const) }
}

export function buildReport(input: {
  orders: ReportOrder[]
  purchases: ReportPurchase[]
  products: ReportProduct[]
  users: ReportUser[]
  following: Record<string, string[]>
  range: ReportRange
  now?: Date
}) {
  const period = periodFor(input.range, input.now ?? new Date())
  const paid = (order: ReportOrder) => order.status !== 'cancelled'
  const ordersNow = input.orders.filter((item) => paid(item) && inSpan(item.createdAt, period.start, period.end))
  const ordersPrev = input.orders.filter((item) => paid(item) && inSpan(item.createdAt, period.previousStart, period.previousEnd))
  const salesNow = input.purchases.filter((item) => inSpan(item.purchasedAt, period.start, period.end))
  const salesPrev = input.purchases.filter((item) => inSpan(item.purchasedAt, period.previousStart, period.previousEnd))
  const orderRevenue = ordersNow.reduce((sum, item) => sum + item.price, 0)
  const saleRevenue = salesNow.reduce((sum, item) => sum + item.price, 0)
  const previousRevenue = ordersPrev.reduce((sum, item) => sum + item.price, 0) + salesPrev.reduce((sum, item) => sum + item.price, 0)
  const revenue = orderRevenue + saleRevenue
  const keys = dayKeys(period.start, period.end)
  const step = input.range === '90' ? 7 : 1
  const series = []
  for (let index = 0; index < keys.length; index += step) {
    const slice = keys.slice(index, index + step)
    const orders = ordersNow.filter((item) => slice.includes(dayKey(new Date(item.createdAt)))).reduce((sum, item) => sum + item.price, 0)
    const templates = salesNow.filter((item) => slice.includes(dayKey(new Date(item.purchasedAt)))).reduce((sum, item) => sum + item.price, 0)
    series.push({ label: shortDay(slice[0]), orders, templates })
  }
  const byAuthor = new Map<string, { name: string; works: number; downloads: number; orders: number; revenue: number }>()
  for (const product of input.products) {
    const row = byAuthor.get(product.authorId) ?? { name: product.author, works: 0, downloads: 0, orders: 0, revenue: 0 }
    if (product.status === 'published') {
      row.works += 1
      row.downloads += product.downloads
    }
    byAuthor.set(product.authorId, row)
  }
  for (const order of ordersNow) {
    const product = input.products.find((item) => item.id === order.productId)
    if (!product) continue
    const row = byAuthor.get(product.authorId) ?? { name: product.author, works: 0, downloads: 0, orders: 0, revenue: 0 }
    row.orders += 1
    row.revenue += order.price
    byAuthor.set(product.authorId, row)
  }
  const designers = [...byAuthor.values()].sort((a, b) => b.revenue - a.revenue || b.downloads - a.downloads).slice(0, 5)
  const statuses = ['new', 'accepted', 'in_progress', 'ready', 'issued', 'cancelled'] as const
  const inPeriod = input.orders.filter((item) => inSpan(item.createdAt, period.start, period.end))
  const statusCounts = statuses.map((status) => ({ status, count: inPeriod.filter((item) => item.status === status).length }))
  const queue = [
    ...input.products
      .filter((item) => item.status === 'pending')
      .map((item) => ({ id: item.id, title: item.title, meta: item.author, kind: 'Работа' })),
    ...input.users
      .filter((item) => item.designerRequest?.status === 'pending')
      .map((item) => ({ id: item.id, title: item.name, meta: 'Заявка дизайнера', kind: 'Заявка' })),
  ]
  return {
    period,
    revenue,
    previousRevenue,
    orders: ordersNow.length,
    previousOrders: ordersPrev.length,
    subscriptions: Object.values(input.following).reduce((sum, ids) => sum + ids.length, 0),
    series,
    designers,
    statusCounts,
    queue,
  }
}

function shortDay(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(year, month - 1, day)).replace('.', '')
}
