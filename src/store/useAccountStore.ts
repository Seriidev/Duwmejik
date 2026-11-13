import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomOrder, OrderStatus, Purchase } from '@/types'

export type NewOrder = Omit<CustomOrder, 'pickupCode'>

interface AccountState {
  favorites: Record<string, string[]>
  purchases: Purchase[]
  orders: CustomOrder[]
  toggleFavorite: (userId: string, productId: string) => void
  addPurchases: (items: Purchase[]) => void
  addOrder: (order: NewOrder) => CustomOrder
  setOrderStatus: (id: string, status: OrderStatus) => void
  forgetUser: (userId: string) => void
}

export function normalizePickupCode(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

export function formatPickupCode(code: string) {
  return code.length === 6 ? `${code.slice(0, 3)}-${code.slice(3)}` : code
}

function createPickupCode(taken: CustomOrder[]) {
  for (;;) {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    if (!taken.some((item) => item.pickupCode === code)) return code
  }
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      favorites: { 'u-buyer': ['tpl-card-foil', 'tpl-banner-expo'] },
      purchases: [
        {
          id: 'p-seed-1',
          userId: 'u-buyer',
          productId: 'tpl-form-free',
          title: 'Бланк счёта «Ясно»',
          price: 0,
          purchasedAt: '2026-09-02T10:00:00.000Z',
        },
      ],
      orders: [
        {
          id: 'DM-SEED1',
          userId: 'u-buyer',
          service: 'print',
          subtype: 'Визитки',
          tariff: 'standard',
          price: 356,
          days: 3,
          status: 'in_progress',
          customerName: 'Алина Соколова',
          email: 'buyer@duwmejik.ru',
          phone: '+993 65 111-22-33',
          comment: 'Тираж к открытию точки',
          quantity: 200,
          references: [],
          brief: { format: '90×50 мм', paper: 'Тачкавер 300' },
          categoryId: 'cards',
          pickupCode: '204715',
          createdAt: '2026-09-12T10:00:00.000Z',
        },
      ],
      toggleFavorite: (userId, productId) => {
        const current = get().favorites[userId] ?? []
        const next = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId]
        set({ favorites: { ...get().favorites, [userId]: next } })
      },
      addPurchases: (items) => set({ purchases: [...items, ...get().purchases] }),
      addOrder: (draft) => {
        const order: CustomOrder = { ...draft, pickupCode: createPickupCode(get().orders) }
        set({ orders: [order, ...get().orders] })
        return order
      },
      setOrderStatus: (id, status) =>
        set({
          orders: get().orders.map((item) =>
            item.id === id ? { ...item, status, ...(status === 'issued' ? { issuedAt: new Date().toISOString() } : {}) } : item,
          ),
        }),
      forgetUser: (userId) => {
        const favorites = { ...get().favorites }
        delete favorites[userId]
        set({
          favorites,
          purchases: get().purchases.filter((item) => item.userId !== userId),
          orders: get().orders.filter((item) => item.userId !== userId),
        })
      },
    }),
    {
      name: 'duwmejik-account',
      version: 2,
      migrate: (persisted) => {
        const saved = (persisted ?? {}) as Partial<AccountState>
        const orders: CustomOrder[] = []
        for (const item of saved.orders ?? []) {
          const status = (item.status as string) === 'done' ? 'issued' : item.status
          orders.push({ ...item, status, pickupCode: item.pickupCode || createPickupCode(orders) })
        }
        return { ...saved, orders } as AccountState
      },
    },
  ),
)
