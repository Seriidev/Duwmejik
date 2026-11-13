'use client'

import { FileText, Megaphone, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/useAuthStore'
import type { FileType } from '@/types'

const maxBytes = 20 * 1024 * 1024
const shotCount = 4
const frameSize = 1080

type Shot = { src: string; width: number; height: number }

export type WorkSubmission = {
  title: string
  description: string
  categoryId: string
  tags: string[]
  fileName: string
  fileType: FileType
  image?: string
  gallery: string[]
}

export function UploadWork({
  categories,
  initialFile,
  onConsumeFile,
  onSubmit,
}: {
  categories: { id: string; title: string }[]
  initialFile: File | null
  onConsumeFile: () => void
  onSubmit: (draft: WorkSubmission) => void
}) {
  const user = useAuthStore((state) => state.user)
  const handle = user?.handle?.trim()
  const mention = handle ? (handle.startsWith('@') ? handle : `@${handle}`) : ''
  const pdfRef = useRef<HTMLInputElement>(null)
  const shotRef = useRef<HTMLInputElement>(null)
  const consumedFile = useRef<File | null>(null)
  const shotTarget = useRef<'main' | number>('main')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [main, setMain] = useState<Shot | null>(null)
  const [views, setViews] = useState<(Shot | null)[]>(Array.from({ length: shotCount }, () => null))

  useEffect(() => {
    if (!initialFile || consumedFile.current === initialFile) return
    consumedFile.current = initialFile
    if (isPdf(initialFile)) void applyPdf(initialFile)
    else {
      shotTarget.current = 'main'
      void applyShot(initialFile)
    }
    onConsumeFile()
  }, [initialFile, onConsumeFile])

  function applyPdf(next: File) {
    if (!isPdf(next)) {
      setError('Оригинал нужно загрузить файлом PDF')
      return
    }
    if (next.size > maxBytes) {
      setError('PDF больше 20 МБ')
      return
    }
    setError('')
    setFile(next)
    if (!title.trim()) setTitle(prettyName(next.name))
  }

  async function applyShot(next: File) {
    if (!next.type.startsWith('image/') && !/\.(png|jpe?g)$/i.test(next.name)) {
      setError('Фото работы — только PNG или JPG')
      return
    }
    if (next.size > maxBytes) {
      setError('Фото больше 20 МБ')
      return
    }
    const picture = await readPicture(next)
    if (!picture) {
      setError('Не удалось открыть изображение')
      return
    }
    setError('')
    const target = shotTarget.current
    if (target === 'main') setMain(picture)
    else setViews((current) => current.map((item, index) => (index === target ? picture : item)))
    if (!isSquare(picture)) setError(`Нужен квадрат ${frameSize}×${frameSize} px. Сейчас ${picture.width}×${picture.height}, в ленте края срежутся.`)
  }

  function submit() {
    if (!title.trim()) {
      setError('Напишите название работы')
      return
    }
    if (!description.trim()) {
      setError('Напишите описание')
      return
    }
    if (!file) {
      setError('Загрузите оригинал в PDF')
      return
    }
    if (!main) {
      setError('Добавьте главный вид')
      return
    }
    if (views.some((item) => !item)) {
      setError('Нужны ещё 4 других вида этой работы')
      return
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      categoryId: categories[0]?.id ?? 'cards',
      tags: [],
      fileName: file.name,
      fileType: 'PDF',
      image: main.src,
      gallery: views.flatMap((item) => (item ? [item.src] : [])),
    })
  }

  return (
    <div className="bg-white px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="text-[28px] font-semibold tracking-tight text-neutral-950">Загрузить работу</h2>
        <p className="mt-1 text-sm text-neutral-500">Сначала главный вид, потом другие ракурсы той же работы, PDF — следом</p>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-neutral-800">Главный вид</span>
              <span className="text-xs font-medium text-rose-600">Обязательно · {frameSize}×{frameSize}</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                shotTarget.current = 'main'
                shotRef.current?.click()
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  shotTarget.current = 'main'
                  shotRef.current?.click()
                }
              }}
              className="relative aspect-square w-full max-w-[360px] min-w-0 cursor-pointer overflow-hidden rounded-[28px] bg-[#efefef]"
            >
              {main ? (
                <img src={main.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center px-8 text-center">
                  <span>
                    <Plus className="mx-auto size-8 text-neutral-600" />
                    <span className="mt-3 block text-base font-semibold text-neutral-900">Добавьте фото</span>
                    <span className="mt-1 block text-sm text-neutral-500">Квадрат {frameSize}×{frameSize} px</span>
                  </span>
                </span>
              )}
            </div>
            {main && !isSquare(main) && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                Сейчас {main.width}×{main.height}. Нужен квадрат {frameSize}×{frameSize}, иначе в ленте края срежутся.
              </p>
            )}
          </div>

          <div className="grid min-w-0 gap-3">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-neutral-800">
                Название работы <span className="text-rose-600">*</span>
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Как называется работа"
                className="h-14 w-full rounded-2xl bg-[#efefef] px-4 text-sm outline-none placeholder:text-neutral-500"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-neutral-800">
                Описание <span className="text-rose-600">*</span>
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Коротко, что это за работа"
                className="min-h-32 w-full resize-y rounded-2xl bg-[#efefef] px-4 py-3 text-sm outline-none placeholder:text-neutral-500"
              />
            </label>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-neutral-800">Другие виды</span>
                <span className="text-xs font-medium text-rose-600">Обязательно · {frameSize}×{frameSize} · 4 фото</span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {views.map((shot, index) => (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      shotTarget.current = index
                      shotRef.current?.click()
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        shotTarget.current = index
                        shotRef.current?.click()
                      }
                    }}
                    className="relative aspect-square min-w-0 cursor-pointer overflow-hidden rounded-2xl bg-[#efefef]"
                  >
                    {shot ? (
                      <img src={shot.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center px-1 text-center">
                        <span>
                          <Plus className="mx-auto size-6 text-neutral-500" />
                          <span className="mt-1 block text-[10px] font-medium leading-tight text-neutral-500">{frameSize}×{frameSize}</span>
                        </span>
                      </span>
                    )}
                    {shot && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Убрать фото ${index + 1}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          setViews((current) => current.map((item, itemIndex) => (itemIndex === index ? null : item)))
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.stopPropagation()
                          setViews((current) => current.map((item, itemIndex) => (itemIndex === index ? null : item)))
                        }}
                        className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 text-white"
                      >
                        <X className="size-3.5" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <input
                ref={shotRef}
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                className="sr-only"
                onChange={(event) => {
                  const next = event.target.files?.[0]
                  event.target.value = ''
                  if (next) void applyShot(next)
                }}
              />
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
              <p className="flex items-center gap-2 font-semibold">
                <Megaphone className="size-4 shrink-0 text-emerald-600" />
                Объявление
              </p>
              <p className="mt-1 leading-6">
                Уважаемый дизайнер{mention ? ` (${mention})` : ''}, макет, который вы должны загрузить, должен быть собран в Adobe Illustrator, InDesign, CorelDRAW и Photoshop и загружен в виде PDF. Figma, Canva и другие подобные программы не поддерживаются, так как это типографическая платформа. Благодарим за внимание!
              </p>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => pdfRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') pdfRef.current?.click()
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setOver(true)
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setOver(false)
                const next = event.dataTransfer.files[0]
                if (next) applyPdf(next)
              }}
              className={cn(
                'flex cursor-pointer items-center gap-4 rounded-[22px] border border-dashed px-4 py-4 text-left transition sm:px-5',
                over ? 'border-brand bg-transparent' : 'border-blue-200 bg-transparent hover:border-brand',
              )}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-brand">
                <FileText className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {file ? file.name : 'Перетащите PDF сюда или выберите на компьютере'}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {file ? 'Оригинал выбран · файл до 20 МБ' : 'Оригинал макета в PDF. До отправки файл остаётся только у вас.'}
                </span>
              </span>
              <span className="hidden shrink-0 text-sm font-semibold text-brand sm:block">Выбрать файл</span>
              <input
                ref={pdfRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(event) => {
                  const next = event.target.files?.[0]
                  event.target.value = ''
                  if (next) applyPdf(next)
                }}
              />
            </div>

            <button
              type="button"
              onClick={submit}
              className="mt-2 h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:brightness-110"
            >
              Опубликовать
            </button>
            {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function isPdf(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function prettyName(name: string) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
  return base || 'Новая работа'
}

function isSquare(shot: Shot) {
  const longest = Math.max(shot.width, shot.height)
  return longest > 0 && Math.abs(shot.width - shot.height) / longest <= 0.02
}

function readPicture(file: File) {
  return new Promise<Shot | null>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : ''
      const image = new Image()
      image.onload = () => {
        const width = image.width
        const height = image.height
        const max = 1400
        const scale = Math.min(1, max / Math.max(width, height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(width * scale))
        canvas.height = Math.max(1, Math.round(height * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve({ src: raw, width, height })
          return
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve({ src: canvas.toDataURL('image/jpeg', 0.9), width, height })
      }
      image.onerror = () => resolve(null)
      image.src = raw
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}
