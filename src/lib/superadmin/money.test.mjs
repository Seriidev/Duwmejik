import { salePrice } from './money.ts'

const sale = salePrice(142.45, 35)
if (sale !== 192.31) {
  console.error('expected 192.31, got', sale)
  process.exit(1)
}
if (salePrice(105, 30) !== 136.5) {
  console.error('paper markup failed')
  process.exit(1)
}
console.log('ok', sale)
