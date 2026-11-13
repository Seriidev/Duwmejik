import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SERVICE_ORDER, SERVICES } from '@/features/orders/pricing'
import type { ServiceType } from '@/types'

interface PriceState {
  serviceBase: Record<ServiceType, number>
  setServiceBase: (service: ServiceType, price: number) => void
}

const seedBase = Object.fromEntries(SERVICE_ORDER.map((id) => [id, SERVICES[id].base])) as Record<ServiceType, number>

export const usePriceStore = create<PriceState>()(
  persist(
    (set, get) => ({
      serviceBase: seedBase,
      setServiceBase: (service, price) => set({ serviceBase: { ...get().serviceBase, [service]: price } }),
    }),
    {
      name: 'duwmejik-prices',
      version: 1,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PriceState>
        return { ...current, serviceBase: { ...seedBase, ...saved.serviceBase } }
      },
    },
  ),
)
