'use client'

import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { createId } from '@/lib/format'
import { cn } from '@/lib/cn'
import { deleteFile, getFile, putFile } from '@/lib/fileVault'
import { useAuthStore } from '@/store/useAuthStore'
import { useFileStore, type SharedFile } from '@/store/useFileStore'
import type { Role } from '@/types'

const STAFF: Role[] = ['admin', 'superadmin']
const LOCAL_COPY_LIMIT = 80 * 1024 * 1024

type Job = {
  id: string
  fileId: string
  name: string
  size: number
  loaded: number
  toName: string
  paused: boolean
  started: number
  note: string
}

export function FilesPanel() {
  const user = useAuthStore((state) => state.user)
  const users = useAuthStore((state) => state.users)
  const files = useFileStore((state) => state.files)
  const send = useFileStore((state) => state.send)
  const markDownloaded = useFileStore((state) => state.markDownloaded)
  const remove = useFileStore((state) => state.remove)
  const staff = users.filter((item) => item.id !== user?.id && STAFF.includes(item.role))
  const [target, setTarget] = useState('')
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState<File[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [box, setBox] = useState<'in' | 'out'>('in')
  const [over, setOver] = useState(false)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const gates = useRef(new Map<string, { paused: boolean; stop: boolean }>())
  const recipient = staff.some((item) => item.id === target) ? target : staff[0]?.id ?? ''
  const person = staff.find((item) => item.id === recipient)
  const incoming = files.filter((item) => item.toId === user?.id)
  const waiting = incoming.filter((item) => !item.downloaded)
  const outgoing = files.filter((item) => item.fromId === user?.id)
  const shown = box === 'in' ? incoming : outgoing
  const todayTitle = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).replace(' г.', '')

  useEffect(() => {
    let stop = false
    const pending = files.filter((item) => item.toId === user?.id && !item.downloaded && item.stored !== false && !jobs.some((job) => job.fileId === item.id))
    if (pending.length === 0) return
    Promise.all(pending.map(async (item) => ({ id: item.id, blob: await getFile(item.id) }))).then((rows) => {
      if (stop) return
      for (const row of rows) {
        if (!row.blob) remove(row.id)
      }
    })
    return () => {
      stop = true
    }
  }, [files, jobs, remove, user?.id])

  function addFiles(list: FileList | File[] | null) {
    const next = [...(list ?? [])]
    if (next.length === 0) return
    setPicked((current) => [...current, ...next])
    setError('')
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setOver(false)
    addFiles(event.dataTransfer.files)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user || !person) return setError('Некому отправить: второго админа ещё нет')
    if (picked.length === 0) return setError('Выберите файл')
    const batch = picked
    const comment = note.trim()
    setPicked([])
    setNote('')
    if (inputRef.current) inputRef.current.value = ''
    setError('')
    await Promise.all(batch.map((file) => transfer(file, person.id, person.name, user.id, user.name, comment)))
  }

  async function transfer(file: File, toId: string, toName: string, fromId: string, fromName: string, comment: string) {
    const fileId = createId('file')
    if (file.size > LOCAL_COPY_LIMIT) {
      send({ id: fileId, name: file.name, size: file.size, fromId, fromName, toId, toName, note: comment || undefined, stored: false })
      return
    }
    const jobId = createId('job')
    const gate = { paused: false, stop: false }
    gates.current.set(jobId, gate)
    const started = Date.now()
    setJobs((current) => [...current, { id: jobId, fileId, name: file.name, size: file.size, loaded: 0, toName, paused: false, started, note: comment }])
    const reader = file.stream().getReader()
    const chunks: BlobPart[] = []
    let loaded = 0
    let stored = false
    try {
      while (true) {
        if (gate.stop) {
          await reader.cancel()
          return
        }
        if (gate.paused) {
          await new Promise((resolve) => setTimeout(resolve, 160))
          continue
        }
        const step = await reader.read()
        if (step.done) break
        chunks.push(step.value)
        loaded += step.value.byteLength
        setJobs((current) => current.map((item) => (item.id === jobId ? { ...item, loaded } : item)))
      }
      await putFile(fileId, new Blob(chunks, { type: file.type || 'application/octet-stream' }))
      stored = true
      send({ id: fileId, name: file.name, size: file.size, fromId, fromName, toId, toName, note: comment || undefined, stored: true })
    } catch {
      if (stored) deleteFile(fileId).catch(() => undefined)
      setError(`Не удалось сохранить «${file.name}»`)
    } finally {
      gates.current.delete(jobId)
      setJobs((current) => current.filter((item) => item.id !== jobId))
    }
  }

  async function download(item: SharedFile) {
    setSavingId(item.id)
    try {
      const blob = await getFile(item.id)
      if (!blob) {
        remove(item.id)
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = item.name
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1500)
      await deleteFile(item.id)
      markDownloaded(item.id)
    } catch {
      return
    } finally {
      setSavingId('')
    }
  }

  function togglePause(id: string) {
    const gate = gates.current.get(id)
    if (!gate) return
    gate.paused = !gate.paused
    setJobs((current) => current.map((item) => (item.id === id ? { ...item, paused: gate.paused } : item)))
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Файлы</h1>
        <p className="pb-1 text-sm text-neutral-400">{todayTitle}</p>
      </div>

      <form onSubmit={submit} className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Новая передача</h2>
        {user && (
          <p className="mt-1 text-sm text-neutral-400">
            Вы вошли как {staffTitle(user)}
          </p>
        )}
        <div className="mt-4">
          <p className="text-sm text-neutral-500">Получатель</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {staff.length === 0 && <p className="text-sm text-neutral-400">Нет получателя</p>}
            {staff.map((item) => {
              const active = item.id === recipient
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTarget(item.id)}
                  className={cn(
                    'h-10 rounded-xl px-4 text-sm font-medium',
                    active ? 'bg-[#5b4dff] text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
                  )}
                >
                  {staffTitle(item)}
                </button>
              )
            })}
          </div>
        </div>
        <div
          onDragOver={(event) => {
            event.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={cn('mt-4 grid min-h-36 place-items-center rounded-2xl bg-[#f4f0ff] px-4 py-6 text-center', over && 'ring-2 ring-[#5b4dff]')}
        >
          <div>
            <p className="text-sm font-semibold text-[#5b4dff]">Перетащите файлы сюда</p>
            <p className="mt-1 text-xs text-[#8b82c9]">Архивы, исходники и макеты большого размера</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 h-9 rounded-lg bg-white px-4 text-sm font-medium text-neutral-800 shadow-sm">
              Выбрать файлы
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files)
                event.target.value = ''
              }}
            />
            {picked.length > 0 && (
              <p className="mt-3 text-xs text-neutral-500">
                {picked.map((file) => file.name).join(', ')} · {formatSize(picked.reduce((sum, file) => sum + file.size, 0))}
              </p>
            )}
          </div>
        </div>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={80}
          placeholder="Короткий комментарий"
          className="mt-4 h-11 w-full rounded-xl bg-neutral-100 px-3 text-sm outline-none placeholder:text-neutral-400"
        />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button type="submit" className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:brightness-110">
            Отправить файлы
          </button>
          <p className="text-sm text-neutral-400">Передача с возобновлением загрузки</p>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </form>

      {jobs.map((job) => {
        const percent = job.size === 0 ? 100 : Math.min(100, Math.round((job.loaded / job.size) * 100))
        const elapsed = Math.max(0.2, (Date.now() - job.started) / 1000)
        const rate = job.loaded / elapsed
        const left = rate > 0 ? (job.size - job.loaded) / rate : 0
        return (
          <section key={job.id} className="mt-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{job.name}</p>
                <p className="mt-1 text-sm text-neutral-400">
                  {formatSize(job.size)} · {personLabel(users, '', job.toName)} · загружено {formatSize(job.loaded)}
                </p>
              </div>
              <p className="shrink-0 text-sm text-neutral-500">
                {percent}%{left > 8 && !job.paused ? ` · ${eta(left)}` : ''}
                {job.paused ? ' · пауза' : ''}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#efeaff]">
                <div className="h-full rounded-full bg-[#5b4dff]" style={{ width: `${percent}%` }} />
              </div>
              <button type="button" onClick={() => togglePause(job.id)} className="h-9 shrink-0 rounded-xl border border-neutral-200 px-4 text-sm font-medium hover:bg-neutral-50">
                {job.paused ? 'Дальше' : 'Пауза'}
              </button>
            </div>
          </section>
        )
      })}

      <section className="mt-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Файлы команды</h2>
          <div className="flex rounded-xl bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => setBox('in')}
              className={cn('h-8 rounded-lg px-3 text-sm', box === 'in' ? 'bg-[#5b4dff] font-medium text-white' : 'text-neutral-600')}
            >
              Входящие · {waiting.length}
            </button>
            <button
              type="button"
              onClick={() => setBox('out')}
              className={cn('h-8 rounded-lg px-3 text-sm', box === 'out' ? 'bg-[#5b4dff] font-medium text-white' : 'text-neutral-600')}
            >
              Отправленные
            </button>
          </div>
        </div>
        {shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-400">{box === 'in' ? 'Входящих файлов нет.' : 'Вы ещё ничего не отправляли.'}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs text-neutral-400">
                <tr>
                  <th className="py-2 font-medium">Файл</th>
                  <th className="px-3 py-2 font-medium">Отправитель → получатель</th>
                  <th className="px-3 py-2 font-medium">Размер</th>
                  <th className="px-3 py-2 font-medium">Дата</th>
                  <th className="px-3 py-2 font-medium">Состояние</th>
                  <th className="px-3 py-2 font-medium">Скачивание</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id} className="border-t border-neutral-100">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{item.name}</p>
                      {item.note && <p className="mt-0.5 text-xs text-neutral-400">{item.note}</p>}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">
                      {personLabel(users, item.fromId, item.fromName)} → {personLabel(users, item.toId, item.toName)}
                    </td>
                    <td className="px-3 py-3 text-neutral-600">{formatSize(item.size)}</td>
                    <td className="px-3 py-3 text-neutral-600">{whenLabel(item.createdAt)}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                        {box === 'in' ? 'Получен' : 'Отправлен'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {box === 'in' ? (
                        item.downloaded ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">Скачано</span>
                        ) : item.stored === false ? (
                          <span className="text-xs text-neutral-400">Нет копии</span>
                        ) : (
                          <button
                            type="button"
                            disabled={savingId === item.id}
                            onClick={() => download(item)}
                            className="h-9 rounded-xl bg-brand px-4 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                          >
                            {savingId === item.id ? 'Скачивание…' : 'Скачать'}
                          </button>
                        )
                      ) : (
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                            item.downloaded ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-500',
                          )}
                        >
                          {item.downloaded ? 'Скачано' : 'Не скачано'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function staffTitle(account: { id: string; name: string; role: Role }) {
  if (account.role === 'superadmin') return 'Суперадмин'
  if (account.id === 'u-admin') return 'admin1'
  if (account.id === 'u-workshop' || account.name.trim().toLowerCase() === 'admin2') return 'admin2'
  return account.name
}

function personLabel(users: { id: string; name: string; role: Role }[], id: string, fallback: string) {
  const account = users.find((item) => item.id === id)
  if (account && (account.role === 'admin' || account.role === 'superadmin')) return staffTitle(account)
  return shortName(account?.name || fallback)
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const initial = parts[1]?.[0] ?? ''
  if (parts.length < 2 || !/\p{L}/u.test(initial)) return name
  return `${parts[0]} ${initial}.`
}

function sizeParts(bytes: number) {
  const text = (value: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: value >= 10 ? 0 : 1 }).format(value)
  if (bytes >= 1024 ** 3) return { value: text(bytes / 1024 ** 3), unit: 'ГБ' }
  if (bytes >= 1024 ** 2) return { value: text(bytes / 1024 ** 2), unit: 'МБ' }
  if (bytes >= 1024) return { value: text(bytes / 1024), unit: 'КБ' }
  return { value: String(bytes), unit: 'Б' }
}

function formatSize(bytes: number) {
  const size = sizeParts(bytes)
  return `${size.value} ${size.unit}`
}

function whenLabel(iso: string) {
  const date = new Date(iso)
  const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(date)
  if (date.toDateString() === new Date().toDateString()) return `Сегодня, ${time}`
  const day = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date).replace('.', '')
  return `${day}, ${time}`
}

function eta(seconds: number) {
  if (seconds >= 90) return `осталось около ${Math.max(1, Math.round(seconds / 60))} мин`
  return `осталось около ${Math.max(1, Math.round(seconds))} с`
}
