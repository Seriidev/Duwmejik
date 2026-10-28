'use client'

import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import cardPreview from '@/assets/card-preview.jpg'
import logoBell from '@/assets/logo-bell.png'
import { PreviewModal } from '@/features/catalog/PreviewModal'
import { likeCount, useEngagementStore } from '@/store/useEngagementStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { followerCount, isFollowing, useFollowStore } from '@/store/useFollowStore'
import type { Product } from '@/types'

export function DesignerPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const accounts = useAuthStore((state) => state.users)
  const products = useCatalogStore((state) => state.products)
  const views = useEngagementStore((state) => state.views)
  const likes = useEngagementStore((state) => state.likes)
  const addView = useEngagementStore((state) => state.addView)
  const following = useFollowStore((state) => state.following)
  const toggle = useFollowStore((state) => state.toggle)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const works = products.filter((item) => item.authorId === id && item.status === 'published')
  const liked = (likes[id] ?? [])
    .map((productId) => products.find((item) => item.id === productId && item.status === 'published'))
    .filter((item): item is Product => Boolean(item))
  const account = accounts.find((item) => item.id === id)
  const name = account?.name || works[0]?.author
  const preview = products.find((item) => item.id === previewId) ?? null

  if (!name) {
    return (
      <div className="min-h-svh bg-white">
        <TopBar onBack={() => router.back()} />
        <p className="px-4 py-24 text-center text-sm text-slate-500">Дизайнер не найден</p>
      </div>
    )
  }

  const likesTotal = works.reduce((sum, item) => sum + likeCount(likes, item.id), 0)
  const viewTotal = works.reduce((sum, item) => sum + (views[item.id] ?? 0) + Math.round(item.downloads * 0.18), 0)
  const followers = followerCount(following, id)
  const mine = user?.id === id
  const followed = Boolean(user && isFollowing(following, user.id, id))

  function follow() {
    if (!user) {
      router.push(`/login?from=${encodeURIComponent(`/designer/${id}`)}`)
      return
    }
    toggle(user.id, id)
  }

  function openCard(productId: string) {
    addView(productId)
    setPreviewId(productId)
  }

  return (
    <div className="min-h-svh bg-white">
      <TopBar onBack={() => router.back()} />
      <div className="mx-auto max-w-5xl px-4 pb-12">
        <div className="mt-6 flex items-center gap-5">
          <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-600 text-2xl font-semibold text-white sm:size-28">
            {account?.avatar ? <img src={account.avatar} alt="" className="size-full object-cover" /> : initials(name)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{name}</h1>
            <p className="mt-2 text-sm text-slate-500">
              <span className="font-semibold text-slate-950">{compact(followers)}</span> подписчиков
              <span className="px-2 text-slate-300">·</span>
              <span className="font-semibold text-slate-950">{compact(likesTotal)}</span> лайков
              <span className="px-2 text-slate-300">·</span>
              <span className="font-semibold text-slate-950">{compact(viewTotal)}</span> просмотров
            </p>
          </div>
        </div>
        {!mine && (
          <button
            type="button"
            onClick={follow}
            className={
              followed
                ? 'mt-5 inline-flex h-11 items-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-800'
                : 'mt-5 inline-flex h-11 items-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700'
            }
          >
            {followed ? 'Вы подписаны' : 'Подписаться'}
          </button>
        )}

        <h2 className="mt-10 text-lg font-semibold text-slate-950">Работы</h2>
        <Cards products={works} empty="Опубликованных работ пока нет." onOpen={openCard} />

        <h2 className="mt-10 text-lg font-semibold text-slate-950">Лайкнутые</h2>
        <Cards products={liked} empty="Пока нет лайкнутых картинок." onOpen={openCard} />
      </div>
      <PreviewModal product={preview} onClose={() => setPreviewId(null)} />
    </div>
  )
}

function TopBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 sm:px-6">
      <button
        type="button"
        aria-label="Назад"
        onClick={onBack}
        className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
      >
        <ChevronLeft className="size-5" />
      </button>
      <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-neutral-950">
        <img src={logoBell.src} alt="Duwmejik" className="size-12 object-contain" />
        <span className="text-[17px]">Duwmejik</span>
      </Link>
    </div>
  )
}

function Cards({ products, empty, onOpen }: { products: Product[]; empty: string; onOpen: (id: string) => void }) {
  if (products.length === 0) {
    return <p className="py-8 text-sm text-slate-500">{empty}</p>
  }
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onOpen(product.id)}
          className="relative aspect-square overflow-hidden rounded-[22px] bg-[#6f7874]"
        >
          <img src={product.image || cardPreview.src} alt="" className="size-full object-cover" />
        </button>
      ))}
    </div>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function compact(value: number) {
  if (value < 1000) return String(value)
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value / 1000)}K`
}
