import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CustomOrder, OrderStatus, Purchase } from '@/types'

interface AccountState {
  favorites: Record<string, string[]>
  purchases: Purchase[]
  orders: CustomOrder[]
  toggleFavorite: (userId: string, productId: string) => void
  addPurchases: (items: Purchase[]) => void
  addOrder: (order: CustomOrder) => void
  setOrderStatus: (id: string, status: OrderStatus) => void
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
          price: 5360,
          days: 8,
          status: 'in_progress',
          customerName: 'Алина Соколова',
          email: 'buyer@duwmejik.ru',
          phone: '+7 900 111-22-33',
          comment: 'Тираж к открытию точки',
          quantity: 200,
          references: [],
          brief: { format: '90×50 мм', paper: 'Тачкавер 300' },
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
      addOrder: (order) => set({ orders: [order, ...get().orders] }),
      setOrderStatus: (id, status) =>
        set({
          orders: get().orders.map((item) => (item.id === id ? { ...item, status } : item)),
        }),
    }),
    { name: 'duwmejik-account', version: 1 },
  ),
)
