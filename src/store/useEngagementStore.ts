import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface EngagementState {
  views: Record<string, number>
  likes: Record<string, string[]>
  addView: (productId: string) => void
  toggleLike: (userId: string, productId: string) => void
}

export const useEngagementStore = create<EngagementState>()(
  persist(
    (set, get) => ({
      views: {},
      likes: {},
      addView: (productId) =>
        set({ views: { ...get().views, [productId]: (get().views[productId] ?? 0) + 1 } }),
      toggleLike: (userId, productId) => {
        const current = get().likes[userId] ?? []
        const next = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId]
        set({ likes: { ...get().likes, [userId]: next } })
      },
    }),
    { name: 'duwmejik-engagement', version: 1 },
  ),
)

export function likeCount(likes: Record<string, string[]>, productId: string) {
  return Object.values(likes).reduce((sum, ids) => sum + (ids.includes(productId) ? 1 : 0), 0)
}
