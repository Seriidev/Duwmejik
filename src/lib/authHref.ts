import type { Role } from '@/types'

export function authHref(from: string, mode: 'login' | 'register' = 'register') {
  return `/login?mode=${mode}&from=${encodeURIComponent(from)}`
}

export function safeFrom(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login') ? value : null
}

export function isStaff(role: Role) {
  return role === 'admin' || role === 'superadmin'
}

export function roleLabel(role: Role) {
  if (role === 'superadmin') return 'Суперадмин'
  if (role === 'admin') return 'Администратор'
  return ''
}

export function dashboardFor(role: Role) {
  if (role === 'superadmin') return '/superadmin/prices'
  if (isStaff(role)) return '/admin'
  if (role === 'seller') return '/seller'
  return '/templates'
}
