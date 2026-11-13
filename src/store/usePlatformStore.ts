import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type HeroKind = 'video' | 'image' | 'slider'

export type HeroSettings = {
  kind: HeroKind
  title: string
  cta: string
  ctaHref: string
  autoplay: boolean
  muted: boolean
  loop: boolean
  mediaId: string | null
  mediaName: string
  slides: { id: string; name: string }[]
}

export type MiniBanner = {
  id: string
  title: string
  discountPct: number
  code: string
  startsAt: string
  endsAt: string
  after: number
  active: boolean
  images?: { id: string; name: string }[]
}

export const defaultHero: HeroSettings = {
  kind: 'video',
  title: '',
  cta: '',
  ctaHref: '/templates',
  autoplay: true,
  muted: true,
  loop: true,
  mediaId: null,
  mediaName: 'hero.mp4',
  slides: [],
}

interface PlatformState {
  draft: HeroSettings
  live: HeroSettings
  draftBanners: MiniBanner[]
  liveBanners: MiniBanner[]
  patchDraft: (patch: Partial<HeroSettings>) => void
  setDraftBanners: (banners: MiniBanner[]) => void
  publish: () => void
}

export function mediaIds(hero: HeroSettings) {
  return [...hero.slides.map((item) => item.id), ...(hero.mediaId ? [hero.mediaId] : [])]
}

export function visibleBanners(banners: MiniBanner[], now = new Date()) {
  return banners.filter((item) => {
    if (!item.active || (item.images ?? []).length === 0) return false
    if (item.startsAt && now < new Date(`${item.startsAt}T00:00:00`)) return false
    if (item.endsAt && now > new Date(`${item.endsAt}T23:59:59`)) return false
    return true
  })
}

export function safeHref(value: string) {
  return value.startsWith('/') && !value.startsWith('//') ? value : '/templates'
}

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      draft: defaultHero,
      live: defaultHero,
      draftBanners: [],
      liveBanners: [],
      patchDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
      setDraftBanners: (draftBanners) => set({ draftBanners }),
      publish: () => {
        const { draft, draftBanners } = get()
        set({ live: draft, liveBanners: draftBanners })
      },
    }),
    { name: 'duwmejik-platform' },
  ),
)
