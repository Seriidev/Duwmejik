'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const baseFollowers: Record<string, number> = {
  'u-seller': 248,
  'u-maya': 176,
  'u-ost': 93,
}

interface FollowState {
  following: Record<string, string[]>
  toggle: (userId: string, designerId: string) => void
}

export const useFollowStore = create<FollowState>()(
  persist(
    (set, get) => ({
      following: {},
      toggle: (userId, designerId) => {
        const current = get().following[userId] ?? []
        const next = current.includes(designerId) ? current.filter((id) => id !== designerId) : [...current, designerId]
        set({ following: { ...get().following, [userId]: next } })
      },
    }),
    { name: 'duwmejik-follows' },
  ),
)

export function followerCount(following: Record<string, string[]>, designerId: string) {
  const extra = Object.values(following).reduce((sum, ids) => sum + (ids.includes(designerId) ? 1 : 0), 0)
  return (baseFollowers[designerId] ?? 0) + extra
}

export function isFollowing(following: Record<string, string[]>, userId: string, designerId: string) {
  return Boolean(following[userId]?.includes(designerId))
}
