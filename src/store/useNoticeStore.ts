'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/format'

export type NoticeVerdict = 'accepted' | 'rejected'

export interface DesignerNotice {
  id: string
  userId: string
  productId: string
  title: string
  verdict: NoticeVerdict
  message: string
  createdAt: string
  read: boolean
}

interface NoticeState {
  items: DesignerNotice[]
  push: (input: Omit<DesignerNotice, 'id' | 'createdAt' | 'read'>) => void
  markAllRead: (userId: string) => void
}

export function verdictMessage(title: string, verdict: NoticeVerdict) {
  return verdict === 'accepted'
    ? `Работа «${title}» принята и опубликована в каталоге.`
    : `Работа «${title}» отклонена. Исправьте файл и отправьте его снова.`
}

export const useNoticeStore = create<NoticeState>()(
  persist(
    (set, get) => ({
      items: [],
      push: (input) =>
        set({
          items: [
            {
              ...input,
              id: createId('note'),
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...get().items,
          ].slice(0, 80),
        }),
      markAllRead: (userId) =>
        set({
          items: get().items.map((item) => (item.userId === userId ? { ...item, read: true } : item)),
        }),
    }),
    { name: 'duwmejik-notices' },
  ),
)
