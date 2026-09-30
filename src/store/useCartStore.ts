import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartState {
  items: string[]
  add: (productId: string) => void
  remove: (productId: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (productId) => {
        if (get().items.includes(productId)) return
        set({ items: [...get().items, productId] })
      },
      remove: (productId) => set({ items: get().items.filter((id) => id !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'duwmejik-cart' },
  ),
)
