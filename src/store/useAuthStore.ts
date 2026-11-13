import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ADMIN_PASSWORD } from '@/features/admin/adminPassword'
import { createId } from '@/lib/format'
import type { AccountUser, Role, SessionUser } from '@/types'

export const HANDLE_PATTERN = /^@[A-Za-z0-9_]{2,24}$/

export interface DesignerApplication {
  handle: string
  specialty: string
  about: string
}

interface AuthState {
  users: AccountUser[]
  user: SessionUser | null
  login: (email: string, password: string) => string | null
  loginAdmin: (password: string, id?: 'u-admin' | 'u-workshop' | 'u-boss') => string | null
  logout: () => void
  deleteAccount: () => void
  register: (name: string, email: string, password: string) => string | null
  setRole: (id: string, role: Role) => void
  addAdmin: (name: string, email: string) => string | null
  removeAdmin: (id: string) => string | null
  updateProfile: (patch: Partial<Pick<SessionUser, 'name' | 'email' | 'phone' | 'company' | 'city' | 'address' | 'avatar' | 'handle'>>) => string | null
  changePassword: (currentPassword: string, nextPassword: string) => string | null
  applyDesigner: (application: DesignerApplication) => string | null
  reviewDesigner: (id: string, approve: boolean, note: string) => string | null
}

const seedUsers: AccountUser[] = [
  {
    id: 'u-buyer',
    name: 'Алина Соколова',
    email: 'buyer@duwmejik.ru',
    role: 'buyer',
    password: 'demo',
    phone: '',
    company: '',
    city: 'Ашхабад',
    address: '',
    handle: '',
  },
  {
    id: 'u-seller',
    name: 'Студия Норд',
    email: 'seller@duwmejik.ru',
    role: 'seller',
    password: 'demo',
    phone: '',
    company: 'Студия Норд',
    city: 'Ашхабад',
    address: '',
    handle: '@nord',
  },
  {
    id: 'u-admin',
    name: 'admin1',
    email: 'admin1@duwmejik.ru',
    role: 'admin',
    password: 'demo',
    phone: '',
    company: '',
    city: 'Ашхабад',
    address: '',
    handle: '@admin1',
  },
  {
    id: 'u-workshop',
    name: 'admin2',
    email: 'admin2@duwmejik.ru',
    role: 'admin',
    password: 'demo',
    phone: '',
    company: '',
    city: 'Ашхабад',
    address: '',
    handle: '@admin2',
  },
  {
    id: 'u-boss',
    name: 'Руководитель',
    email: 'boss@duwmejik.ru',
    role: 'superadmin',
    password: 'demo',
    phone: '',
    company: '',
    city: 'Ашхабад',
    address: '',
    handle: '',
  },
]

export function normalizeHandle(value: string) {
  const body = value.trim().replace(/\s/g, '').replace(/@/g, '')
  return body ? `@${body}` : ''
}

function normalizeAccount(account: AccountUser): AccountUser {
  const legacyWorkshop = (account.role as string) === 'workshop'
  const demoName = ['кирилл админ', 'админ 1', 'админ 2', 'admin 1', 'admin 2'].includes(account.name.trim().toLowerCase())
  const admin1 = account.id === 'u-admin'
  const admin2 = account.id === 'u-workshop'
  return {
    ...account,
    role: legacyWorkshop ? 'admin' : account.role,
    ...(admin1 && account.email === 'admin@duwmejik.ru' ? { email: 'admin1@duwmejik.ru' } : {}),
    ...(admin2 && (account.email === 'ceh@duwmejik.ru' || account.email === 'admin2@duwmejik.ru') ? { email: 'admin2@duwmejik.ru' } : {}),
    ...(admin1 && demoName ? { name: 'admin1' } : {}),
    ...(admin2 && demoName ? { name: 'admin2' } : {}),
  }
}

function withHandle(account: AccountUser): AccountUser {
  if (account.role === 'admin' || account.role === 'superadmin') return { ...account, handle: '' }
  if (account.handle) return account
  if (account.id === 'u-seller') return { ...account, handle: '@nord' }
  return { ...account, handle: '' }
}

function toSession(account: AccountUser): SessionUser {
  const ready = withHandle(account)
  return {
    id: ready.id,
    name: ready.name,
    email: ready.email,
    role: ready.role,
    phone: ready.phone ?? '',
    company: ready.company ?? '',
    city: ready.city ?? '',
    address: ready.address ?? '',
    handle: ready.handle ?? '',
    avatar: ready.avatar ?? '',
    designerRequest: ready.designerRequest,
  }
}

function handleTaken(users: AccountUser[], handle: string, exceptId: string) {
  const wanted = handle.toLowerCase()
  return users.some(
    (item) =>
      item.id !== exceptId &&
      ((item.handle ?? '').toLowerCase() === wanted ||
        (item.designerRequest?.status === 'pending' && item.designerRequest.handle.toLowerCase() === wanted)),
  )
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      user: null,
      login: (email, password) => {
        const account = get().users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase())
        if (!account || account.password !== password) return 'Неверная почта или пароль'
        set({ user: toSession(account) })
        return null
      },
      loginAdmin: (password, id = 'u-admin') => {
        if (password !== ADMIN_PASSWORD) return 'Неверный пароль'
        const account = get().users.find((item) => item.id === id && (item.role === 'admin' || item.role === 'superadmin'))
        if (!account) return 'Аккаунт админа не найден'
        set({ user: toSession(account) })
        return null
      },
      logout: () => set({ user: null }),
      deleteAccount: () => {
        const current = get().user
        if (!current) return
        set({ user: null, users: get().users.filter((item) => item.id !== current.id) })
      },
      register: (name, email, password) => {
        const cleanEmail = email.trim().toLowerCase()
        if (!name.trim() || !cleanEmail || password.length < 4) return 'Заполните имя, почту и пароль от 4 символов'
        if (get().users.some((item) => item.email.toLowerCase() === cleanEmail)) return 'Такая почта уже есть'
        const account: AccountUser = {
          id: createId('u'),
          name: name.trim(),
          email: cleanEmail,
          role: 'buyer',
          password,
          phone: '',
          company: '',
          city: 'Ашхабад',
          address: '',
          handle: '',
        }
        set({ users: [...get().users, account], user: toSession(account) })
        return null
      },
      updateProfile: (patch) => {
        const current = get().user
        if (!current) return 'Войдите снова'
        const email = patch.email?.trim().toLowerCase()
        if (email && !email.includes('@')) return 'Укажите почту'
        if (email && get().users.some((item) => item.id !== current.id && item.email.toLowerCase() === email)) {
          return 'Такая почта уже есть'
        }
        const name = patch.name?.trim()
        if (patch.name !== undefined && !name) return 'Укажите имя'
        let handle: string | undefined
        if (patch.handle !== undefined) {
          handle = normalizeHandle(patch.handle)
          if (!HANDLE_PATTERN.test(handle)) return 'Имя пользователя начинается с @. Дальше латинские буквы, цифры или _'
          if (handleTaken(get().users, handle, current.id)) return 'Такое имя пользователя уже есть'
        }
        const next = { ...patch, ...(email ? { email } : {}), ...(name ? { name } : {}), ...(handle ? { handle } : {}) }
        const users = get().users.map((item) => (item.id === current.id ? { ...item, ...next } : item))
        set({ users, user: { ...current, ...next } })
        return null
      },
      changePassword: (currentPassword, nextPassword) => {
        const current = get().user
        if (!current) return 'Войдите снова'
        const account = get().users.find((item) => item.id === current.id)
        if (!account || account.password !== currentPassword) return 'Текущий пароль неверный'
        if (nextPassword.length < 4) return 'Новый пароль — от 4 символов'
        if (nextPassword === currentPassword) return 'Новый пароль совпадает со старым'
        set({
          users: get().users.map((item) => (item.id === current.id ? { ...item, password: nextPassword } : item)),
        })
        return null
      },
      addAdmin: (name, email) => {
        const cleanName = name.trim()
        const cleanEmail = email.trim().toLowerCase()
        if (!cleanName || !cleanEmail.includes('@')) return 'Укажите имя и почту'
        if (get().users.some((item) => item.email.toLowerCase() === cleanEmail)) return 'Такая почта уже есть'
        const account: AccountUser = {
          id: createId('u'),
          name: cleanName,
          email: cleanEmail,
          role: 'admin',
          password: ADMIN_PASSWORD,
          phone: '',
          company: '',
          city: 'Ашхабад',
          address: '',
          handle: '',
        }
        set({ users: [...get().users, account] })
        return null
      },
      removeAdmin: (id) => {
        if (id === 'u-admin' || id === 'u-workshop' || id === 'u-boss') return 'Эту учётку убрать нельзя'
        const account = get().users.find((item) => item.id === id)
        if (!account || account.role !== 'admin') return 'Администратор не найден'
        if (get().user?.id === id) return 'Нельзя убрать свою учётку'
        set({ users: get().users.filter((item) => item.id !== id) })
        return null
      },
      setRole: (id, role) => {
        const users = get().users.map((item) => (item.id === id ? { ...item, role } : item))
        const current = get().user
        const nextUser =
          current?.id === id ? { ...current, role } : current
        set({ users, user: nextUser })
      },
      applyDesigner: ({ handle, specialty, about }) => {
        const current = get().user
        if (!current) return 'Войдите снова'
        if (current.role !== 'buyer') return 'Вы уже дизайнер'
        const cleanHandle = normalizeHandle(handle)
        if (!HANDLE_PATTERN.test(cleanHandle)) return 'Имя пользователя начинается с @. Дальше латинские буквы, цифры или _'
        if (handleTaken(get().users, cleanHandle, current.id)) return 'Такое имя пользователя уже есть'
        if (!specialty.trim()) return 'Выберите направление'
        const designerRequest = {
          handle: cleanHandle,
          specialty: specialty.trim(),
          about: about.trim(),
          status: 'pending' as const,
          note: '',
          createdAt: new Date().toISOString(),
        }
        set({
          users: get().users.map((item) => (item.id === current.id ? { ...item, designerRequest } : item)),
          user: { ...current, designerRequest },
        })
        return null
      },
      reviewDesigner: (id, approve, note) => {
        const account = get().users.find((item) => item.id === id)
        const request = account?.designerRequest
        if (!account || request?.status !== 'pending') return 'Заявка не найдена'
        if (approve && handleTaken(get().users, request.handle, id)) return 'Это имя пользователя уже занято. Отклоните заявку и попросите выбрать другое'
        const patch: Partial<AccountUser> = approve
          ? { role: 'seller', handle: request.handle, designerRequest: undefined }
          : { designerRequest: { ...request, status: 'rejected', note: note.trim() } }
        const users = get().users.map((item) => (item.id === id ? { ...item, ...patch } : item))
        const current = get().user
        set({ users, user: current?.id === id ? { ...current, ...patch } : current })
        return null
      },
    }),
    {
      name: 'duwmejik-auth',
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AuthState>
        const stored = (saved.users ?? current.users).map(normalizeAccount)
        const missing = seedUsers.filter((seed) => !stored.some((item) => item.id === seed.id || item.email === seed.email))
        const users = [...stored, ...missing].map((item) => withHandle(item))
        const user = saved.user ? toSession(users.find((item) => item.id === saved.user?.id) ?? { ...saved.user, password: '' }) : null
        return { ...current, ...saved, users, user }
      },
    },
  ),
)
