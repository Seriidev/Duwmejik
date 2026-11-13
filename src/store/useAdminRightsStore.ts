import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AdminRight = 'orders' | 'pickup' | 'files' | 'products' | 'designers'

export const ADMIN_RIGHTS: { id: AdminRight; label: string }[] = [
  { id: 'orders', label: 'Заказы' },
  { id: 'pickup', label: 'Выдача' },
  { id: 'files', label: 'Передача файлов' },
  { id: 'products', label: 'Шаблоны' },
  { id: 'designers', label: 'Дизайнеры' },
]

export const SUPER_ONLY: { id: string; label: string }[] = [
  { id: 'reports', label: 'Отчётность' },
  { id: 'prices', label: 'Тарифы и цены' },
  { id: 'accounting', label: 'Бухгалтерия' },
  { id: 'settings', label: 'Баннеры и настройки' },
  { id: 'bell', label: 'Лучший дизайнер' },
  { id: 'admins', label: 'Администраторы' },
]

const open: Record<AdminRight, boolean> = {
  orders: true,
  pickup: true,
  files: true,
  products: true,
  designers: true,
}

interface AdminRightsState {
  admin: Record<AdminRight, boolean>
  toggle: (id: AdminRight) => void
}

export const useAdminRightsStore = create<AdminRightsState>()(
  persist(
    (set, get) => ({
      admin: open,
      toggle: (id) => set({ admin: { ...get().admin, [id]: !get().admin[id] } }),
    }),
    { name: 'duwmejik-admin-rights' },
  ),
)
