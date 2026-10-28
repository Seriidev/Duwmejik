'use client'

import { BarChart3, Bell, Eye, Heart, Images, LayoutGrid, PanelLeftOpen, QrCode, Upload, X } from 'lucide-react'
import cardPreview from '@/assets/card-preview.jpg'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Gate } from '@/components/Gate'
import { SideMenu } from '@/components/layout/SideMenu'
import { buttonClass } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { QrGenerator } from '@/features/catalog/QrGenerator'
import { NoticeBoard } from '@/features/seller/NoticeBoard'
import { UploadWork, type WorkSubmission } from '@/features/seller/UploadWork'
import { WorksBoard } from '@/features/seller/WorksBoard'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/useAuthStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { likeCount, useEngagementStore } from '@/store/useEngagementStore'
import { useNoticeStore } from '@/store/useNoticeStore'
import { useThemeStore } from '@/store/useThemeStore'
import type { Product, ProductStatus } from '@/types'

type Panel = 'works' | 'upload' | 'templates' | 'qr' | 'stats' | 'inbox'

const statusText: Record<ProductStatus, string> = {
  pending: 'На проверке',
  published: 'Одобрено',
  rejected: 'Отклонено',
}

export function SellerPage() {
  const user = useAuthStore((state) => state.user)
  const products = useCatalogStore((state) => state.products)
  const categories = useCatalogStore((state) => state.categories)
  const addProduct = useCatalogStore((state) => state.addProduct)
  const removeProduct = useCatalogStore((state) => state.removeProduct)
  const views = useEngagementStore((state) => state.views)
  const likes = useEngagementStore((state) => state.likes)
  const theme = useThemeStore((state) => state.theme)
  const notices = useNoticeStore((state) => state.items)
  const markAllRead = useNoticeStore((state) => state.markAllRead)
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>('works')
  const [uploadedAt, setUploadedAt] = useState<Record<string, string>>({})
  const [incomingFile, setIncomingFile] = useState<File | null>(null)
  const [notice, setNotice] = useState('')

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
  const inbox = notices.filter((item) => item.userId === user.id)
  const unread = inbox.filter((item) => !item.read).length
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

  function openInbox() {
    markAllRead(user.id)
    openPanel('inbox')
  }

  function openUpload(file?: File) {
    if (file) setIncomingFile(file)
    setNotice('')
    openPanel('upload')
  }

  function submitWork(draft: WorkSubmission) {
    const product = addProduct(
      {
        title: draft.title,
        description: draft.description,
        price: 0,
        categoryId: draft.categoryId,
        fileTypes: [draft.fileType],
        colors: [],
        style: 'minimal',
        orientation: 'landscape',
        license: 'personal',
        tags: draft.tags,
        image: draft.image,
        gallery: draft.gallery,
      },
      { author: user.name, authorId: user.id, status: 'pending' },
    )
    setUploadedAt((current) => ({ ...current, [product.id]: new Date().toISOString() }))
    setNotice('Работа отправлена на проверку')
    setIncomingFile(null)
    openPanel('works')
  }

  const title =
    panel === 'works'
      ? 'Мои работы'
      : panel === 'upload'
        ? 'Загрузить работу'
        : panel === 'templates'
          ? 'Templates'
          : panel === 'qr'
            ? 'QR code generate'
            : panel === 'inbox'
              ? 'Сообщения'
              : 'Анализ работ'

  return (
    <div className={cn('flex h-svh overflow-hidden text-slate-900 lg:gap-3 lg:p-3', theme === 'dark' ? 'bg-[#121212]' : 'bg-[#f3f3f4]')}>
      <SideMenu
        expanded={menuOpen}
        onToggle={() => setMenuOpen((open) => !open)}
        loginHref="/login?from=%2Fseller"
        items={[
          { id: 'templates', label: 'Templates', short: 'Templates', icon: LayoutGrid, active: panel === 'templates', onClick: () => openPanel('templates') },
          { id: 'qr', label: 'QR code generate', short: 'QR', icon: QrCode, active: panel === 'qr', onClick: () => openPanel('qr') },
          { id: 'stats', label: 'Анализ', short: 'Анализ', icon: BarChart3, active: panel === 'stats', separator: true, onClick: () => openPanel('stats') },
          { id: 'works', label: 'Мои работы', short: 'Работы', icon: Images, active: panel === 'works', onClick: () => openPanel('works') },
          { id: 'upload', label: 'Загрузить работу', short: 'Загрузить', icon: Upload, active: panel === 'upload', onClick: () => openUpload() },
        ]}
      />

      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:rounded-[28px]',
          panel === 'works' || panel === 'inbox' || panel === 'templates' ? 'bg-[#f6f7fb]' : panel === 'qr' ? 'bg-[#f4f7fb]' : 'bg-white',
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-4 sm:px-6 lg:rounded-t-[28px]">
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
          {panel === 'upload' ? <div className="min-w-0 flex-1" /> : <h1 className="min-w-0 flex-1 text-xl font-semibold tracking-tight">{title}</h1>}
          <button
            type="button"
            aria-label={unread > 0 ? `Сообщения, непрочитанных: ${unread}` : 'Сообщения'}
            onClick={openInbox}
            className={cn(
              'relative grid size-11 shrink-0 place-items-center rounded-full border',
              panel === 'inbox' ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800',
            )}
          >
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {panel === 'works' ? (
          <WorksBoard
            mine={mine}
            views={views}
            likes={likes}
            categories={categories}
            uploadedAt={uploadedAt}
            notice={notice}
            onOpenUpload={openUpload}
            onRemove={removeProduct}
          />
        ) : panel === 'upload' ? (
          <UploadWork
            categories={categories}
            initialFile={incomingFile}
            onConsumeFile={() => setIncomingFile(null)}
            onSubmit={submitWork}
          />
        ) : panel === 'inbox' ? (
          <NoticeBoard userId={user.id} />
        ) : panel === 'qr' ? (
          <QrGenerator />
        ) : panel === 'templates' ? (
          <TemplateCards products={products} />
        ) : (
          <section className="px-4 py-6 sm:px-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              <Stat label="На проверке" value={String(counts.pending)} />
              <Stat label="Одобрено" value={String(counts.published)} />
              <Stat label="Отклонено" value={String(counts.rejected)} />
              <Stat label="Просмотры" value={String(totalViews)} />
              <Stat label="Лайки" value={String(totalLikes)} />
              <Stat label="Скачивания" value={String(totalDownloads)} />
            </div>
            <WorkList mine={mine} views={views} likes={likes} />
          </section>
        )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-3 py-3 sm:px-4 sm:py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function TemplateCards({ products }: { products: Product[] }) {
  const [open, setOpen] = useState<Product | null>(null)
  const published = products.filter((item) => item.status === 'published')
  if (published.length === 0) {
    return <p className="px-6 py-16 text-center text-sm text-slate-500">В каталоге пока нет шаблонов.</p>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-3 sm:gap-4 sm:px-6 lg:grid-cols-4 xl:grid-cols-5">
        {published.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => setOpen(product)}
            className="relative aspect-square overflow-hidden rounded-[22px] bg-[#6f7874]"
          >
            <img src={cardPreview.src} alt="" className="size-full object-cover" />
          </button>
        ))}
      </div>
      <Modal open={Boolean(open)} title={open?.title ?? 'Шаблон'} onClose={() => setOpen(null)} wide bare>
        {open && (
          <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_0.9fr]">
            <div className="overflow-hidden rounded-[22px] bg-slate-900">
              <img src={cardPreview.src} alt="" className="aspect-square w-full object-cover" />
            </div>
            <div className="relative px-1 py-2 lg:px-3">
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="absolute top-1 right-0 grid size-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Закрыть окно"
              >
                <X className="size-5" />
              </button>
              <h3 className="pr-10 text-3xl font-semibold tracking-tight text-slate-950">{open.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{open.description}</p>
              <p className="mt-6 text-xs text-slate-400">Автор</p>
              <Link href={`/designer/${open.authorId}`} className="mt-1 block text-sm font-medium text-slate-800 hover:text-blue-600">
                {open.author}
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
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
