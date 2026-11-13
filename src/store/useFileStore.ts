import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/format'

export interface SharedFile {
  id: string
  name: string
  size: number
  fromId: string
  fromName: string
  toId: string
  toName: string
  createdAt: string
  note?: string
  stored?: boolean
  downloaded?: boolean
}

interface FileState {
  files: SharedFile[]
  send: (file: Omit<SharedFile, 'id' | 'createdAt'> & { id?: string }) => SharedFile
  markDownloaded: (id: string) => void
  remove: (id: string) => void
}

export const useFileStore = create<FileState>()(
  persist(
    (set, get) => ({
      files: [],
      send: (file) => {
        const next: SharedFile = { ...file, id: file.id ?? createId('file'), createdAt: new Date().toISOString() }
        set({ files: [next, ...get().files] })
        return next
      },
      markDownloaded: (id) =>
        set({ files: get().files.map((item) => (item.id === id ? { ...item, downloaded: true, stored: false } : item)) }),
      remove: (id) => set({ files: get().files.filter((item) => item.id !== id) }),
    }),
    { name: 'duwmejik-files' },
  ),
)
