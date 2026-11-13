'use client'

import { Check } from 'lucide-react'
import { useState } from 'react'
import { TemplateArt } from '@/components/TemplateArt'
import { formatPrice, plural } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { AccountUser, Category, DesignerRequest, Product } from '@/types'

type Group = 'pending' | 'designers' | 'rejected'

const GROUPS: { id: Group; label: string }[] = [
  { id: 'pending', label: 'Заявки' },
  { id: 'designers', label: 'Дизайнеры' },
  { id: 'rejected', label: 'Отклонены' },
]

const ACCESS = [
  { title: 'Загружать свои работы', text: 'В личном кабинете дизайнера' },
  { title: 'Редактировать свои работы', text: 'До отправки на проверку' },
  { title: 'Отправлять на модерацию', text: 'Публикация — только после проверки' },
]

export function DesignersDesk({
  users,
  products,
  categories,
  onReview,
}: {
  users: AccountUser[]
  products: Product[]
  categories: Category[]
  onReview: (id: string, approve: boolean, note: string) => string | null
}) {
  const [group, setGroup] = useState<Group>('pending')
  const [pickedId, setPickedId] = useState<string | null>(null)
  const todayTitle = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).replace(' г.', '')
  const pending = users.filter((item) => item.designerRequest?.status === 'pending')
  const designers = users.filter((item) => item.role === 'seller')
  const rejected = users.filter((item) => item.designerRequest?.status === 'rejected')
  const lists: Record<Group, AccountUser[]> = {
    pending: [...pending].sort((a, b) => (b.designerRequest?.createdAt ?? '').localeCompare(a.designerRequest?.createdAt ?? '')),
    designers: [...designers].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    rejected: [...rejected].sort((a, b) => (b.designerRequest?.createdAt ?? '').localeCompare(a.designerRequest?.createdAt ?? '')),
  }
  const people = lists[group]
  const opened = people.find((item) => item.id === pickedId) ?? people[0] ?? null
  const counts: Record<Group, number> = { pending: pending.length, designers: designers.length, rejected: rejected.length }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Дизайнеры</h1>
        <p className="pb-1 text-sm text-neutral-400">{todayTitle}</p>
      </div>
      <div className="mt-6 inline-flex flex-wrap gap-1 rounded-xl bg-white p-1">
        {GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setGroup(item.id)
              setPickedId(null)
            }}
            className={cn('rounded-lg px-3 py-1.5 text-sm', group === item.id ? 'bg-[#5b4dff] font-medium text-white' : 'text-neutral-600 hover:bg-neutral-50')}
          >
            {item.label} · {counts[item.id]}
          </button>
        ))}
      </div>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-neutral-200 bg-white p-3">
          <h2 className="px-2 py-2 text-sm font-semibold">{group === 'pending' ? 'Ожидают решения' : group === 'designers' ? 'Дизайнеры' : 'Отклонённые'}</h2>
          {people.length === 0 ? (
            <p className="px-2 py-8 text-sm text-neutral-400">{group === 'pending' ? 'Новых заявок нет.' : group === 'designers' ? 'Дизайнеров пока нет.' : 'Отклонённых заявок нет.'}</p>
          ) : (
            <ul className="grid gap-2">
              {people.map((person) => {
                const active = opened?.id === person.id
                return (
                  <li key={person.id}>
                    <button
                      type="button"
                      onClick={() => setPickedId(person.id)}
                      className={cn('w-full rounded-xl px-3 py-3 text-left', active ? 'bg-[#f4f0ff]' : 'hover:bg-neutral-50')}
                    >
                      <p className="font-medium">{person.name}</p>
                      <p className="mt-0.5 text-sm text-neutral-500">{personLine(person)}</p>
                      {person.designerRequest?.createdAt && <p className="mt-1 text-xs text-neutral-400">{whenLabel(person.designerRequest.createdAt)}</p>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          {opened ? (
            <PersonDetails
              key={opened.id}
              person={opened}
              works={products.filter((item) => item.authorId === opened.id)}
              categories={categories}
              onReview={onReview}
            />
          ) : (
            <p className="py-16 text-center text-sm text-neutral-400">Выберите человека слева.</p>
          )}
        </section>
      </div>
    </div>
  )
}

function PersonDetails({
  person,
  works,
  categories,
  onReview,
}: {
  person: AccountUser
  works: Product[]
  categories: Category[]
  onReview: (id: string, approve: boolean, note: string) => string | null
}) {
  const request = person.designerRequest
  const pending = request?.status === 'pending'
  const rejected = request?.status === 'rejected'
  const [note, setNote] = useState(request?.note ?? '')
  const [error, setError] = useState('')
  const featured = works[0]
  const contact = [person.email, person.phone].filter(Boolean).join(' · ')

  function review(approve: boolean) {
    const message = onReview(person.id, approve, note)
    setError(message ?? '')
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">{person.name}</h2>
          <p className="mt-1 text-sm text-neutral-400">{contact || 'Контактов нет'}</p>
        </div>
        <span className={cn('inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', pending ? 'bg-amber-50 text-amber-600' : rejected ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')}>
          {pending ? 'Новая заявка' : rejected ? 'Отклонена' : 'Дизайнер'}
        </span>
      </div>
      {person.handle && <p className="mt-2 text-sm text-neutral-500">{person.handle}</p>}
      {request?.about && <p className="mt-4 text-sm leading-6 text-neutral-700">«{request.about}»</p>}
      {rejected && request?.note && <p className="mt-3 text-sm text-rose-600">Причина: {request.note}</p>}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <h3 className="text-sm font-semibold">Портфолио</h3>
          {featured ? (
            <article className="mt-3 rounded-2xl border border-neutral-200 p-3">
              {featured.image ? (
                <img src={featured.image} alt="" className="h-40 w-full rounded-xl object-cover" />
              ) : (
                <TemplateArt categoryId={featured.categoryId} accent={featured.accent} seed={featured.seed} className="h-40 w-full rounded-xl" />
              )}
              <p className="mt-3 font-medium">{featured.title}</p>
              <p className="mt-2 text-sm text-neutral-500">
                {formatPrice(featured.price)} · {categories.find((item) => item.id === featured.categoryId)?.title ?? 'Без категории'}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                {featured.downloads} {plural(featured.downloads, 'скачивание', 'скачивания', 'скачиваний')}
              </p>
            </article>
          ) : (
            <p className="mt-3 rounded-2xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-400">Работ пока нет.</p>
          )}
          {works.length > 1 && (
            <ul className="mt-3 grid gap-1">
              {works.slice(1).map((work) => (
                <li key={work.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm">
                  <span className="min-w-0 truncate">{work.title}</span>
                  <span className="shrink-0 text-neutral-400">{formatPrice(work.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {pending && (
          <div>
            <h3 className="text-sm font-semibold">Разрешения после одобрения</h3>
            <ul className="mt-3 grid gap-2">
              {ACCESS.map((item) => (
                <li key={item.title} className="rounded-xl bg-neutral-50 px-3 py-2.5">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Check className="size-4 text-[#5b4dff]" />
                    {item.title}
                  </p>
                  <p className="mt-0.5 pl-6 text-xs text-neutral-400">{item.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-xl bg-[#f4f0ff] px-3 py-3 text-sm leading-5 text-[#5b4dff]">
              Доступ только к своим работам. Без доступа к заказам, файлам команды и настройкам администратора.
            </p>
          </div>
        )}
      </div>

      {pending && (
        <div className="mt-5">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Сообщение дизайнеру</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Например: добавьте ссылку на портфолио"
              className="min-h-20 resize-y rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none"
            />
          </label>
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => review(true)} className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:brightness-110">
              Одобрить и открыть доступ
            </button>
            <button type="button" onClick={() => review(false)} className="h-11 rounded-xl border border-neutral-200 px-5 text-sm font-medium hover:bg-neutral-50">
              Отклонить заявку
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function personLine(person: AccountUser) {
  const request: DesignerRequest | undefined = person.designerRequest
  if (request?.specialty) return request.specialty
  return [person.handle, person.city].filter(Boolean).join(' · ') || person.email
}

function whenLabel(iso: string) {
  const date = new Date(iso)
  const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return `Сегодня, ${time}`
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return `Вчера, ${time}`
  const day = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date).replace('.', '')
  return `${day}, ${time}`
}
