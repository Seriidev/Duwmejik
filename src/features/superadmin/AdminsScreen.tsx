'use client'

import { useMemo, useRef, useState } from 'react'
import { createId } from '@/lib/format'
import { putFile } from '@/lib/fileVault'
import { cn } from '@/lib/cn'
import { ADMIN_RIGHTS, SUPER_ONLY, useAdminRightsStore, type AdminRight } from '@/store/useAdminRightsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useFileStore } from '@/store/useFileStore'
import type { Role } from '@/types'

const COPY_LIMIT = 80 * 1024 * 1024
const PROTECTED = new Set(['u-admin', 'u-workshop', 'u-boss'])

export function AdminsScreen() {
  const user = useAuthStore((state) => state.user)
  const users = useAuthStore((state) => state.users)
  const addAdmin = useAuthStore((state) => state.addAdmin)
  const removeAdmin = useAuthStore((state) => state.removeAdmin)
  const files = useFileStore((state) => state.files)
  const send = useFileStore((state) => state.send)
  const rights = useAdminRightsStore((state) => state.admin)
  const toggle = useAdminRightsStore((state) => state.toggle)
  const matrixRef = useRef<HTMLElement>(null)
  const [focus, setFocus] = useState<'admin' | 'superadmin' | null>(null)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [formNote, setFormNote] = useState('')
  const [sendTo, setSendTo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [comment, setComment] = useState('')
  const [sendNote, setSendNote] = useState('')
  const [sending, setSending] = useState(false)
  const [confirmId, setConfirmId] = useState('')

  const staff = useMemo(() => {
    const order = (id: string) => (id === 'u-admin' ? 0 : id === 'u-workshop' ? 1 : id === 'u-boss' ? 3 : 2)
    return users
      .filter((item) => item.role === 'admin' || item.role === 'superadmin')
      .slice()
      .sort((a, b) => order(a.id) - order(b.id) || a.name.localeCompare(b.name, 'ru'))
  }, [users])

  const recipient = staff.find((item) => item.id === sendTo && item.id !== user?.id) ?? null

  function showRights(role: Role) {
    const column = role === 'superadmin' ? 'superadmin' : 'admin'
    setFocus(column)
    matrixRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function createAdmin() {
    const error = addAdmin(name, email)
    if (error) {
      setFormNote(error)
      return
    }
    setFormNote(`Аккаунт создан. Вход по почте ${email.trim().toLowerCase()} и паролю администраторов.`)
    setName('')
    setEmail('')
  }

  async function deliver() {
    if (!user || !recipient || !file || sending) return
    setSending(true)
    setSendNote('')
    const fileId = createId('file')
    const stored = file.size <= COPY_LIMIT
    try {
      if (stored) await putFile(fileId, file)
      send({
        id: fileId,
        name: file.name,
        size: file.size,
        fromId: user.id,
        fromName: user.name,
        toId: recipient.id,
        toName: recipient.name,
        note: comment.trim() || undefined,
        stored,
      })
      setSendNote(
        stored
          ? `«${file.name}» отправлен ${recipient.name}. Файл лежит во входящих.`
          : `«${file.name}» больше 80 МБ: запись есть, копии на этом устройстве нет.`,
      )
      setFile(null)
      setComment('')
    } catch {
      setSendNote('Не удалось сохранить файл на этом устройстве.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#0e1116]">Администраторы</h1>
          <p className="mt-1 text-sm text-[#5b6472]">admin1 и admin2 сидят за одним столом. Панель суперадмина остаётся у руководителя.</p>
        </div>
        <button type="button" onClick={() => { setAdding((value) => !value); setFormNote('') }} className="h-10 rounded-[10px] bg-[#6d3ef2] px-4 text-sm font-semibold text-white">
          Добавить администратора
        </button>
      </div>

      {adding && (
        <form
          className="mt-4 grid gap-3 rounded-2xl border border-[#e4e7ec] bg-white p-5 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            createAdmin()
          }}
        >
          <label className="grid gap-1 text-xs font-semibold text-[#5b6472]">
            Имя
            <input value={name} onChange={(event) => setName(event.target.value)} className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm font-normal text-[#0e1116] outline-none focus:border-[#6d3ef2]" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-[#5b6472]">
            Почта
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm font-normal text-[#0e1116] outline-none focus:border-[#6d3ef2]" />
          </label>
          <button type="submit" className="h-10 self-end rounded-[10px] bg-[#0e1116] px-4 text-sm font-semibold text-white">
            Создать
          </button>
          <p className="text-xs leading-5 text-[#5b6472] sm:col-span-3">
            Роль одна: администратор, с теми же правами, что у admin1 и admin2. Вход на странице «Войти» по указанной почте и паролю администраторов.
            {formNote && <span className="mt-1 block font-medium text-[#0e1116]">{formNote}</span>}
          </p>
        </form>
      )}

      <div className="mt-5 grid grid-cols-3 gap-4">
        {staff.map((person) => {
          const sent = files.filter((item) => item.fromId === person.id).length
          const received = files.filter((item) => item.toId === person.id).length
          const seat = seatOf(person.id)
          const mine = person.id === user?.id
          return (
            <article key={person.id} className="flex flex-col rounded-2xl border border-[#e4e7ec] bg-white p-5">
              <div className="flex items-center gap-3">
                <span className={cn('grid size-12 place-items-center rounded-full text-base font-bold', person.role === 'superadmin' ? 'bg-[#14161c] text-white' : 'bg-[#efe9ff] text-[#4f26c9]')}>
                  {person.avatar ? <img src={person.avatar} alt="" className="size-full rounded-full object-cover" /> : person.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-[#0e1116]">{person.role === 'superadmin' ? 'Суперадмин' : 'Администратор'}</h2>
                  {!PROTECTED.has(person.id) && <p className="truncate text-xs text-[#8a93a1]">{person.email}</p>}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#5b6472]">{about(person.id, person.role)}</p>
              {seat && <p className="mt-1 text-xs font-medium text-[#4f26c9]">{seat}</p>}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Stat label="Отправлено" value={sent} />
                <Stat label="Получено" value={received} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => showRights(person.role)} className="h-10 rounded-[10px] border border-[#e4e7ec] text-sm font-semibold text-[#0e1116]">
                  Права
                </button>
                <button
                  type="button"
                  disabled={mine}
                  onClick={() => {
                    setSendTo(person.id)
                    setSendNote('')
                    setFile(null)
                  }}
                  className="h-10 rounded-[10px] bg-[#6d3ef2] text-sm font-semibold text-white disabled:bg-[#efe9ff] disabled:text-[#8a93a1]"
                >
                  Передать файл
                </button>
              </div>
              {!PROTECTED.has(person.id) && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirmId !== person.id) {
                      setConfirmId(person.id)
                      return
                    }
                    const error = removeAdmin(person.id)
                    setFormNote(error ?? `${person.name} убран из администраторов.`)
                    setConfirmId('')
                    if (sendTo === person.id) setSendTo('')
                  }}
                  className="mt-3 text-left text-xs font-semibold text-[#d92d3a]"
                >
                  {confirmId === person.id ? 'Подтвердить удаление' : 'Убрать'}
                </button>
              )}
            </article>
          )
        })}
      </div>

      {recipient && (
        <section className="mt-4 rounded-2xl border border-[#e4e7ec] bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Файл для {recipient.name}</h2>
              <p className="mt-1 text-sm text-[#5b6472]">{recipient.email}</p>
            </div>
            <button type="button" onClick={() => setSendTo('')} className="text-sm text-[#5b6472]">
              Закрыть
            </button>
          </div>
          <label className="mt-4 grid gap-1 text-xs font-semibold text-[#5b6472]">
            Файл
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="text-sm font-normal text-[#0e1116] file:mr-3 file:h-9 file:rounded-[10px] file:border-0 file:bg-[#efe9ff] file:px-3 file:text-sm file:font-semibold file:text-[#4f26c9]"
            />
          </label>
          <label className="mt-3 grid gap-1 text-xs font-semibold text-[#5b6472]">
            Комментарий
            <input value={comment} onChange={(event) => setComment(event.target.value)} className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm font-normal text-[#0e1116] outline-none focus:border-[#6d3ef2]" />
          </label>
          <button type="button" disabled={!file || sending} onClick={deliver} className="mt-4 h-10 rounded-[10px] bg-[#6d3ef2] px-4 text-sm font-semibold text-white disabled:bg-[#efe9ff] disabled:text-[#8a93a1]">
            {sending ? 'Отправка…' : 'Отправить файл'}
          </button>
          {sendNote && <p className="mt-3 text-sm text-[#5b6472]">{sendNote}</p>}
        </section>
      )}

      <section ref={matrixRef} id="admin-rights" className="mt-6 scroll-mt-6 overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white">
        <div className="border-b border-[#e4e7ec] px-5 py-4">
          <h2 className="text-base font-semibold">Права</h2>
          <p className="mt-1 text-sm text-[#5b6472]">Галочки администратора общие для admin1, admin2 и новых администраторов. Колонка суперадмина закреплена.</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-[#5b6472]">
            <tr>
              <th className="px-5 py-3 font-medium">Возможность</th>
              <th className={cn('px-5 py-3 font-medium', focus === 'admin' && 'bg-[#efe9ff] text-[#4f26c9]')}>Администратор</th>
              <th className={cn('px-5 py-3 font-medium', focus === 'superadmin' && 'bg-[#efe9ff] text-[#4f26c9]')}>Суперадмин</th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_RIGHTS.map((item) => (
              <tr key={item.id} className="border-t border-[#e4e7ec]">
                <td className="px-5 py-3 font-medium text-[#0e1116]">{item.label}</td>
                <td className={cn('px-5 py-3', focus === 'admin' && 'bg-[#efe9ff]')}>
                  <button type="button" onClick={() => toggle(item.id)} className="font-semibold text-[#4f26c9]">
                    {rights[item.id] ? '✓' : '—'}
                  </button>
                </td>
                <td className={cn('px-5 py-3 text-[#12a150]', focus === 'superadmin' && 'bg-[#efe9ff]')}>✓</td>
              </tr>
            ))}
            {SUPER_ONLY.map((item) => (
              <tr key={item.id} className="border-t border-[#e4e7ec]">
                <td className="px-5 py-3 font-medium text-[#0e1116]">{item.label}</td>
                <td className={cn('px-5 py-3 text-[#8a93a1]', focus === 'admin' && 'bg-[#efe9ff]')}>—</td>
                <td className={cn('px-5 py-3 text-[#12a150]', focus === 'superadmin' && 'bg-[#efe9ff]')}>✓</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] bg-[#f6f7f9] px-3 py-2">
      <p className="text-lg font-bold text-[#0e1116]">{value}</p>
      <p className="text-xs text-[#5b6472]">{label}</p>
    </div>
  )
}

function seatOf(id: string) {
  if (id === 'u-admin') return '/admin1'
  if (id === 'u-workshop') return '/admin2'
  if (id === 'u-boss') return '/superadmin'
  return ''
}

function about(id: string, role: Role) {
  if (role === 'superadmin') return 'Цены, отчёты, бухгалтерия, баннеры и отметка лучшего дизайнера.'
  if (id === 'u-admin') return 'Заказы, выдача, файлы, шаблоны и заявки дизайнеров.'
  if (id === 'u-workshop') return 'Тот же стол, что у admin1.'
  return 'Тот же стол, что у admin1 и admin2.'
}
