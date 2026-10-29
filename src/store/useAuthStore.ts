import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createId } from '@/lib/format'
import type { AccountUser, Role, SessionUser } from '@/types'

interface AuthState {
  users: AccountUser[]
  user: SessionUser | null
  login: (email: string, password: string) => string | null
  logout: () => void
  register: (name: string, email: string, password: string) => string | null
  setRole: (id: string, role: Role) => void
  updateProfile: (patch: Partial<Pick<SessionUser, 'name' | 'email' | 'phone' | 'company' | 'city' | 'address' | 'avatar' | 'handle'>>) => string | null
  changePassword: (currentPassword: string, nextPassword: string) => string | null
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
    name: 'Кирилл Админ',
    email: 'admin@duwmejik.ru',
    role: 'admin',
    password: 'demo',
    phone: '',
    company: '',
    city: 'Ашхабад',
    address: '',
    handle: '@admin',
  },
]

export function normalizeHandle(value: string) {
  const body = value.trim().replace(/\s/g, '').replace(/@/g, '')
  return body ? `@${body}` : ''
}

function withHandle(account: AccountUser): AccountUser {
  if (account.handle) return account
  if (account.id === 'u-seller') return { ...account, handle: '@nord' }
  if (account.id === 'u-admin') return { ...account, handle: '@admin' }
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
  }
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
      logout: () => set({ user: null }),
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
          if (!/^@[A-Za-z0-9_]{2,24}$/.test(handle)) return 'ID начинается с @. Дальше латинские буквы, цифры или _'
          const taken = get().users.some(
            (item) => item.id !== current.id && (item.handle ?? '').toLowerCase() === handle!.toLowerCase(),
          )
          if (taken) return 'Такой ID уже есть'
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
      setRole: (id, role) => {
        const users = get().users.map((item) => (item.id === id ? { ...item, role } : item))
        const current = get().user
        const nextUser =
          current?.id === id ? { ...current, role } : current
        set({ users, user: nextUser })
      },
    }),
    {
      name: 'duwmejik-auth',
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AuthState>
        const users = (saved.users ?? current.users).map((item) => withHandle(item))
        const user = saved.user ? toSession(users.find((item) => item.id === saved.user?.id) ?? { ...saved.user, password: '' }) : null
        return { ...current, ...saved, users, user }
      },
    },
  ),
)
