import type { LicenseId, OrderStatus, Orientation, ProductStatus, Role, StyleId } from '@/types'

export const FILE_TYPES = ['PSD', 'AI', 'Figma', 'PNG', 'PDF'] as const

export const COLORS = [
  { id: 'чёрный', hex: '#171717' },
  { id: 'белый', hex: '#f8fafc' },
  { id: 'синий', hex: '#2563eb' },
  { id: 'красный', hex: '#e11d48' },
  { id: 'зелёный', hex: '#059669' },
  { id: 'жёлтый', hex: '#eab308' },
  { id: 'фиолетовый', hex: '#7c3aed' },
  { id: 'оранжевый', hex: '#f97316' },
  { id: 'розовый', hex: '#ec4899' },
  { id: 'серый', hex: '#94a3b8' },
  { id: 'золотой', hex: '#d4a017' },
] as const

export const STYLES: { id: StyleId; label: string }[] = [
  { id: 'minimal', label: 'Минимализм' },
  { id: 'bold', label: 'Яркий' },
  { id: 'elegant', label: 'Элегантный' },
  { id: 'playful', label: 'Игривый' },
  { id: 'corporate', label: 'Деловой' },
]

export const ORIENTATIONS: { id: Orientation; label: string }[] = [
  { id: 'portrait', label: 'Портрет' },
  { id: 'landscape', label: 'Альбом' },
  { id: 'square', label: 'Квадрат' },
]

export const LICENSES: { id: LicenseId; label: string; text: string }[] = [
  {
    id: 'personal',
    label: 'Личная',
    text: 'Можно печатать для себя. Передавать макет клиентам и перепродавать файл нельзя.',
  },
  {
    id: 'commercial',
    label: 'Коммерческая',
    text: 'Печать и использование в бизнесе: визитки, упаковка, реклама вашей компании.',
  },
  {
    id: 'extended',
    label: 'Расширенная',
    text: 'Тираж без потолка и включение макета в фирменный стиль.',
  },
]

export const STYLE_LABEL = Object.fromEntries(STYLES.map((item) => [item.id, item.label])) as Record<
  StyleId,
  string
>

export const ORIENTATION_LABEL = Object.fromEntries(
  ORIENTATIONS.map((item) => [item.id, item.label]),
) as Record<Orientation, string>

export const LICENSE_LABEL = Object.fromEntries(LICENSES.map((item) => [item.id, item.label])) as Record<
  LicenseId,
  string
>

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  published: 'В каталоге',
  pending: 'На модерации',
  rejected: 'Отклонён',
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Готово',
  cancelled: 'Отменена',
}

export const ROLE_LABEL: Record<Role, string> = {
  buyer: 'Покупатель',
  seller: 'Дизайнер',
  admin: 'Админ',
}

export function isFileType(value: string): value is (typeof FILE_TYPES)[number] {
  return (FILE_TYPES as readonly string[]).includes(value)
}

export function isStyle(value: string): value is StyleId {
  return STYLES.some((item) => item.id === value)
}

export function isOrientation(value: string): value is Orientation {
  return ORIENTATIONS.some((item) => item.id === value)
}
