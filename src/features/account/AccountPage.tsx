'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark, Camera, ChevronLeft, Eye, Heart } from 'lucide-react'
import { MdOutlineImageSearch } from 'react-icons/md'
import { IconTip } from '@/components/ui/IconTip'
import cardPreview from '@/assets/card-preview.jpg'
import logoBell from '@/assets/logo-bell.png'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { SavedNotice, useSavedNotice } from '@/components/ui/SavedNotice'
import { Input, Select, TextArea } from '@/components/ui/Input'
import { isPrintWork } from '@/data/catalog'
import { ORDER_STATUS_LABEL } from '@/data/labels'
import { PreviewModal } from '@/features/catalog/PreviewModal'
import { PickupPass } from '@/features/orders/PickupPass'
import { SERVICES, TARIFFS } from '@/features/orders/pricing'
import { cn } from '@/lib/cn'
import { dashboardFor, isStaff } from '@/lib/authHref'
import { formatDate, formatPrice, plural } from '@/lib/format'
import { useAccountStore } from '@/store/useAccountStore'
import { normalizeHandle, useAuthStore } from '@/store/useAuthStore'
import { useFollowStore } from '@/store/useFollowStore'
import { useCatalogStore } from '@/store/useCatalogStore'
import { likeCount, useEngagementStore } from '@/store/useEngagementStore'
import type { AccountUser, CustomOrder, Role } from '@/types'

type Tab = 'works' | 'saved' | 'orders' | 'settings'

const regions = ['Ашхабад', 'Ахал', 'Мары', 'Лебап', 'Дашогуз', 'Балкан']

const specialties = ['Полиграфия', 'Логотипы и фирменный стиль', 'Сувениры и мерч', 'Упаковка', 'Другое']

const tabs: { id: Tab; label: string }[] = [
  { id: 'works', label: 'Работы' },
  { id: 'saved', label: 'Сохранённые' },
  { id: 'orders', label: 'История заказов' },
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
  const users = useAuthStore((state) => state.users)
  const following = useFollowStore((state) => state.following)
  const forgetFollows = useFollowStore((state) => state.forgetUser)
  const logout = useAuthStore((state) => state.logout)
  const deleteAccount = useAuthStore((state) => state.deleteAccount)
  const updateProfile = useAuthStore((state) => state.updateProfile)
  const changePassword = useAuthStore((state) => state.changePassword)
  const applyDesigner = useAuthStore((state) => state.applyDesigner)
  const orders = useAccountStore((state) => state.orders)
  const favorites = useAccountStore((state) => state.favorites)
  const toggleFavorite = useAccountStore((state) => state.toggleFavorite)
  const forgetOrders = useAccountStore((state) => state.forgetUser)
  const products = useCatalogStore((state) => state.products)
  const removeByAuthor = useCatalogStore((state) => state.removeByAuthor)
  const views = useEngagementStore((state) => state.views)
  const likes = useEngagementStore((state) => state.likes)
  const addView = useEngagementStore((state) => state.addView)
  const toggleLike = useEngagementStore((state) => state.toggleLike)
  const [tab, setTab] = useState<Tab>('works')
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
  const savedNotice = useSavedNotice()
  const [designerOpen, setDesignerOpen] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  const [requestHandle, setRequestHandle] = useState('@')
  const [specialty, setSpecialty] = useState('')
  const [about, setAbout] = useState('')
  const [requestError, setRequestError] = useState('')
  const [people, setPeople] = useState<'followers' | 'following' | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePhrase, setDeletePhrase] = useState('')
  const preview = products.find((item) => item.id === previewId) ?? null

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('tab')
    if (next === 'settings' || next === 'orders' || next === 'saved' || next === 'works') setTab(next)
  }, [])

  useEffect(() => {
    function leave() {
      const current = useAuthStore.getState().user
      if (!current) router.replace('/login')
      else if (isStaff(current.role)) router.replace(dashboardFor(current.role))
    }
    if (useAuthStore.persist.hasHydrated()) {
      leave()
      return
    }
    return useAuthStore.persist.onFinishHydration(leave)
  }, [user, router])

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

  if (!user) return null
  if (isStaff(user.role)) return null

  const mineOrders = orders.filter(
    (item) => item.userId === user.id || item.email.toLowerCase() === user.email.toLowerCase(),
  )
  const newestOrderId = mineOrders.reduce<CustomOrder | null>(
    (latest, order) => (!latest || order.createdAt > latest.createdAt ? order : latest),
    null,
  )?.id
  const saved = (favorites[user.id] ?? [])
    .map((id) => products.find((product) => product.id === id && product.status === 'published'))
    .filter((item) => item != null)
  const works = products.filter((item) => item.authorId === user.id && item.status === 'published')
  const parts = splitName(user.name)
  const initials = `${parts.first[0] ?? ''}${parts.last[0] ?? ''}`.toUpperCase() || 'A'
  const designer = user.role === 'seller'
  const username = user.handle ? (user.handle.startsWith('@') ? user.handle : `@${user.handle}`) : ''
  const followingPeople = accountsByIds(users, following[user.id] ?? [])
  const followerPeople = accountsByIds(
    users,
    Object.entries(following)
      .filter(([, ids]) => ids.includes(user.id))
      .map(([id]) => id),
  )
  const subscriptions = followingPeople.length
  const followers = followerPeople.length
  const viewTotal = products
    .filter((item) => item.authorId === user.id)
    .reduce((sum, item) => sum + (views[item.id] ?? 0) + (item.status === 'published' ? Math.round(item.downloads * 0.18) : 0), 0)

  function confirmDelete(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    const phrase = (username || user.email).trim()
    if (deletePhrase.trim() !== phrase) return
    removeByAuthor(user.id)
    forgetOrders(user.id)
    forgetFollows(user.id)
    deleteAccount()
    setDeleteOpen(false)
    router.push('/')
  }

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
    if (!user) return
    setProfileNote('')
    const designer = user.role === 'seller'
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
    savedNotice.show()
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

  function openDesignerForm() {
    const previous = user?.designerRequest
    setRequestHandle(previous?.handle || '@')
    setSpecialty(previous?.specialty ?? '')
    setAbout(previous?.about ?? '')
    setRequestError('')
    setAcceptTerms(false)
    setAcceptPrivacy(false)
    setDesignerOpen(true)
  }

  function sendDesignerRequest(event: FormEvent) {
    event.preventDefault()
    const message = applyDesigner({ handle: requestHandle, specialty, about })
    if (message) {
      setRequestError(message)
      return
    }
    setDesignerOpen(false)
    setTab('settings')
  }

  const request = user.designerRequest

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
            {designer && username && <p className="mt-1 text-sm font-medium text-slate-500">{username}</p>}
            {designer ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                <button type="button" onClick={() => setPeople('followers')} className="hover:text-slate-950">
                  <span className="font-semibold text-slate-950">{followers}</span>{' '}
                  {plural(followers, 'подписчик', 'подписчика', 'подписчиков')}
                </button>
                <span className="px-2 text-slate-300">·</span>
                <button type="button" onClick={() => setPeople('following')} className="hover:text-slate-950">
                  <span className="font-semibold text-slate-950">{subscriptions}</span>{' '}
                  {plural(subscriptions, 'подписка', 'подписки', 'подписок')}
                </button>
                <span className="px-2 text-slate-300">·</span>
                <span className="font-semibold text-slate-950">{viewTotal}</span>{' '}
                {plural(viewTotal, 'просмотр', 'просмотра', 'просмотров')}
              </p>
            ) : (
              <p className="mt-1 truncate text-slate-500">{user.email}</p>
            )}
          </div>
        </div>

        {user.role === 'buyer' ? (
          request?.status === 'pending' ? (
            <span className="inline-flex h-11 items-center rounded-full bg-amber-50 px-5 text-sm font-semibold text-amber-700">
              Заявка на проверке
            </span>
          ) : (
            <button
              type="button"
              onClick={openDesignerForm}
              className="inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:brightness-110"
            >
              Стать дизайнером
            </button>
          )
        ) : (
          <Link href="/seller" className="inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:brightness-110">
            Кабинет
          </Link>
        )}
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
            {item.id === 'works' && <span className="ml-1.5 text-slate-400">{works.length}</span>}
            {item.id === 'orders' && <span className="ml-1.5 text-slate-400">{mineOrders.length}</span>}
            {item.id === 'saved' && <span className="ml-1.5 text-slate-400">{saved.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'works' && (
        <section className="pt-6" role="tabpanel">
          {works.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">Опубликованных работ пока нет.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {works.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    addView(product.id)
                    setPreviewId(product.id)
                  }}
                  className="relative aspect-square overflow-hidden rounded-[22px] bg-[#6f7874]"
                >
                  <img src={product.image || cardPreview.src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

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
                  fresh={order.id === newestOrderId}
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
                      <img src={product.image || cardPreview.src} alt="" className="size-full object-cover" />
                    </button>
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="Похожие"
                        onClick={() => router.push(isPrintWork(product) ? '/templates?section=gallery' : '/templates')}
                        className="group/tip pointer-events-none absolute left-3 top-3 grid size-10 place-items-center rounded-xl bg-[#4a4a4a] text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                      >
                        <MdOutlineImageSearch className="size-5" />
                        <IconTip label="Похожие" side="right" />
                      </button>
                      <button
                        type="button"
                        aria-label="Убрать из сохранённых"
                        aria-pressed
                        onClick={() => toggleFavorite(user.id, product.id)}
                        className="group/tip pointer-events-none absolute right-3 top-3 grid size-10 place-items-center rounded-xl bg-[#4a4a4a] text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                      >
                        <Bookmark className="size-5 fill-white" />
                        <IconTip label="Сохранено" side="left" />
                      </button>
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <span className="group/tip relative flex h-8 items-center gap-1.5 rounded-full bg-[#4a4a4a] px-3 text-sm font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] group-hover:pointer-events-auto">
                          <Eye className="size-4" />
                          {views[product.id] ?? 0}
                          <IconTip label="Просмотры" side="up" />
                        </span>
                        <button
                          type="button"
                          aria-label={liked ? 'Убрать лайк' : 'Лайк'}
                          aria-pressed={liked}
                          onClick={() => toggleLike(user.id, product.id)}
                          className="group/tip pointer-events-none relative flex h-8 items-center gap-1.5 rounded-full bg-[#4a4a4a] px-3 text-sm font-medium text-white shadow-[0_6px_16px_rgba(0,0,0,0.28)] transition duration-300 ease-out group-hover:pointer-events-auto hover:bg-[#3a3a3a]"
                        >
                          <Heart className={cn('size-4', liked && 'fill-white')} />
                          {likeCount(likes, product.id)}
                          <IconTip label={liked ? 'Убрать лайк' : 'Лайк'} side="up" />
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
            {user.role === 'seller' && (
              <Input
                id="designer-handle"
                label="Имя пользователя"
                required
                value={handle.startsWith('@') ? handle : `@${handle}`}
                placeholder="@studio"
                autoComplete="off"
                spellCheck={false}
                pattern="@[A-Za-z0-9_]{2,24}"
                title="Имя пользователя начинается с @. Дальше латинские буквы, цифры или _"
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
            <button type="submit" className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:brightness-110">
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
            <button type="submit" className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:brightness-110">
              Сменить пароль
            </button>
          </form>

          <div className="grid gap-3 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-semibold text-slate-950">Дизайнер</h2>
            <p className="text-sm leading-6 text-slate-500">
              Загружайте шаблоны и смотрите, какие работы на проверке, одобрены или отклонены.
            </p>
            {user.role === 'seller' ? (
              /^@[A-Za-z0-9_]{2,24}$/.test(user.handle) ? (
                <Link href="/seller" className="inline-flex h-11 w-fit items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:brightness-110">
                  Открыть кабинет дизайнера
                </Link>
              ) : (
                <p className="text-sm text-rose-600">Сохраните имя пользователя. Без него кабинет не откроется.</p>
              )
            ) : request?.status === 'pending' ? (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                Заявка с именем <span className="font-semibold">{request.handle}</span> отправлена {formatDate(request.createdAt)} и ждёт проверки администратором.
                После одобрения откроется кабинет дизайнера.
              </p>
            ) : (
              <>
                {request?.status === 'rejected' && (
                  <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                    Заявка отклонена.{request.note ? ` ${request.note}` : ''} Можно исправить данные и отправить снова.
                  </p>
                )}
                <button
                  type="button"
                  onClick={openDesignerForm}
                  className="h-11 w-fit rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:brightness-110"
                >
                  {request?.status === 'rejected' ? 'Подать заявку снова' : 'Стать дизайнером'}
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                logout()
                router.push('/login')
              }}
              className="h-11 rounded-xl border border-rose-200 px-5 text-sm font-semibold text-rose-500 hover:bg-rose-50"
            >
              Выйти
            </button>
            <button
              type="button"
              onClick={() => {
                setDeletePhrase('')
                setDeleteOpen(true)
              }}
              className="h-11 rounded-xl border border-rose-200 px-5 text-sm font-semibold text-rose-500 hover:bg-rose-50"
            >
              Удалить аккаунт
            </button>
          </div>
        </section>
      )}

      <Modal open={deleteOpen} title="Удалить аккаунт" onClose={() => setDeleteOpen(false)}>
        <form className="grid max-w-lg gap-4 text-sm leading-6 text-slate-600" onSubmit={confirmDelete}>
          <p>
            Профиль <span className="font-semibold text-slate-950">{user.name}</span> будет удалён вместе с работами и заказами. Вернуть аккаунт будет нельзя.
          </p>
          <p>
            Чтобы подтвердить, введите <span className="font-semibold text-slate-950">{username || user.email}</span>
          </p>
          <input
            value={deletePhrase}
            onChange={(event) => setDeletePhrase(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={username || user.email}
            className="h-11 rounded-xl border border-slate-200 px-3 text-slate-950 outline-none focus:border-slate-400"
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setDeleteOpen(false)} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700">
              Отмена
            </button>
            <button
              type="submit"
              disabled={deletePhrase.trim() !== (username || user.email).trim()}
              className="h-11 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-200"
            >
              Удалить аккаунт
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={people !== null}
        title={people === 'followers' ? 'Подписчики' : 'Подписки'}
        onClose={() => setPeople(null)}
      >
        <PeopleList people={people === 'followers' ? followerPeople : followingPeople} empty={people === 'followers' ? 'Подписчиков пока нет.' : 'Подписок пока нет.'} />
      </Modal>

      <Modal
        open={designerOpen}
        title="Стать дизайнером"
        onClose={() => setDesignerOpen(false)}
      >
        <form className="grid gap-4 text-sm leading-6 text-slate-600" onSubmit={sendDesignerRequest}>
          <p>Заявку проверит администратор. После одобрения откроется кабинет дизайнера с портфолио и загрузкой работ.</p>
          <Input
            label="Имя пользователя"
            required
            value={requestHandle.startsWith('@') ? requestHandle : `@${requestHandle}`}
            placeholder="@studio"
            autoComplete="off"
            spellCheck={false}
            pattern="@[A-Za-z0-9_]{2,24}"
            title="Имя пользователя начинается с @. Дальше латинские буквы, цифры или _"
            onChange={(event) => setRequestHandle(normalizeHandle(event.target.value) || '@')}
          />
          <Select label="Направление" placeholder="Выберите направление" value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
            {specialties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <TextArea
            label="О себе и ссылка на портфолио"
            placeholder="Чем занимаетесь, опыт, ссылка на Behance или Instagram"
            maxLength={600}
            value={about}
            onChange={(event) => setAbout(event.target.value)}
          />
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
          {requestError && <p className="text-sm text-rose-600">{requestError}</p>}
          <button
            type="submit"
            disabled={!acceptTerms || !acceptPrivacy || !specialty}
            className="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Отправить заявку
          </button>
        </form>
      </Modal>

      <PreviewModal product={preview} onClose={() => setPreviewId(null)} />
      <SavedNotice open={savedNotice.open} />
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
  fresh,
  open,
  productTitle,
  onToggle,
  onOpenProduct,
}: {
  order: CustomOrder
  fresh: boolean
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
    edges: 'Края',
    sides: 'Стороны',
  }
  const briefValues: Record<string, string> = {
    upload: 'Загруженный файл',
    catalog: 'Каталог',
  }
  const brief = Object.entries(order.brief).filter(([, value]) => value.trim())
  const statusLabel = order.status === 'new' && !fresh ? null : ORDER_STATUS_LABEL[order.status]

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
        {statusLabel && (
          <Badge tone={order.status === 'issued' ? 'ok' : order.status === 'ready' ? 'pending' : order.status === 'cancelled' ? 'bad' : 'info'}>
            {statusLabel}
          </Badge>
        )}
      </button>
      {open && (
        <dl className="grid gap-x-8 gap-y-3 pb-5 text-sm sm:grid-cols-2">
          <PickupPass order={order} className="sm:col-span-2" />
          <Detail label="Номер" value={order.id} />
          {statusLabel && <Detail label="Статус" value={statusLabel} />}
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

function accountsByIds(users: AccountUser[], ids: string[]) {
  return ids.flatMap((id) => {
    const account = users.find((item) => item.id === id)
    return account ? [account] : []
  })
}

function audienceKind(role: Role) {
  return role === 'seller' || role === 'admin' ? 'Дизайнер' : 'Пользователь'
}

function PeopleList({ people, empty }: { people: AccountUser[]; empty: string }) {
  if (people.length === 0) return <p className="text-sm text-slate-500">{empty}</p>
  return (
    <ul className="grid max-w-lg gap-2">
      {people.map((person) => (
        <li key={person.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-950">{person.name}</p>
            {person.handle && <p className="truncate text-sm text-slate-500">{person.handle}</p>}
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{audienceKind(person.role)}</span>
        </li>
      ))}
    </ul>
  )
}
