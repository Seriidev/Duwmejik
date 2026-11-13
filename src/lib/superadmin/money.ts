export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function salePrice(purchase: number, markup: number) {
  return roundMoney(purchase * (1 + markup / 100))
}

export function formatAmount(value: number) {
  return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
}

export function formatTmt(value: number) {
  return `${formatAmount(value)} TMT`
}
