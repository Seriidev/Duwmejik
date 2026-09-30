import type { ServiceType, TariffId } from '@/types'

export const SERVICES: Record<
  ServiceType,
  { title: string; text: string; base: number; subtypes: string[] }
> = {
  print: {
    title: 'Полиграфия',
    text: 'Визитки, буклеты, листовки, бланки и книги.',
    base: 2900,
    subtypes: ['Визитки', 'Буклеты', 'Листовки', 'Бланки', 'Книги'],
  },
  souvenir: {
    title: 'Сувенирка',
    text: 'Кружки, ручки и блокноты с вашей графикой.',
    base: 1900,
    subtypes: ['Кружки', 'Ручки', 'Блокноты'],
  },
  graphic: {
    title: 'Графический дизайн',
    text: 'Баннеры, соцсети, упаковка и наклейки.',
    base: 4500,
    subtypes: ['Баннеры', 'Соцсети', 'Упаковка', 'Наклейки'],
  },
  identity: {
    title: 'Логотип и айдентика',
    text: 'Знак, стиль и короткий бриф по бренду.',
    base: 12000,
    subtypes: ['Логотип', 'Фирменный стиль', 'Брендбук'],
  },
  laser: {
    title: 'Лазерная гравировка',
    text: 'Гравировка на металле, дереве, стекле и коже.',
    base: 2400,
    subtypes: ['Металл', 'Дерево', 'Стекло', 'Кожа'],
  },
}

export const SERVICE_ORDER: ServiceType[] = ['print', 'souvenir', 'graphic', 'identity', 'laser']

export const TARIFFS: Record<TariffId, { title: string; mult: number; days: number; note: string }> = {
  basic: { title: 'Базовый', mult: 1, days: 5, note: '1 концепция и 1 правка' },
  standard: { title: 'Стандарт', mult: 1.7, days: 8, note: '2 концепции и 3 правки' },
  premium: { title: 'Премиум', mult: 2.6, days: 14, note: '3 концепции, правки без лимита' },
}

export const TARIFF_ORDER: TariffId[] = ['basic', 'standard', 'premium']

export function estimate(service: ServiceType, tariff: TariffId, quantity: number) {
  const qtyFactor =
    service === 'identity' || service === 'graphic' ? 1 : 1 + Math.max(0, quantity - 100) / 400
  const price = Math.round((SERVICES[service].base * TARIFFS[tariff].mult * qtyFactor) / 10) * 10
  const days = TARIFFS[tariff].days + (quantity > 500 && service !== 'identity' ? 3 : 0)
  return { price, days }
}
