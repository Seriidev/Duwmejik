import { buildBooks } from './accounting.ts'

const now = new Date('2026-11-13T12:00:00+05:00')
const orders = [{ id: 'DM-SEED1', createdAt: '2026-09-12T10:00:00.000Z', price: 356, status: 'in_progress', customerName: 'Алина Соколова', subtype: 'Визитки' }]
const purchases = [{ purchasedAt: '2026-09-02T10:00:00.000Z', price: 0 }]

const year = buildBooks({ orders, purchases, range: 'year', now })
if (year.revenue !== 356 || year.orders !== 1 || year.rows.length !== 1) {
  console.error('year', year.revenue, year.orders, year.rows.length)
  process.exit(1)
}
const september = year.series.find((item) => item.orders === 356)
if (!september) {
  console.error('september bar missing', year.series)
  process.exit(1)
}
const month = buildBooks({ orders, purchases, range: 'month', now })
if (month.revenue !== 0 || month.rows.length !== 0) {
  console.error('month should be empty', month.revenue, month.rows.length)
  process.exit(1)
}
const summaryYear = year.summary.find((item) => item.range === 'year')
const summaryQuarter = year.summary.find((item) => item.range === 'quarter')
if (summaryYear?.revenue !== 356 || summaryQuarter?.revenue !== 0) {
  console.error('summary', year.summary)
  process.exit(1)
}
console.log('ok', september.label)
