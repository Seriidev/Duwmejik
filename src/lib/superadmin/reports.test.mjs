import { buildReport, deltaLabel } from './reports.ts'

const now = new Date('2026-11-13T12:00:00+05:00')
const report = buildReport({
  orders: [{ createdAt: '2026-09-12T10:00:00.000Z', price: 356, status: 'in_progress' }],
  purchases: [{ purchasedAt: '2026-09-02T10:00:00.000Z', price: 0 }],
  products: [{ id: 'tpl-pending-menu', title: 'Меню ресторана «Север»', author: 'Студия Норд', authorId: 'u-seller', downloads: 0, status: 'pending' }],
  users: [],
  following: { 'u-buyer': ['u-seller'] },
  range: '90',
  now,
})

if (report.revenue !== 356) {
  console.error('revenue', report.revenue)
  process.exit(1)
}
if (report.orders !== 1) {
  console.error('orders', report.orders)
  process.exit(1)
}
if (report.subscriptions !== 1) {
  console.error('subscriptions', report.subscriptions)
  process.exit(1)
}
if (report.queue.length !== 1) {
  console.error('queue', report.queue)
  process.exit(1)
}
const week = buildReport({
  orders: [{ createdAt: '2026-09-12T10:00:00.000Z', price: 356, status: 'in_progress' }],
  purchases: [],
  products: [],
  users: [],
  following: {},
  range: '7',
  now,
})
if (week.revenue !== 0 || week.orders !== 0) {
  console.error('week should be empty', week.revenue, week.orders)
  process.exit(1)
}
if (deltaLabel(356, 0).tone !== 'up') process.exit(1)
console.log('ok', report.series.find((item) => item.orders === 356)?.label)
