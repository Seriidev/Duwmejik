'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark, Camera, ChevronLeft, Eye, Heart } from 'lucide-react'
import { MdOutlineImageSearch } from 'react-icons/md'
import cardPreview from '@/assets/card-preview.jpg'
import logoBell from '@/assets/logo-bell.png'
import { Gate } from '@/components/Gate'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { buttonClass } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { isPrintWork } from '@/data/catalog'
import { ORDER_STATUS_LABEL } from '@/data/labels'
import { PreviewModal } from '@/features/catalog/PreviewModal'
import { SERVICES, TARIFFS } from '@/features/orders/pricing'
import { cn } from '@/lib/cn'
import { formatDate, formatPrice, plural } from '@/lib/format'
import { useAccountStore } from '@/store/useAccountStore'
import { normalizeHandle, useAuthStore } from '@/store/useAuthStore'
import { followerCount, useFollowStore } from '@/store/useFollowStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { likeCount, useEngagementStore } from '@/store/useEngagementStore'
import type { CustomOrder } from '@/types'

type Tab = 'orders' | 'saved' | 'settings'

const regions = ['Ашхабад', 'Ахал', 'Мары', 'Лебап', 'Дашогуз', 'Балкан']

const tabs: { id: Tab; label: string }[] = [
  { id: 'orders', label: 'История заказов' },
  { id: 'saved', label: 'Сохранённые' },
  { id: 'settings', label: 'Настройки' },
]

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') }
}

function readAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      const size = 256
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('canvas'))
        return
      }
      const scale = Math.max(size / image.width, size / image.height)
      const width = image.width * scale
      const height = image.height * scale
      ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image'))
    }
    image.src = url
  })
}

export function AccountPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const accounts = useAuthStore((state) => state.users)
  const following = useFollowStore((state) => state.following)
  const logout = useAuthStore((state) => state.logout)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const changePassword = useAuthStore((state) => state.changePassword)
  const setRole = useAuthStore((state) => state.setRole)
  const orders = useAccountStore((state) => state.orders)
  const favorites = useAccountStore((state) => state.favorites)
  const toggleFavorite = useAccountStore((state) => state.toggleFavorite)
  const products = useCatalogStore((state) => state.products)
  const views = useEngagementStore((state) => state.views)
  const likes = useEngagementStore((state) => state.likes)
  const addView = useEngagementStore((state) => state.addView)
  const toggleLike = useEngagementStore((state) => state.toggleLike)
  const [tab, setTab] = useState<Tab>('orders')
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [company, setCompany] = useState('')
  const [address, setAddress] = useState('')
  const [profileNote, setProfileNote] = useState('')
  const [profileError, setProfileError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordNote, setPasswordNote] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [designerOpen, setDesignerOpen] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const preview = products.find((item) => item.id === previewId) ?? null

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'settings') setTab('settings')
  }, [])

  useEffect(() => {
    if (!user) return
    const parts = splitName(user.name)
    setFirst(parts.first)
    setLast(parts.last)
    setEmail(user.email)
    setHandle(user.handle || (user.role === 'seller' || user.role === 'admin' ? '@' : ''))
    setPhone(user.phone)
    setCity(regions.includes(user.city) ? user.city : '')
    setCompany(user.company)
    setAddress(user.address)
  }, [user?.id, user?.name, user?.email, user?.handle, user?.role, user?.phone, user?.city, user?.company, user?.address])

  if (!user) {
    return (
      <div className="min-h-svh bg-white">
        <ProfileBar onBack={() => router.back()} />
        <Gate
          title="Войдите в профиль"
          text="Здесь будут имя, почта, история заказов и сохранённые макеты."
          action={
            <Link href="/login?from=%2Faccount" className={buttonClass()}>
              Войти
            </Link>
          }
        />
      </div>
    )
  }

  const mineOrders = orders.filter(
    (item) => item.userId === user.id || item.email.toLowerCase() === user.email.toLowerCase(),
  )
  const saved = (favorites[user.id] ?? [])
    .map((id) => products.find((product) => product.id === id && product.status === 'published'))
    .filter((item) => item != null)
  const parts = splitName(user.name)
  const initials = `${parts.first[0] ?? ''}${parts.last[0] ?? ''}`.toUpperCase() || 'A'
  const designer = user.role === 'seller' || user.role === 'admin'
  const followed = (following[user.id] ?? []).flatMap((id) => {
    const name = accounts.find((item) => item.id === id)?.name || products.find((item) => item.authorId === id)?.author
    return name ? [{ id, name }] : []
  })
  const followers = followerCount(following, user.id)
  const viewTotal = products
    .filter((item) => item.authorId === user.id)
    .reduce((sum, item) => sum + (views[item.id] ?? 0) + (item.status === 'published' ? Math.round(item.downloads * 0.18) : 0), 0)

  async function onAvatar(file: File | undefined) {
    if (!file) return
    setProfileError('')
    try {
      const avatar = await readAvatar(file)
      const message = updateProfile({ avatar })
      if (message) setProfileError(message)
    } catch {
      setProfileError('Не получилось прочитать фото')
    }
  }

  function saveProfile(event: FormEvent) {
    event.preventDefault()
    setProfileNote('')
    const designer = user.role === 'seller' || user.role === 'admin'
    const message = updateProfile({
      name: `${first.trim()} ${last.trim()}`.trim(),
      email,
      ...(designer ? { handle } : {}),
      phone: phone.trim(),
      city: city.trim(),
      company: company.trim(),
      address: address.trim(),
    })
    if (message) {
      setProfileError(message)
      return
    }
    setProfileError('')
    setProfileNote('Сохранено')
  }

  function savePassword(event: FormEvent) {
    event.preventDefault()
    setPasswordNote('')
    if (nextPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают')
      return
    }
    const message = changePassword(currentPassword, nextPassword)
    if (message) {
      setPasswordError(message)
      return
    }
    setPasswordError('')
    setCurrentPassword('')
    setNextPassword('')
    setConfirmPassword('')
    setPasswordNote('Пароль изменён')
  }

  return (
    <div className="min-h-svh bg-white">
      <ProfileBar onBack={() => router.back()} />
      <div className="mx-auto max-w-5xl px-4 pb-10">
      <header className="mt-6 flex flex-wrap items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-5">
          <label className="group relative grid size-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-blue-600 text-2xl font-semibold text-white sm:size-28">
            {user.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : initials}
            <span className="absolute inset-0 grid place-items-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/35 group-hover:opacity-100">
              <Camera className="size-6" />
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Фото профиля"
              onChange={(event) => {
                void onAvatar(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </label>
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {[parts.first, parts.last].filter(Boolean).join(' ')}
            </h1>
            {designer ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                <span className="font-semibold text-slate-950">{followers}</span>{' '}
                {plural(followers, 'подписчик', 'подписчика', 'подписчиков')}
                <span className="px-2 text-slate-300">·</span>
                {followed.length === 0 ? (
                  'Подписок нет'
                ) : (
                  <>
                    Подписки:{' '}
                    {followed.map((person, index) => (
                      <span key={person.id}>
                        {index > 0 ? ', ' : null}
                        <Link href={`/designer/${person.id}`} className="font-medium text-slate-950 hover:text-blue-600">
                          {person.name}
                        </Link>
                      </span>
                    ))}
                  </>
                )}
                <span className="px-2 text-slate-300">·</span>
                <span className="font-semibold text-slate-950">{viewTotal}</span>{' '}
                {plural(viewTotal, 'просмотр', 'просмотра', 'просмотров')}
              </p>
            ) : (
              <p className="mt-1 truncate text-slate-500">{user.email}</p>
            )}
            {designer && user.handle && (
              <p className="mt-1 text-sm text-slate-500">
                ID <span className="font-semibold text-slate-950">{user.handle}</span>
              </p>
            )}
          </div>
        </div>

        {user.role === 'buyer' ? (
          <Link href="/templates?section=orders" className="inline-flex h-11 items-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">
            Оформить заказ
          </Link>
        ) : user.role === 'seller' ? (
          <Link href="/seller" className="inline-flex h-11 items-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">
            Кабинет дизайнера
          </Link>
        ) : null}
      </header>

      <div role="tablist" className="mt-10 flex gap-6 border-b border-slate-200">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm font-semibold',
              tab === item.id ? 'border-slate-950 text-slate-950' : 'border-transparent text-slate-400 hover:text-slate-700',
            )}
          >
            {item.label}
            {item.id === 'orders' && <span className="ml-1.5 text-slate-400">{mineOrders.length}</span>}
            {item.id === 'saved' && <span className="ml-1.5 text-slate-400">{saved.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <section className="pt-2" role="tabpanel">
          {mineOrders.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">
              Заказов пока нет.{' '}
              <Link href="/templates?section=orders" className="font-medium text-blue-600">
                Оформить заказ
              </Link>
            </p>
          ) : (
            <div>
              {mineOrders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  open={openOrderId === order.id}
                  productTitle={products.find((item) => item.id === order.productId)?.title}
                  onToggle={() => setOpenOrderId((current) => (current === order.id ? null : order.id))}
                  onOpenProduct={order.productId ? () => setPreviewId(order.productId ?? null) : undefined}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'saved' && (
        <section className="pt-6" role="tabpanel">
          {saved.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">
              Пока ничего не сохранено.{' '}
              <Link href="/templates" className="font-medium text-blue-600">
                Открыть шаблоны
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {saved.map((product) => {
                const liked = Boolean(likes[user.id]?.includes(product.id))
                return (
                  <div key={product.id} className="group relative aspect-square overflow-hidden rounded-[22px] bg-[#6f7874]">
                    <button
                      type="button"
                      onClick={() => {
                        addView(product.id)
                        setPreviewId(product.id)
                      }}
                      className="absolute inset-0"
                    >
                      <img src={cardPreview.src} alt="" className="size-full object-cover" />
                    </button>
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="Похожие"
                        onClick={() => router.push(isPrintWork(product) ? '/templates?section=gallery' : '/templates')}
                        className="pointer-events-none absolute left-3 top-3 grid size-10 place-items-center rounded-xl bg-[#4a4a4a] text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                      >
                        <MdOutlineImageSearch className="size-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Убрать из сохранённых"
                        aria-pressed
                        onClick={() => toggleFavorite(user.id, product.id)}
                        className="pointer-events-none absolute right-3 top-3 grid size-10 place-items-center rounded-xl bg-[#4a4a4a] text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                      >
                        <Bookmark className="size-5 fill-white" />
                      </button>
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <span className="flex h-8 items-center gap-1.5 rounded-full bg-[#4a4a4a] px-3 text-sm font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)]">
                          <Eye className="size-4" />
                          {views[product.id] ?? 0}
                        </span>
                        <button
                          type="button"
                          aria-label={liked ? 'Убрать лайк' : 'Лайк'}
                          aria-pressed={liked}
                          onClick={() => toggleLike(user.id, product.id)}
                          className="pointer-events-none flex h-8 items-center gap-1.5 rounded-full bg-[#4a4a4a] px-3 text-sm font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                        >
                          <Heart className={cn('size-4', liked && 'fill-white')} />
                          {likeCount(likes, product.id)}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'settings' && (
        <section className="grid max-w-xl gap-10 py-8" role="tabpanel">
          <form className="grid gap-4" onSubmit={saveProfile}>
            <h2 className="text-lg font-semibold text-slate-950">Данные аккаунта</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Имя" required value={first} onChange={(event) => setFirst(event.target.value)} />
              <Input label="Фамилия" value={last} onChange={(event) => setLast(event.target.value)} />
            </div>
            <Input label="Почта" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            {(user.role === 'seller' || user.role === 'admin') && (
              <Input
                id="designer-handle"
                label="ID"
                required
                value={handle.startsWith('@') ? handle : `@${handle}`}
                placeholder="@studio"
                autoComplete="off"
                spellCheck={false}
                pattern="@[A-Za-z0-9_]{2,24}"
                title="ID начинается с @. Дальше латинские буквы, цифры или _"
                onChange={(event) => setHandle(normalizeHandle(event.target.value) || '@')}
              />
            )}
            <Input label="Телефон" value={phone} onChange={(event) => setPhone(event.target.value)} />
            <Select
              label="Регион"
              placeholder="Выберите регион"
              value={regions.includes(city) ? city : ''}
              onChange={(event) => setCity(event.target.value)}
            >
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>
            <p className="text-sm text-slate-500">Компанию и адрес необязательно заполнять.</p>
            <Input label="Компания" value={company} onChange={(event) => setCompany(event.target.value)} />
            <Input label="Адрес" value={address} onChange={(event) => setAddress(event.target.value)} />
            {user.avatar && (
              <button
                type="button"
                onClick={() => updateProfile({ avatar: '' })}
                className="w-fit text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Удалить фото
              </button>
            )}
            {profileError && <p className="text-sm text-rose-600">{profileError}</p>}
            {profileNote && <p className="text-sm text-emerald-600">{profileNote}</p>}
            <button type="submit" className="h-11 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">
              Сохранить
            </button>
          </form>

          <form className="grid gap-4" onSubmit={savePassword}>
            <h2 className="text-lg font-semibold text-slate-950">Пароль</h2>
            <Input
              label="Текущий пароль"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <Input
              label="Новый пароль"
              type="password"
              reveal
              autoComplete="new-password"
              required
              minLength={4}
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
            />
            <Input
              label="Повторите новый пароль"
              type="password"
              reveal
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {passwordError && <p className="text-sm text-rose-600">{passwordError}</p>}
            {passwordNote && <p className="text-sm text-emerald-600">{passwordNote}</p>}
            <button type="submit" className="h-11 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">
              Сменить пароль
            </button>
          </form>

          <div className="grid gap-3 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-semibold text-slate-950">Дизайнер</h2>
            <p className="text-sm leading-6 text-slate-500">
              Загружайте шаблоны и смотрите, какие работы на проверке, одобрены или отклонены.
            </p>
            {(user.role === 'seller' || user.role === 'admin') && user.handle && (
              <p className="text-sm text-slate-500">
                ID дизайнера <span className="font-semibold text-slate-950">{user.handle}</span>
              </p>
            )}
            {user.role === 'seller' || user.role === 'admin' ? (
              /^@[A-Za-z0-9_]{2,24}$/.test(user.handle) ? (
                <Link href="/seller" className="inline-flex h-11 w-fit items-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">
                  Открыть кабинет дизайнера
                </Link>
              ) : (
                <p className="text-sm text-rose-600">Сохраните ID. Без него кабинет не откроется.</p>
              )
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAcceptTerms(false)
                  setAcceptPrivacy(false)
                  setDesignerOpen(true)
                }}
                className="h-11 w-fit rounded-full bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Стать дизайнером
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            className="h-11 w-fit rounded-full border border-rose-200 px-5 text-sm font-semibold text-rose-500 hover:bg-rose-50"
          >
            Выйти
          </button>
        </section>
      )}

      <Modal
        open={designerOpen}
        title="Стать дизайнером"
        onClose={() => setDesignerOpen(false)}
      >
        <div className="grid gap-4 text-sm leading-6 text-slate-600">
          <p>Кабинет откроется после согласия с условиями и политикой конфиденциальности.</p>
          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4">
            <p className="font-semibold text-slate-950">Условия для дизайнеров</p>
            <p>Макет уходит на проверку. Одобренный появляется в каталоге, отклонённый остаётся у вас со статусом. Нельзя загружать чужие работы и скрывать лицензию.</p>
            <p className="font-semibold text-slate-950">Политика конфиденциальности</p>
            <p>Имя и почта используются для кабинета и сообщений о проверке. Их не отдают другим дизайнерам.</p>
          </div>
          <label className="flex items-start gap-3 text-slate-800">
            <input type="checkbox" className="mt-1 size-4 accent-blue-600" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} />
            Принимаю условия для дизайнеров
          </label>
          <label className="flex items-start gap-3 text-slate-800">
            <input type="checkbox" className="mt-1 size-4 accent-blue-600" checked={acceptPrivacy} onChange={(event) => setAcceptPrivacy(event.target.checked)} />
            Принимаю политику конфиденциальности
          </label>
          <button
            type="button"
            disabled={!acceptTerms || !acceptPrivacy}
            onClick={() => {
              setRole(user.id, 'seller')
              setDesignerOpen(false)
              if (/^@[A-Za-z0-9_]{2,24}$/.test(user.handle)) {
                router.push('/seller')
                return
              }
              setTab('settings')
              window.setTimeout(() => document.getElementById('designer-handle')?.focus(), 50)
            }}
            className="h-11 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Перейти в кабинет
          </button>
        </div>
      </Modal>

      <PreviewModal product={preview} onClose={() => setPreviewId(null)} />
      </div>
    </div>
  )
}

function ProfileBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 sm:px-6">
      <button
        type="button"
        aria-label="Назад"
        onClick={onBack}
        className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
      >
        <ChevronLeft className="size-5" />
      </button>
      <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-neutral-950">
        <img src={logoBell.src} alt="Duwmejik" className="size-12 object-contain" />
        <span className="text-[17px]">Duwmejik</span>
      </Link>
    </div>
  )
}

function OrderRow({
  order,
  open,
  productTitle,
  onToggle,
  onOpenProduct,
}: {
  order: CustomOrder
  open: boolean
  productTitle?: string
  onToggle: () => void
  onOpenProduct?: () => void
}) {
  const service = SERVICES[order.service]?.title ?? order.service
  const tariff = TARIFFS[order.tariff]?.title ?? order.tariff
  const briefLabels: Record<string, string> = {
    source: 'Источник',
    format: 'Формат',
    paper: 'Бумага',
    company: 'Компания',
    deadline: 'Срок сдачи',
  }
  const briefValues: Record<string, string> = {
    upload: 'Загруженный файл',
    catalog: 'Каталог',
  }
  const brief = Object.entries(order.brief).filter(([, value]) => value.trim())

  return (
    <article className="border-b border-slate-200">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-4 py-4 text-left">
        <div className="min-w-0">
          <p className="font-semibold text-slate-950">
            {order.subtype} · {service}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(order.createdAt)} · {order.quantity} шт. · {formatPrice(order.price)}
          </p>
        </div>
        <Badge tone={order.status === 'done' ? 'ok' : order.status === 'cancelled' ? 'bad' : 'info'}>
          {ORDER_STATUS_LABEL[order.status]}
        </Badge>
      </button>
      {open && (
        <dl className="grid gap-x-8 gap-y-3 pb-5 text-sm sm:grid-cols-2">
          <Detail label="Номер" value={order.id} />
          <Detail label="Статус" value={ORDER_STATUS_LABEL[order.status]} />
          <Detail label="Услуга" value={service} />
          <Detail label="Тип" value={order.subtype} />
          <Detail label="Тариф" value={tariff} />
          <Detail label="Количество" value={`${order.quantity} шт.`} />
          <Detail label="Цена" value={formatPrice(order.price)} />
          <Detail label="Срок" value={order.days === 0 ? 'в тот же день' : order.days === 1 ? '1 день' : order.days === 3 ? '2–3 дня' : `около ${order.days} дней`} />
          <Detail label="Имя" value={order.customerName} />
          <Detail label="Почта" value={order.email} />
          <Detail label="Телефон" value={order.phone || '—'} />
          <Detail label="Дата" value={formatDate(order.createdAt)} />
          {order.comment && (
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Комментарий</dt>
              <dd className="mt-0.5 text-slate-800">{order.comment}</dd>
            </div>
          )}
          {brief.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Параметры</dt>
              <dd className="mt-1 grid gap-1">
                {brief.map(([key, value]) => (
                  <p key={key} className="text-slate-800">
                    {briefLabels[key] ?? key}: {briefValues[value] ?? value}
                  </p>
                ))}
              </dd>
            </div>
          )}
          {productTitle && onOpenProduct && (
            <div className="sm:col-span-2">
              <dt className="text-slate-400">Макет</dt>
              <dd>
                <button type="button" onClick={onOpenProduct} className="mt-0.5 font-medium text-blue-600">
                  {productTitle}
                </button>
              </dd>
            </div>
          )}
        </dl>
      )}
    </article>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value}</dd>
    </div>
  )
}
