'use client'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import { BarChart3, FolderUp, LogOut, Receipt, Sparkles, Star, Tags, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import logoBell from '@/assets/logo-bell.png'
import { AdminLogin } from '@/features/admin/AdminLogin'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/useAuthStore'

const items = [
  { href: '/superadmin/reports', label: 'Отчётность', icon: BarChart3 },
  { href: '/superadmin/designers', label: 'Дизайнеры', icon: Star },
  { href: '/superadmin/admins', label: 'Администраторы', icon: Users },
  { href: '/superadmin/files', label: 'Передача файлов', icon: FolderUp },
  { href: '/superadmin/prices', label: 'Тарифы и цены печати', icon: Tags },
  { href: '/superadmin/accounting', label: 'Заказы и бухгалтерия', icon: Receipt },
  { href: '/superadmin/settings', label: 'Настройки платформы', icon: Sparkles },
]

export function SuperadminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setReady(true))
  }, [])

  if (!ready) return <div className="min-h-svh bg-[#f6f7f9]" />
  if (!user || user.role !== 'superadmin') return <AdminLogin seat="u-boss" />

  const letter = 'С'

  return (
    <div className="flex min-h-svh min-w-[1280px] bg-[#f6f7f9] text-[#0e1116]" style={{ fontFamily: 'Inter, Manrope, sans-serif' }}>
      <aside className="sticky top-0 flex h-svh w-[260px] shrink-0 flex-col border-r border-[#e4e7ec] bg-white px-4 py-5">
        <Link href="/superadmin/prices" className="flex items-center gap-2 px-2">
          <img src={logoBell.src} alt="" className="size-9 object-contain" />
          <span className="text-[16px] font-semibold tracking-tight">Duwmejik</span>
        </Link>
        <nav className="mt-6 grid gap-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium',
                  active ? 'bg-[#efe9ff] text-[#4f26c9]' : 'text-[#5b6472] hover:bg-[#f6f7f9]',
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 px-2 pt-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#14161c] text-sm font-semibold text-white">{letter}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">Суперадмин</span>
          </span>
          <button
            type="button"
            aria-label="Выйти"
            onClick={logout}
            className="grid size-8 place-items-center rounded-lg text-[#8a93a1] hover:bg-[#f6f7f9]"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 px-10 py-8">{children}</div>
    </div>
  )
}
