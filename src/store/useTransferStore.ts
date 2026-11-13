import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const TRANSFER_TTL_DAYS = 7

export interface FileTransfer {
  id: string
  fromId: string
  fromName: string
  toId: string
  name: string
  size: number
  type: string
  orderId?: string
  note: string
  createdAt: string
}

interface TransferState {
  items: FileTransfer[]
  add: (item: FileTransfer) => void
  remove: (id: string) => void
}

export const useTransferStore = create<TransferState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => set({ items: [item, ...get().items] }),
      remove: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
    }),
    { name: 'duwmejik-transfers', version: 1 },
  ),
)
