'use client'

import { Menu, Moon, Sun, UserRound, type LucideIcon } from 'lucide-react'
import logoBell from '@/assets/logo-bell.png'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LanguageMenu } from '@/components/LanguageMenu'
import { cn } from '@/lib/cn'
import { useAuthStore } from '@/store/useAuthStore'
import { useCopy, useLocaleStore } from '@/store/useLocaleStore'
import { useThemeStore } from '@/store/useThemeStore'

export type SideMenuItem = {
  id: string
  label: string
  short?: string
  icon: LucideIcon
  active?: boolean
  separator?: boolean
  onClick: () => void
}

export function SideMenu({
  expanded,
  onToggle,
  items,
  loginHref,
}: {
  expanded: boolean
  onToggle: () => void
  items: SideMenuItem[]
  loginHref: string
}) {
  const user = useAuthStore((state) => state.user)
  const t = useCopy()
  const locale = useLocaleStore((state) => state.locale)
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const dark = theme === 'dark'
  const [narrow, setNarrow] = useState(false)

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
                  <Icon className={expanded ? 'size-[22px] shrink-0' : 'size-5 shrink-0'} strokeWidth={1.75} />
                  <span className={cn('truncate', expanded ? 'text-[15px]' : 'w-full whitespace-nowrap text-center text-[10px] leading-none')}>
                    {expanded ? item.label : item.short ?? item.label}
                  </span>
                </button>
              </div>
            )
          })}
        </nav>

        <div className={cn('px-3 pt-3', !expanded && 'flex justify-center px-0')}>
          <div
            className={cn(
              'flex rounded-full p-1',
              expanded ? 'w-full flex-row' : 'w-11 flex-col',
              dark ? 'bg-white/10' : 'bg-[#f2f2f2]',
            )}
          >
            <button
              type="button"
              aria-label={themeCopy.light}
              aria-pressed={theme === 'light'}
              onClick={() => setTheme('light')}
              className={cn(
                'grid place-items-center rounded-full transition',
                expanded ? 'h-10 flex-1' : 'size-9',
                theme === 'light' ? 'bg-white text-[#111] shadow-[0_1px_4px_rgba(0,0,0,0.16)]' : dark ? 'text-white/70' : 'text-[#6b6b6b]',
              )}
            >
              <Sun className="size-[18px]" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label={themeCopy.dark}
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme('dark')}
              className={cn(
                'grid place-items-center rounded-full transition',
                expanded ? 'h-10 flex-1' : 'size-9',
                theme === 'dark' ? 'bg-white text-[#111] shadow-[0_1px_4px_rgba(0,0,0,0.16)]' : dark ? 'text-white/70' : 'text-[#6b6b6b]',
              )}
            >
              <Moon className="size-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className={cn('flex items-center px-2 pb-1 pt-3', expanded ? 'gap-1' : 'justify-center')}>
          <Link
            href={user ? '/account' : loginHref}
            title={expanded ? undefined : user?.name ?? t.login}
            className={cn(
              'flex min-w-0 items-center rounded-xl',
              expanded ? 'h-12 flex-1 gap-3 px-3' : 'justify-center',
              expanded && (dark ? 'hover:bg-white/10' : 'hover:bg-[#f2f2f2]'),
            )}
          >
            {user ? (
              <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e8e8e8] text-xs font-semibold text-[#333]">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="size-full object-cover" />
                ) : (
                  user.name
                    .split(' ')
                    .slice(0, 2)
                    .map((part) => part[0] ?? '')
                    .join('')
                    .toUpperCase() || 'A'
                )}
              </span>
            ) : (
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', dark ? 'bg-white/10 text-white' : 'bg-[#f2f2f2] text-[#333]')}>
                <UserRound className="size-5" strokeWidth={1.75} />
              </span>
            )}
            {expanded && (
              <span className="truncate text-sm font-semibold">{user ? user.name : t.login}</span>
            )}
          </Link>
          {expanded && (
            <LanguageMenu
              direction="up"
              trigger="dots"
              triggerClassName={dark ? 'text-white/70 hover:bg-white/10' : undefined}
            />
          )}
        </div>
      </aside>
    </>
  )
}
