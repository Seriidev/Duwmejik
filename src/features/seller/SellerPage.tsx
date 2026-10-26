'use client'

import { BarChart3, Eye, Heart, LayoutGrid, PanelLeftClose, PanelLeftOpen, QrCode } from 'lucide-react'
import logoBell from '@/assets/logo-bell.png'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Gate } from '@/components/Gate'
import { LanguageMenu } from '@/components/LanguageMenu'
import { buttonClass } from '@/components/ui/Button'
import { QrGenerator } from '@/features/catalog/QrGenerator'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { likeCount, useEngagementStore } from '@/store/useEngagementStore'
import type { Product, ProductStatus } from '@/types'

type Panel = 'templates' | 'qr' | 'stats'

const statusText: Record<ProductStatus, string> = {
  pending: 'На проверке',
  published: 'Одобрено',
  rejected: 'Отклонено',
}

export function SellerPage() {
  const user = useAuthStore((state) => state.user)
  const products = useCatalogStore((state) => state.products)
  const views = useEngagementStore((state) => state.views)
  const likes = useEngagementStore((state) => state.likes)
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>('stats')

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    const apply = () => setMenuOpen(wide.matches)
    apply()
    wide.addEventListener('change', apply)
    return () => wide.removeEventListener('change', apply)
  }, [])

  if (!user) {
    return (
      <div className="min-h-svh bg-white">
        <Gate
          title="Кабинет дизайнера"
          text="Войдите, чтобы открыть свои шаблоны и статистику."
          action={
            <Link href="/login?from=%2Fseller" className={buttonClass()}>
              Войти
            </Link>
          }
        />
      </div>
    )
  }

  if (user.role === 'buyer') {
    return (
      <div className="min-h-svh bg-white">
        <Gate
          title="Сначала станьте дизайнером"
          text="Пункт есть в настройках профиля. После согласия с условиями откроется этот кабинет."
          action={
            <Link href="/account?tab=settings" className={buttonClass()}>
              Открыть настройки
            </Link>
          }
        />
      </div>
    )
  }

  const mine = products.filter((item) => item.authorId === user.id)
  const counts = {
    pending: mine.filter((item) => item.status === 'pending').length,
    published: mine.filter((item) => item.status === 'published').length,
    rejected: mine.filter((item) => item.status === 'rejected').length,
  }
  const totalViews = mine.reduce((sum, item) => sum + (views[item.id] ?? 0), 0)
  const totalLikes = mine.reduce((sum, item) => sum + likeCount(likes, item.id), 0)
  const totalDownloads = mine.reduce((sum, item) => sum + item.downloads, 0)

  function openPanel(next: Panel) {
    setPanel(next)
    if (window.innerWidth < 1024) setMenuOpen(false)
  }

  const title = panel === 'templates' ? 'Templates' : panel === 'qr' ? 'QR code generate' : 'Анализ работ'

  return (
    <div className="flex min-h-svh bg-white text-slate-900">
      {menuOpen && (
        <button
          type="button"
          aria-label="Закрыть меню"
          className="fixed inset-0 z-20 bg-slate-950/40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div
        className={cn(
          'z-30 h-svh shrink-0 overflow-hidden bg-white transition-[width] duration-500 ease-in-out lg:sticky lg:top-0',
          menuOpen ? 'fixed inset-y-0 left-0 w-[248px] lg:static' : 'w-0',
        )}
      >
        <aside
          className={cn(
            'flex h-full w-[248px] flex-col border-r border-slate-100 bg-white px-4 py-5 transition-transform duration-500 ease-in-out',
            menuOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center gap-1 px-2">
            <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5">
              <img src={logoBell.src} alt="" className="size-9 object-contain" />
              <span className="truncate text-[17px] font-bold tracking-tight">Duwmejik</span>
            </Link>
            <button
              type="button"
              aria-label="Закрыть меню"
              onClick={() => setMenuOpen(false)}
              className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
            >
              <PanelLeftClose className="size-5" />
            </button>
          </div>

          <nav className="mt-8 grid gap-1">
            <MenuButton icon={LayoutGrid} active={panel === 'templates'} onClick={() => openPanel('templates')}>
              Templates
            </MenuButton>
            <MenuButton icon={QrCode} active={panel === 'qr'} onClick={() => openPanel('qr')}>
              QR code generate
            </MenuButton>
            <div className="my-3 border-t border-slate-200" />
            <MenuButton icon={BarChart3} active={panel === 'stats'} onClick={() => openPanel('stats')}>
              Анализ
            </MenuButton>
          </nav>

          <div className="mt-auto flex items-center gap-1 pt-4">
            <Link href="/account" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-1.5 hover:bg-slate-50">
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-600 text-xs font-semibold text-white">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="size-full object-cover" />
                ) : (
                  user.name
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0] ?? '')
                    .join('')
                    .toUpperCase()
                )}
              </span>
              <span className="truncate text-sm font-medium text-slate-800">{user.name}</span>
            </Link>
            <LanguageMenu direction="up" trigger="dots" />
          </div>
        </aside>
      </div>

      <div className={cn('flex min-h-svh min-w-0 flex-1 flex-col', panel === 'qr' && 'bg-surface')}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4 sm:px-6">
          <button
            type="button"
            aria-label="Открыть меню"
            onClick={() => setMenuOpen(true)}
            className={cn(
              'grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 lg:hidden',
              menuOpen && 'pointer-events-none opacity-0',
            )}
          >
            <PanelLeftOpen className="size-5" />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        </div>

        {panel === 'qr' ? (
          <QrGenerator />
        ) : panel === 'templates' ? (
          <div className="px-4 sm:px-6">
            <WorkList mine={mine} views={views} likes={likes} />
          </div>
        ) : (
          <section className="px-4 py-6 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="На проверке" value={String(counts.pending)} />
              <Stat label="Одобрено" value={String(counts.published)} />
              <Stat label="Отклонено" value={String(counts.rejected)} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Stat label="Просмотры" value={String(totalViews)} />
              <Stat label="Лайки" value={String(totalLikes)} />
              <Stat label="Скачивания" value={String(totalDownloads)} />
            </div>
            <WorkList mine={mine} views={views} likes={likes} />
          </section>
        )}
      </div>
    </div>
  )
}

function MenuButton({
  icon: Icon,
  active,
  onClick,
  children,
}: {
  icon: typeof LayoutGrid
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium',
        active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50',
      )}
    >
      <Icon className="size-5 shrink-0" />
      {children}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function WorkList({
  mine,
  views,
  likes,
}: {
  mine: Product[]
  views: Record<string, number>
  likes: Record<string, string[]>
}) {
  if (mine.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-500">Пока нет работ. Новый шаблон появится здесь после загрузки.</p>
  }

  return (
    <ul className="divide-y divide-slate-100">
      {mine.map((product) => (
        <li key={product.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-950">{product.title}</p>
            <p className="mt-1 text-sm text-slate-500">{statusText[product.status]}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-4" />
              {views[product.id] ?? 0}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-4" />
              {likeCount(likes, product.id)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
