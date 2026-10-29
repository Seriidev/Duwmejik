'use client'

import { useNoticeStore, type DesignerNotice } from '@/store/useNoticeStore'
import { cn } from '@/lib/cn'

export function NoticeBoard({ userId }: { userId: string }) {
  const items = useNoticeStore((state) => state.items)
  const mine = items.filter((item) => item.userId === userId)

  return (
    <div className="bg-[#f6f7fb] px-4 py-6 sm:px-6">
      {mine.length === 0 ? (
        <p className="rounded-[22px] bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_30px_rgba(20,24,40,0.04)]">
          Пока у вас нет сообщений.
        </p>
      ) : (
        <ul className="grid gap-3">
          {mine.map((item) => (
            <NoticeCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}

function NoticeCard({ item }: { item: DesignerNotice }) {
  const accepted = item.verdict === 'accepted'
  return (
    <li className={cn('rounded-[22px] bg-white px-5 py-4 shadow-[0_8px_30px_rgba(20,24,40,0.04)]', !item.read && 'ring-1 ring-blue-200')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', accepted ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600')}>
          {accepted ? 'Принято' : 'Отклонено'}
        </span>
        <time className="text-xs text-slate-400" dateTime={item.createdAt}>
          {stamp(item.createdAt)}
        </time>
      </div>
      <p className="mt-3 font-semibold text-slate-950">{item.title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
    </li>
  )
}

function stamp(iso: string) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}
