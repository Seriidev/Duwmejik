'use client'

import { useRef, useState } from 'react'
import { createId } from '@/lib/format'
import { deleteFile, putFile } from '@/lib/fileVault'
import { cn } from '@/lib/cn'
import { HeroBackdrop, useMediaUrl } from '@/features/platform/HeroBackdrop'
import { defaultHero, mediaIds, usePlatformStore, type HeroKind, type MiniBanner } from '@/store/usePlatformStore'

const COPY_LIMIT = 80 * 1024 * 1024
const kinds: { id: HeroKind; label: string }[] = [
  { id: 'video', label: 'Видео' },
  { id: 'image', label: 'Изображение' },
  { id: 'slider', label: 'Слайдер' },
]

export function SettingsScreen() {
  const draft = usePlatformStore((state) => state.draft)
  const live = usePlatformStore((state) => state.live)
  const draftBanners = usePlatformStore((state) => state.draftBanners)
  const liveBanners = usePlatformStore((state) => state.liveBanners)
  const patchDraft = usePlatformStore((state) => state.patchDraft)
  const setDraftBanners = usePlatformStore((state) => state.setDraftBanners)
  const publish = usePlatformStore((state) => state.publish)
  const fileRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const dirty = JSON.stringify(draft) !== JSON.stringify(live) || JSON.stringify(draftBanners) !== JSON.stringify(liveBanners)
  const banner = draftBanners.find((item) => item.id === selected) ?? null

  async function takeFile(file: File) {
    setError('')
    const video = draft.kind === 'video'
    const ok = video ? ['video/mp4', 'video/webm'].includes(file.type) : ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    if (!ok) {
      setError(video ? 'Нужен файл mp4 или webm.' : 'Нужна картинка jpg, png или webp.')
      return
    }
    if (file.size > COPY_LIMIT) {
      setError('Файл больше 80 МБ.')
      return
    }
    const id = createId('hero')
    await putFile(id, file)
    if (draft.kind === 'slider') {
      patchDraft({ slides: [...draft.slides, { id, name: file.name }] })
      return
    }
    const previous = draft.mediaId
    patchDraft({ mediaId: id, mediaName: file.name })
    if (previous && previous !== live.mediaId && !live.slides.some((item) => item.id === previous)) deleteFile(previous).catch(() => undefined)
  }

  async function clearMedia() {
    const drop = mediaIds(draft).filter((id) => !mediaIds(live).includes(id))
    await Promise.all(drop.map((id) => deleteFile(id).catch(() => undefined)))
    patchDraft({ ...defaultHero, title: draft.title, cta: draft.cta, ctaHref: draft.ctaHref })
    setNote('Свой файл снят. На главной снова ролик hero.mp4, когда опубликуете.')
  }

  async function onPublish() {
    const drop = mediaIds(live).filter((id) => !mediaIds(draft).includes(id))
    publish()
    await Promise.all(drop.map((id) => deleteFile(id).catch(() => undefined)))
    setNote('Опубликовано. Главная показывает эту версию.')
  }

  function updateBanner(patch: Partial<MiniBanner>) {
    if (!banner) return
    setDraftBanners(draftBanners.map((item) => (item.id === banner.id ? { ...item, ...patch } : item)))
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#0e1116]">Настройки платформы</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#5b6472]">
            Главная меняется после «Опубликовать». Кнопка «Выбрать шаблон» остаётся синей: здесь меняется только её текст.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/?preview=banner" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-[10px] border border-[#e4e7ec] bg-white px-4 text-sm font-semibold text-[#0e1116]">
            Предпросмотр главной
          </a>
          <button type="button" onClick={onPublish} className="h-10 rounded-[10px] bg-[#6d3ef2] px-4 text-sm font-semibold text-white">
            Опубликовать
          </button>
        </div>
      </div>
      {note && <p className="mt-3 text-sm text-[#5b6472]">{note}</p>}

      <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Главный баннер</h2>
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', dirty ? 'bg-[#fff1d6] text-[#b76e00]' : 'bg-[#ddf5e7] text-[#12a150]')}>
              {dirty ? 'Черновик' : 'Опубликован'}
            </span>
          </div>
          <div className="relative mt-4 h-44 overflow-hidden rounded-2xl bg-[#14161c]">
            <HeroBackdrop hero={draft} />
          </div>
          <div className="mt-4 flex rounded-[10px] bg-[#efe9ff] p-1">
            {kinds.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => patchDraft({ kind: item.id })}
                className={cn('h-8 flex-1 rounded-[8px] text-xs font-semibold', draft.kind === item.id ? 'bg-white text-[#4f26c9]' : 'text-[#5b6472]')}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#8a93a1]">{draft.mediaName || 'hero.mp4'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="h-10 rounded-[10px] bg-[#6d3ef2] px-4 text-sm font-semibold text-white">
              {draft.kind === 'slider' ? 'Добавить кадр' : draft.kind === 'image' ? 'Заменить изображение' : 'Заменить видео'}
            </button>
            <button type="button" onClick={clearMedia} className="h-10 rounded-[10px] border border-[#e4e7ec] px-4 text-sm font-semibold text-[#d92d3a]">
              Удалить
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={draft.kind === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) takeFile(file).catch(() => setError('Не удалось сохранить файл.'))
              }}
            />
          </div>
          {error && <p className="mt-2 text-sm text-[#d92d3a]">{error}</p>}
          {draft.kind === 'slider' && draft.slides.length > 0 && (
            <ul className="mt-3 grid gap-2">
              {draft.slides.map((slide) => (
                <li key={slide.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{slide.name}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#d92d3a]"
                    onClick={() => {
                      patchDraft({ slides: draft.slides.filter((item) => item.id !== slide.id) })
                      if (!mediaIds(live).includes(slide.id)) deleteFile(slide.id).catch(() => undefined)
                    }}
                  >
                    Убрать
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label className="mt-4 grid gap-1 text-xs font-semibold text-[#5b6472]">
            Заголовок
            <input
              value={draft.title}
              onChange={(event) => patchDraft({ title: event.target.value })}
              placeholder="Как на главной, если пусто"
              className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm font-normal text-[#0e1116] outline-none focus:border-[#6d3ef2]"
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-[#5b6472]">
              Текст кнопки
              <input
                value={draft.cta}
                onChange={(event) => patchDraft({ cta: event.target.value })}
                placeholder="Выбрать шаблон"
                className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm font-normal text-[#0e1116] outline-none focus:border-[#6d3ef2]"
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[#5b6472]">
              Ссылка кнопки
              <input
                value={draft.ctaHref}
                onChange={(event) => patchDraft({ ctaHref: event.target.value })}
                className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm font-normal text-[#0e1116] outline-none focus:border-[#6d3ef2]"
              />
            </label>
          </div>
          {draft.kind !== 'image' && (
            <div className="mt-4 grid gap-3">
              <Toggle on={draft.autoplay} onClick={() => patchDraft({ autoplay: !draft.autoplay })} label="Автовоспроизведение" />
              {draft.kind === 'video' && <Toggle on={draft.muted} onClick={() => patchDraft({ muted: !draft.muted })} label="Без звука" />}
              {draft.kind === 'video' && <Toggle on={draft.loop} onClick={() => patchDraft({ loop: !draft.loop })} label="Зациклить" />}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Мини-баннеры</h2>
            <button
              type="button"
              onClick={() => {
                const next: MiniBanner = { id: createId('banner'), title: '', discountPct: 0, code: '', startsAt: '', endsAt: '', after: 1, active: false, images: [] }
                setDraftBanners([next, ...draftBanners])
                setSelected(next.id)
              }}
              className="h-9 rounded-[10px] bg-[#efe9ff] px-3 text-xs font-semibold text-[#4f26c9]"
            >
              Добавить баннер
            </button>
          </div>
          <p className="mt-1 text-xs leading-5 text-[#8a93a1]">Баннер стоит между кружками категорий и блоком продукции. Один кадр стоит, два сменяются.</p>
          {draftBanners.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#8a93a1]">Мини-баннеров нет.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {draftBanners.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(item.id)}
                    className={cn('flex w-full items-center justify-between gap-3 rounded-[10px] border px-3 py-2 text-left', selected === item.id ? 'border-[#6d3ef2] bg-[#efe9ff]' : 'border-[#e4e7ec]')}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{item.code.trim() || 'Баннер'}</span>
                      <span className="text-xs text-[#8a93a1]">{(item.images ?? []).length > 1 ? 'Два кадра, карусель' : (item.images ?? []).length === 1 ? 'Один кадр' : 'Нет картинки'}</span>
                    </span>
                    <span className={cn('rounded-full px-2 py-1 text-[11px] font-semibold', item.active ? 'bg-[#ddf5e7] text-[#12a150]' : 'bg-[#f6f7f9] text-[#8a93a1]')}>
                      {item.active ? 'Включён' : 'Выключен'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {banner && (
            <div className="mt-4 grid gap-3 border-t border-[#e4e7ec] pt-4">
              <div className="grid grid-cols-2 gap-2">
                {(banner.images ?? []).map((image) => (
                  <div key={image.id} className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#f6f7f9]">
                    <BannerThumb id={image.id} />
                    <button
                      type="button"
                      onClick={() => {
                        updateBanner({ images: (banner.images ?? []).filter((item) => item.id !== image.id) })
                        deleteFile(image.id).catch(() => undefined)
                      }}
                      className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#d92d3a]"
                    >
                      Убрать
                    </button>
                  </div>
                ))}
                {(banner.images ?? []).length < 2 && (
                  <button type="button" onClick={() => bannerRef.current?.click()} className="grid aspect-[16/10] place-items-center rounded-xl border border-dashed border-[#b9d0f2] bg-[#f6f7f9] px-3 text-center text-xs font-semibold text-[#4f26c9]">
                    Загрузить баннер
                  </button>
                )}
              </div>
              <input
                ref={bannerRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file || !banner) return
                  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                    setError('Нужна картинка jpg, png или webp.')
                    return
                  }
                  if (file.size > COPY_LIMIT) {
                    setError('Файл больше 80 МБ.')
                    return
                  }
                  const id = createId('banner')
                  const bannerId = banner.id
                  putFile(id, file)
                    .then(() => {
                      const current = usePlatformStore.getState().draftBanners
                      usePlatformStore.getState().setDraftBanners(
                        current.map((item) =>
                          item.id === bannerId ? { ...item, images: [...(item.images ?? []), { id, name: file.name }].slice(0, 2) } : item,
                        ),
                      )
                    })
                    .catch(() => setError('Не удалось сохранить баннер.'))
                }}
              />
              <label className="grid gap-1 text-xs font-semibold text-[#5b6472]">
                Промокод
                <input value={banner.code} onChange={(event) => updateBanner({ code: event.target.value })} className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm font-normal text-[#0e1116] outline-none focus:border-[#6d3ef2]" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-xs font-semibold text-[#5b6472]">
                  С
                  <input type="date" value={banner.startsAt} onChange={(event) => updateBanner({ startsAt: event.target.value })} className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm font-normal text-[#0e1116] outline-none focus:border-[#6d3ef2]" />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-[#5b6472]">
                  По
                  <input type="date" value={banner.endsAt} onChange={(event) => updateBanner({ endsAt: event.target.value })} className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm font-normal text-[#0e1116] outline-none focus:border-[#6d3ef2]" />
                </label>
              </div>
              <Toggle on={banner.active} onClick={() => updateBanner({ active: !banner.active })} label="Показывать на главной" />
              <button
                type="button"
                onClick={() => {
                  for (const image of banner.images ?? []) deleteFile(image.id).catch(() => undefined)
                  setDraftBanners(draftBanners.filter((item) => item.id !== banner.id))
                  setSelected('')
                }}
                className="text-left text-xs font-semibold text-[#d92d3a]"
              >
                Удалить баннер
              </button>
            </div>
          )}
          <div className="mt-4 rounded-[10px] bg-[#f6f7f9] p-3 text-xs leading-5 text-[#5b6472]">
            На главной баннер стоит отдельной полосой между кружками категорий и блоком «Продукция».
          </div>
        </section>
      </div>
    </div>
  )
}

function BannerThumb({ id }: { id: string }) {
  const url = useMediaUrl(id)
  if (!url) return null
  return <img src={url} alt="" className="h-full w-full object-cover" />
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
