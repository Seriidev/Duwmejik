'use client'

import { useMemo, useState } from 'react'
import { useAccountStore } from '@/store/useAccountStore'
import { useAuthStore } from '@/store/useAuthStore'
import { activeMarks, bestLabel, bestMessage, untilFor, useBestStore, type BestTerm } from '@/store/useBestStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { useEngagementStore } from '@/store/useEngagementStore'
import { useNoticeStore } from '@/store/useNoticeStore'
import { cn } from '@/lib/cn'

type Row = {
  id: string
  name: string
  works: number
  orders: number
  views: number
  rating: number | null
  account: boolean
}

const terms: { id: BestTerm; label: string }[] = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'forever', label: 'Навсегда' },
]

export function DesignersScreen() {
  const products = useCatalogStore((state) => state.products)
  const orders = useAccountStore((state) => state.orders)
  const views = useEngagementStore((state) => state.views)
  const users = useAuthStore((state) => state.users)
  const marks = useBestStore((state) => state.marks)
  const mark = useBestStore((state) => state.mark)
  const clear = useBestStore((state) => state.clear)
  const push = useNoticeStore((state) => state.push)
  const [query, setQuery] = useState('')
  const [onlyBest, setOnlyBest] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [term, setTerm] = useState<BestTerm>('month')
  const [notify, setNotify] = useState(true)
  const [showOnHome, setShowOnHome] = useState(true)
  const [badge, setBadge] = useState(true)
  const [note, setNote] = useState('')

  const live = activeMarks(marks)
  const bestOf = (id: string) => live.find((item) => item.designerId === id)

  const rows = useMemo(() => {
    const ids = new Map<string, string>()
    for (const product of products) ids.set(product.authorId, product.author)
    for (const user of users) {
      if (user.role === 'seller') ids.set(user.id, user.name)
    }
    return [...ids.entries()]
      .map(([id, name]): Row => {
        const own = products.filter((item) => item.authorId === id)
        const published = own.filter((item) => item.status === 'published')
        const rated = published.filter((item) => item.rating > 0)
        const productIds = new Set(own.map((item) => item.id))
        return {
          id,
          name,
          works: published.length,
          orders: orders.filter((order) => order.productId && productIds.has(order.productId) && order.status !== 'cancelled').length,
          views: published.reduce((sum, item) => sum + (views[item.id] ?? 0) + Math.round(item.downloads * 0.18), 0),
          rating: rated.length ? rated.reduce((sum, item) => sum + item.rating, 0) / rated.length : null,
          account: users.some((user) => user.id === id),
        }
      })
      .sort((a, b) => b.works - a.works || a.name.localeCompare(b.name, 'ru'))
  }, [orders, products, users, views])

  const shown = rows.filter((row) => {
    if (onlyBest && !bestOf(row.id)) return false
    const needle = query.trim().toLowerCase()
    return !needle || row.name.toLowerCase().includes(needle)
  })
  const opened = rows.find((row) => row.id === openId) ?? null

  function open(row: Row) {
    const current = bestOf(row.id)
    setOpenId(row.id)
    setTerm(current?.term ?? 'month')
    setNotify(current?.notify ?? true)
    setShowOnHome(current?.showOnHome ?? true)
    setBadge(current?.badge ?? true)
    setNote('')
  }

  function confirm() {
    if (!opened) return
    const until = untilFor(term)
    mark({ designerId: opened.id, name: opened.name, term, until, notify, showOnHome, badge })
    if (notify && opened.account) {
      push({
        userId: opened.id,
        productId: '',
        title: bestLabel(term),
        verdict: 'best',
        message: bestMessage(term),
      })
      setNote(`${opened.name} получит уведомление: «${bestMessage(term)}»`)
    } else if (notify) {
      setNote('Отметка сохранена. У этого дизайнера нет аккаунта, уведомление некуда отправить.')
    } else {
      setNote('Отметка сохранена без уведомления.')
    }
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight text-[#0e1116]">Дизайнеры</h1>
      <p className="mt-1 text-sm text-[#5b6472]">Работы, заказы по их макетам и отметка лучшего. Срок снимает отметку сам.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по имени"
          className="h-10 w-64 rounded-[10px] border border-[#e4e7ec] bg-white px-3 text-sm outline-none focus:border-[#6d3ef2]"
        />
        <div className="flex rounded-[10px] bg-[#efe9ff] p-1">
          <Filter active={!onlyBest} onClick={() => setOnlyBest(false)}>
            Все
          </Filter>
          <Filter active={onlyBest} onClick={() => setOnlyBest(true)}>
            Лучшие
          </Filter>
        </div>
      </div>

      <div className={cn('mt-4 grid items-start gap-4', opened && 'xl:grid-cols-[minmax(0,1fr)_320px]')}>
        <div className="overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f6f7f9] text-xs text-[#5b6472]">
              <tr>
                {['Дизайнер', 'Работ', 'Заказов', 'Просмотры', 'Рейтинг', 'Статус', ''].map((label) => (
                  <th key={label || 'bell'} className="px-4 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => {
                const best = bestOf(row.id)
                return (
                  <tr key={row.id} className="border-t border-[#e4e7ec]">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-full bg-[#efe9ff] text-xs font-bold text-[#4f26c9]">
                          {row.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="font-semibold text-[#0e1116]">{row.name}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.works}</td>
                    <td className="px-4 py-3">{row.orders}</td>
                    <td className="px-4 py-3">{row.views.toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3">{row.rating == null ? '—' : row.rating.toFixed(1).replace('.', ',')}</td>
                    <td className="px-4 py-3">
                      {best ? (
                        <span className="inline-flex rounded-full bg-[#efe9ff] px-2.5 py-1 text-xs font-semibold text-[#4f26c9]">{bestLabel(best.term)}</span>
                      ) : (
                        <span className="text-[#8a93a1]">Дизайнер</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => open(row)}
                        aria-label={`Отметить ${row.name}`}
                        className={cn(
                          'relative grid size-9 place-items-center rounded-[10px]',
                          best ? 'bg-[#6d3ef2] text-white' : 'bg-[#f6f7f9] text-[#5b6472] hover:bg-[#efe9ff]',
                        )}
                      >
                        <Bell filled={Boolean(best)} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#8a93a1]">
                    {onlyBest ? 'Сейчас никто не отмечен лучшим.' : 'Такого дизайнера нет.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {opened && (
          <aside className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8a93a1]">Колокольчик</p>
                <h2 className="mt-1 text-lg font-bold text-[#0e1116]">{opened.name}</h2>
              </div>
              <button type="button" onClick={() => setOpenId(null)} className="text-sm text-[#5b6472]">
                Закрыть
              </button>
            </div>
            <p className="mt-3 text-sm text-[#5b6472]">
              {opened.works} работ · {opened.orders} заказов · рейтинг {opened.rating == null ? '—' : opened.rating.toFixed(1).replace('.', ',')}
            </p>
            <p className="mt-4 text-xs font-semibold text-[#5b6472]">Срок</p>
            <div className="mt-2 flex rounded-[10px] bg-[#efe9ff] p-1">
              {terms.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTerm(item.id)}
                  className={cn('h-8 flex-1 rounded-[8px] text-xs font-semibold', term === item.id ? 'bg-white text-[#4f26c9]' : 'text-[#5b6472]')}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3">
              <Toggle on={notify} onClick={() => setNotify((value) => !value)} label="Отправить уведомление" />
              <Toggle on={showOnHome} onClick={() => setShowOnHome((value) => !value)} label="Показать в Топ дизайнеров на главной" />
              <Toggle on={badge} onClick={() => setBadge((value) => !value)} label="Выделить бейджем в профиле" />
            </div>
            <button type="button" onClick={confirm} className="mt-5 h-10 w-full rounded-[10px] bg-[#6d3ef2] text-sm font-semibold text-white">
              Отметить лучшим
            </button>
            {bestOf(opened.id) && (
              <button
                type="button"
                onClick={() => {
                  clear(opened.id)
                  setNote('Отметка снята.')
                }}
                className="mt-2 h-10 w-full rounded-[10px] text-sm font-semibold text-[#d92d3a]"
              >
                Снять отметку
              </button>
            )}
            {note && <p className="mt-3 text-xs leading-5 text-[#5b6472]">{note}</p>}
          </aside>
        )}
      </div>
    </div>
  )
}

function Filter({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('h-8 rounded-[8px] px-3 text-xs font-semibold', active ? 'bg-white text-[#4f26c9]' : 'text-[#5b6472]')}>
      {children}
    </button>
  )
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center justify-between gap-3 text-left">
      <span className="text-sm text-[#0e1116]">{label}</span>
      <span className={cn('relative h-6 w-10 shrink-0 rounded-full', on ? 'bg-[#6d3ef2]' : 'bg-[#e4e7ec]')}>
        <span className={cn('absolute top-0.5 size-5 rounded-full bg-white', on ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  )
}

function Bell({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7" strokeLinejoin="round" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  )
}
