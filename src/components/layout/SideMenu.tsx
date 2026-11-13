'use client'

import { CircleHelp, Home, LogOut, Menu, Moon, MoreHorizontal, Settings, Sun, UserRound, type LucideIcon } from 'lucide-react'
import logoBell from '@/assets/logo-bell.png'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { dashboardFor, isStaff, roleLabel } from '@/lib/authHref'
import { useAuthStore } from '@/store/useAuthStore'
import { useCopy, useLocaleStore, type Locale } from '@/store/useLocaleStore'
import { useThemeStore } from '@/store/useThemeStore'

export type SideMenuItem = {
  id: string
  label: string
  short?: string
  icon: LucideIcon
  active?: boolean
  separator?: boolean
  badge?: number
  onClick: () => void
}

export function SideMenu({
  expanded,
  onToggle,
  items,
  loginHref,
  showAccount = true,
}: {
  expanded: boolean
  onToggle: () => void
  items: SideMenuItem[]
  loginHref: string
  showAccount?: boolean
}) {
  const t = useCopy()
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const dark = theme === 'dark'
  const [narrow, setNarrow] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)')
    const apply = () => setNarrow(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!expanded) return
    const wide = window.matchMedia('(min-width: 1024px)')
    if (wide.matches) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onToggle()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded, onToggle])

  useEffect(() => {
    if (!settingsOpen) return
    function onPointerDown(event: MouseEvent) {
      if (!settingsRef.current?.contains(event.target as Node)) setSettingsOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSettingsOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [settingsOpen])

  const settingsCopy =
    locale === 'en'
      ? { settings: 'Settings', short: 'Settings', help: 'Help' }
      : locale === 'tk'
        ? { settings: 'Sazlamalar', short: 'Sazlama', help: 'Kömek' }
        : { settings: 'Настройки', short: 'Настр.', help: 'Помощь' }

  const themeCopy =
    locale === 'en'
      ? { light: 'Light theme', dark: 'Dark theme' }
      : locale === 'tk'
        ? { light: 'Ýagty tema', dark: 'Garaňky tema' }
        : { light: 'Светлая тема', dark: 'Тёмная тема' }

  const itemClass = (active: boolean | undefined) =>
    cn(
      'flex items-center rounded-xl font-medium transition-colors',
      expanded ? 'h-10 w-full gap-4 px-3 text-[15px]' : 'w-full flex-col gap-1 rounded-2xl px-1 py-2',
      active
        ? dark
          ? 'bg-white/[0.12] text-white'
          : 'bg-[#f2f2f2] text-[#111]'
        : dark
          ? 'text-white hover:bg-white/10'
          : 'text-[#212121] hover:bg-[#f2f2f2]',
    )

  return (
    <>
      {expanded && (
        <button
          type="button"
          aria-label={t.menuClose}
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={onToggle}
        />
      )}
      <aside
        inert={narrow && !expanded}
        className={cn(
          'z-40 flex shrink-0 flex-col rounded-[28px] py-4 transition-[width,transform,background-color] duration-300 ease-out',
          'fixed bottom-3 left-3 top-3 lg:static lg:h-full lg:translate-x-0',
          expanded ? 'w-[280px] translate-x-0' : 'pointer-events-none w-[84px] -translate-x-[calc(100%+1.25rem)] lg:pointer-events-auto lg:translate-x-0',
          dark
            ? 'bg-[#212121] text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]'
            : 'bg-white text-[#111] shadow-[0_10px_36px_rgba(15,23,42,0.08)]',
        )}
      >
        <div className={cn('flex items-center', expanded ? 'gap-1 px-3' : 'justify-center')}>
          <button
            type="button"
            aria-label={expanded ? t.menuClose : t.menuOpen}
            onClick={onToggle}
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-full',
              dark ? 'hover:bg-white/10' : 'hover:bg-[#f2f2f2]',
            )}
          >
            <Menu className="size-6" strokeWidth={1.75} />
          </button>
          {expanded && (
            <Link href="/" className="flex min-w-0 items-center gap-2 pr-2">
              <img src={logoBell.src} alt="" className="size-8 object-contain" />
              <span className="truncate text-[17px] font-bold tracking-tight">Duwmejik</span>
            </Link>
          )}
        </div>

        <nav className={cn('mt-3 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto [scrollbar-width:thin]', expanded ? 'px-2' : 'items-center px-1')}>
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.id} className={expanded ? 'contents' : 'flex w-full flex-col items-center'}>
                {item.separator && (
                  <div className={cn('my-2 h-px shrink-0', expanded ? 'w-[calc(100%-1rem)] self-center' : 'w-8', dark ? 'bg-white/10' : 'bg-[#e6e6e6]')} />
                )}
                <button
                  type="button"
                  title={expanded ? undefined : item.label}
                  aria-current={item.active ? 'page' : undefined}
                  onClick={item.onClick}
                  className={itemClass(item.active)}
                >
                  <span className="relative shrink-0">
                    <Icon className={expanded ? 'size-[22px]' : 'size-5'} strokeWidth={1.75} />
                    {!expanded && item.badge ? <MenuBadge count={item.badge} floating /> : null}
                  </span>
                  <span className={cn('truncate', expanded ? 'text-[15px]' : 'w-full whitespace-nowrap text-center text-[10px] leading-none')}>
                    {expanded ? item.label : item.short ?? item.label}
                  </span>
                  {expanded && item.badge ? <MenuBadge count={item.badge} className="ml-auto" /> : null}
                </button>
              </div>
            )
          })}
        </nav>

        {showAccount && (
          <div className={cn('px-2 pt-3', expanded ? '' : 'flex justify-center')}>
            <AccountChip loginHref={loginHref} menu="up" compact={!expanded} />
          </div>
        )}
        <div ref={settingsRef} className={cn('relative mt-auto px-2 pb-2 pt-2', !expanded && 'flex justify-center px-1')}>
          <div className={cn('mb-2 h-px shrink-0', expanded ? 'mx-2' : 'w-8', dark ? 'bg-white/10' : 'bg-[#e6e6e6]')} />
          {settingsOpen && (
            <div
              className={cn(
                'grid gap-2 rounded-2xl p-2',
                expanded ? 'mb-2' : 'absolute bottom-0 left-full z-50 ml-2 w-56 shadow-[0_12px_32px_rgba(15,23,42,0.16)]',
                dark ? (expanded ? 'bg-white/10' : 'bg-[#2a2a2a]') : 'bg-[#f4f4f5]',
              )}
            >
              <Link
                href="/contacts"
                onClick={() => {
                  setSettingsOpen(false)
                  if (narrow) onToggle()
                }}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-xl px-3 text-[15px] font-medium',
                  dark ? 'text-white hover:bg-white/10' : 'text-[#212121] hover:bg-white',
                )}
              >
                <CircleHelp className="size-5 shrink-0" strokeWidth={1.75} />
                {settingsCopy.help}
              </Link>
              <div className={cn('flex gap-1 rounded-full p-1', dark ? 'bg-black/25' : 'bg-[#ececec]')}>
                {(['ru', 'en', 'tk'] as Locale[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setLocale(id)}
                    className={cn(
                      'h-8 flex-1 rounded-full text-[12px] font-semibold tracking-wide',
                      locale === id ? 'bg-white text-[#111] shadow-[0_1px_4px_rgba(0,0,0,0.12)]' : dark ? 'text-white/70' : 'text-[#6b6b6b]',
                    )}
                  >
                    {id.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className={cn('flex h-9 rounded-full p-0.5', dark ? 'bg-black/25' : 'bg-[#ececec]')}>
                <button
                  type="button"
                  aria-label={themeCopy.light}
                  aria-pressed={theme === 'light'}
                  onClick={() => setTheme('light')}
                  className={cn(
                    'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold transition',
                    theme === 'light' ? 'bg-white text-[#111] shadow-[0_1px_4px_rgba(0,0,0,0.16)]' : dark ? 'text-white/70' : 'text-[#6b6b6b]',
                  )}
                >
                  <Sun className="size-4" strokeWidth={1.75} />
                  {locale === 'en' ? 'Light' : locale === 'tk' ? 'Ýagty' : 'Светлая'}
                </button>
                <button
                  type="button"
                  aria-label={themeCopy.dark}
                  aria-pressed={theme === 'dark'}
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold transition',
                    theme === 'dark' ? 'bg-white text-[#111] shadow-[0_1px_4px_rgba(0,0,0,0.16)]' : dark ? 'text-white/70' : 'text-[#6b6b6b]',
                  )}
                >
                  <Moon className="size-4" strokeWidth={1.75} />
                  {locale === 'en' ? 'Dark' : locale === 'tk' ? 'Garaňky' : 'Тёмная'}
                </button>
              </div>
            </div>
          )}
          <button type="button" aria-expanded={settingsOpen} onClick={() => setSettingsOpen((open) => !open)} className={itemClass(settingsOpen)}>
            <Settings className={expanded ? 'size-[22px] shrink-0' : 'size-5 shrink-0'} strokeWidth={1.75} />
            <span className={cn('truncate', expanded ? 'text-[15px]' : 'w-full whitespace-nowrap text-center text-[10px] leading-none')}>
              {expanded ? settingsCopy.settings : settingsCopy.short}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}

export function AccountChip({
  loginHref,
  menu = 'down',
  compact = false,
  className,
}: {
  loginHref: string
  menu?: 'up' | 'down'
  compact?: boolean
  className?: string
}) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const t = useCopy()
  const locale = useLocaleStore((state) => state.locale)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const staff = Boolean(user && isStaff(user.role))
  const accountHref = user ? (staff ? dashboardFor(user.role) : '/account') : loginHref
  const accountName = user ? (staff ? roleLabel(user.role) : user.name) : t.login
  const copy =
    locale === 'en'
      ? { home: 'Home page', profile: 'View profile', help: 'Help', logout: 'Log out', login: 'Log in' }
      : locale === 'tk'
        ? { home: 'Baş sahypa', profile: 'Profil', help: 'Kömek', logout: 'Çykmak', login: 'Girmek' }
        : { home: 'Главная', profile: 'Профиль', help: 'Помощь', logout: 'Выйти', login: 'Войти' }

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative flex items-center', compact ? 'justify-center' : 'gap-1', className)}>
      <Link
        href={accountHref}
        title={compact ? accountName : undefined}
        className={cn('flex min-w-0 items-center rounded-full', compact ? 'justify-center' : 'h-11 gap-2.5 px-1.5 hover:bg-slate-50')}
      >
        <ProfileMark user={user ? { ...user, name: accountName } : null} />
        {!compact && <span className="max-w-[9rem] truncate text-sm font-semibold">{accountName}</span>}
      </Link>
      {!compact && (
        <button
          type="button"
          aria-label="Account menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"
        >
          <MoreHorizontal className="size-5" />
        </button>
      )}
      {!compact && open && (
        <div className={cn('absolute right-0 z-50 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-800 shadow-[0_12px_28px_rgba(15,23,42,0.12)]', menu === 'up' ? 'bottom-full mb-2' : 'top-full mt-2')}>
          <AccountLink href="/" icon={Home} label={copy.home} onPick={() => setOpen(false)} />
          <AccountLink href={accountHref} icon={UserRound} label={staff ? accountName : copy.profile} onPick={() => setOpen(false)} />
          <AccountLink href="/contacts" icon={CircleHelp} label={copy.help} onPick={() => setOpen(false)} />
          <div className="mx-2.5 my-0.5 h-px bg-slate-100" />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              if (user) logout()
              router.push('/login')
            }}
            className="flex h-8 w-full items-center gap-2 px-2.5 text-left text-[13px] font-medium text-slate-800 hover:bg-slate-50"
          >
            <LogOut className="size-4 text-slate-500" strokeWidth={1.75} />
            {user ? copy.logout : copy.login}
          </button>
        </div>
      )}
    </div>
  )
}

function ProfileMark({ user }: { user: { name: string; avatar?: string } | null }) {
  if (!user) {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f2f2f2] text-[#333]">
        <UserRound className="size-5" strokeWidth={1.75} />
      </span>
    )
  }
  const letters = user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase() || 'A'
  return (
    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e8e8e8] text-xs font-semibold text-[#333]">
      {user.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : letters}
    </span>
  )
}

function MenuBadge({ count, floating = false, className }: { count: number; floating?: boolean; className?: string }) {
  return (
    <span className={cn('grid min-w-5 shrink-0 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold leading-5 text-white', floating && 'absolute -right-2 -top-2', className)}>
      {count > 9 ? '9+' : count}
    </span>
  )
}

function AccountLink({
  href,
  icon: Icon,
  label,
  onPick,
}: {
  href: string
  icon: LucideIcon
  label: string
  onPick: () => void
}) {
  return (
    <Link href={href} onClick={onPick} className="flex h-8 items-center gap-2 px-2.5 text-[13px] font-medium text-slate-800 hover:bg-slate-50">
      <Icon className="size-4 text-slate-500" strokeWidth={1.75} />
      {label}
    </Link>
  )
}
