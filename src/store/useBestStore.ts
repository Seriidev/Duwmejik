import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BestTerm = 'week' | 'month' | 'forever'

export type BestMark = {
  designerId: string
  name: string
  term: BestTerm
  until: string | null
  notify: boolean
  showOnHome: boolean
  badge: boolean
  markedAt: string
}

interface BestState {
  marks: BestMark[]
  mark: (input: Omit<BestMark, 'markedAt' | 'until'> & { until: string | null }) => void
  clear: (designerId: string) => void
}

export function untilFor(term: BestTerm, from = new Date()) {
  if (term === 'forever') return null
  const next = new Date(from)
  next.setDate(next.getDate() + (term === 'week' ? 7 : 30))
  return next.toISOString()
}

export function activeMarks(marks: BestMark[], now = Date.now()) {
  return marks.filter((item) => item.until == null || new Date(item.until).getTime() > now)
}

export function bestLabel(term: BestTerm) {
  if (term === 'week') return 'Лучший недели'
  if (term === 'forever') return 'Лучший'
  return 'Лучший месяца'
}

export function bestMessage(term: BestTerm) {
  if (term === 'week') return 'Вы — лучший дизайнер недели!'
  if (term === 'forever') return 'Вы — лучший дизайнер!'
  return 'Вы — лучший дизайнер месяца!'
}

export const useBestStore = create<BestState>()(
  persist(
    (set, get) => ({
      marks: [],
      mark: (input) =>
        set({
          marks: [{ ...input, markedAt: new Date().toISOString() }, ...get().marks.filter((item) => item.designerId !== input.designerId)],
        }),
      clear: (designerId) => set({ marks: get().marks.filter((item) => item.designerId !== designerId) }),
    }),
    { name: 'duwmejik-best' },
  ),
)
