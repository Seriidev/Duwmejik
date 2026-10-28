'use client'

import { FileText, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import type { FileType } from '@/types'

const maxBytes = 20 * 1024 * 1024
const shotCount = 4

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
  const pdfRef = useRef<HTMLInputElement>(null)
  const shotRef = useRef<HTMLInputElement>(null)
  const consumedFile = useRef<File | null>(null)
  const shotIndex = useRef(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [shots, setShots] = useState<(string | null)[]>(Array.from({ length: shotCount }, () => null))

  useEffect(() => {
    if (!initialFile || consumedFile.current === initialFile) return
    consumedFile.current = initialFile
    if (isPdf(initialFile)) void applyPdf(initialFile)
    else {
      shotIndex.current = 0
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
    setShots((current) => current.map((item, index) => (index === shotIndex.current ? picture : item)))
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
    if (shots.some((item) => !item)) {
      setError('Нужно заполнить все 4 фотографии')
      return
    }
    const gallery = shots.filter((item): item is string => Boolean(item))
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      categoryId: categories[0]?.id ?? 'cards',
      tags: [],
      fileName: file.name,
      fileType: 'PDF',
      image: gallery[0],
      gallery,
    })
  }

  return (
    <div className="bg-white px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="text-[28px] font-semibold tracking-tight text-neutral-950">Загрузить работу</h2>
        <p className="mt-1 text-sm text-neutral-500">Сначала фотография работы, PDF-оригинал — следом</p>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-neutral-800">Главное фото</span>
              <span className="text-xs font-medium text-rose-600">Обязательно заполнить</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                shotIndex.current = 0
                shotRef.current?.click()
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  shotIndex.current = 0
                  shotRef.current?.click()
                }
              }}
              className="relative h-[520px] w-full min-w-0 cursor-pointer overflow-hidden rounded-[28px] bg-[#efefef]"
            >
              {shots[0] ? (
                <img src={shots[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center px-8 text-center">
                  <span>
                    <Plus className="mx-auto size-8 text-neutral-600" />
                    <span className="mt-3 block text-base font-semibold text-neutral-900">Добавьте фото</span>
                  </span>
                </span>
              )}
            </div>
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
                <span className="text-sm font-medium text-neutral-800">Фото работы</span>
                <span className="text-xs font-medium text-rose-600">Обязательно заполнить · 4 фото</span>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {shots.map((shot, index) => (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      shotIndex.current = index
                      shotRef.current?.click()
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        shotIndex.current = index
                        shotRef.current?.click()
                      }
                    }}
                    className="relative aspect-square min-w-0 cursor-pointer overflow-hidden rounded-2xl bg-[#efefef]"
                  >
                    {shot ? (
                      <img src={shot} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center">
                        <Plus className="size-6 text-neutral-500" />
                      </span>
                    )}
                    {shot && (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Убрать фото ${index + 1}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          setShots((current) => current.map((item, itemIndex) => (itemIndex === index ? null : item)))
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.stopPropagation()
                          setShots((current) => current.map((item, itemIndex) => (itemIndex === index ? null : item)))
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

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold">Объявление</p>
              <p className="mt-1 leading-6">
                Макет должен быть собран в Adobe Illustrator, Photoshop или CorelDRAW. Готовый оригинал прикладывается файлом PDF.
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
                'flex h-16 items-center gap-3 rounded-2xl bg-[#f6f6f6] px-4 text-left',
                over && 'ring-2 ring-neutral-400',
              )}
            >
              <FileText className="size-5 shrink-0 text-neutral-500" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-neutral-800">
                  {file ? file.name : 'Оригинал PDF'}
                </span>
                <span className="block text-xs text-neutral-500">Второй шаг · файл до 20 МБ</span>
              </span>
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
              className="mt-2 h-12 rounded-full bg-neutral-950 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Отправить на проверку
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

function readPicture(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : ''
      const image = new Image()
      image.onload = () => {
        const max = 1400
        const scale = Math.min(1, max / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * scale))
        const height = Math.max(1, Math.round(image.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(raw)
          return
        }
        ctx.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      image.onerror = () => resolve('')
      image.src = raw
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}
