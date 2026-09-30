import { Menu, X } from 'lucide-react'
import logoBell from '@/assets/logo-bell.png'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { scrollToId, scrollToTop } from '@/lib/scrollTo'
import { useAuthStore } from '@/store/useAuthStore'
import { useCopy, useLocaleStore, type Locale } from '@/store/useLocaleStore'

export function Header() {
  const user = useAuthStore((state) => state.user)
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  const t = useCopy()
  const [menuOpen, setMenuOpen] = useState(false)

  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const links = [
    { to: '/', label: t.home, active: pathname === '/' && hash !== '#about' && hash !== '#contacts' && hash !== '#fresh' },
    { to: '/#about', label: t.about, active: hash === '#about' },
    { to: '/#fresh', label: t.ourCatalog, active: hash === '#fresh' },
    { to: '/#contacts', label: t.contacts, active: hash === '#contacts' },
  ]

  function onSectionClick(event: { preventDefault: () => void }, to: string) {
    event.preventDefault()
    const here = `${pathname}${hash}`
    if (to === '/' && pathname === '/' && !hash) {
      scrollToTop()
      return
    }
    if (here === to) {
      scrollToId(to.slice(2))
      return
    }
    navigate(to)
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <div className="flex h-[68px] min-w-0 flex-1 items-center gap-3 rounded-full bg-white px-2.5 shadow-[0_10px_40px_rgba(15,23,42,0.08)] sm:px-3 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <Link to="/" className="flex items-center gap-2 pl-1.5 font-bold tracking-tight text-neutral-950">
            <img src={logoBell} alt="Duwmejik" className="size-12 object-contain" />
            <span className="text-[17px]">Duwmejik</span>
          </Link>

          <nav className="hidden items-center justify-center gap-5 lg:flex xl:gap-8">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={(event) => onSectionClick(event, link.to)}
                className={cn(
                  'whitespace-nowrap text-[15px] font-medium text-neutral-500 transition hover:text-neutral-950',
                  link.active && 'text-neutral-950',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center justify-end gap-1.5 pr-1 lg:ml-0">
            <div className="flex h-10 items-center rounded-full bg-slate-100 p-1">
              {(['tk', 'ru'] as Locale[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={cn(
                    'h-8 rounded-full px-3 text-sm font-semibold tracking-wide transition',
                    locale === code ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600',
                  )}
                >
                  {code === 'ru' ? 'RU' : 'TM'}
                </button>
              ))}
            </div>

            {user ? (
            <Link
              to="/account"
              className="grid size-10 place-items-center rounded-full bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
              aria-label={t.profile}
            >
              {user.name.slice(0, 1)}
            </Link>
          ) : (
            <Link
              to="/login"
              className="grid size-10 place-items-center rounded-full bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
              aria-label={t.login}
            >
              A
            </Link>
          )}

            <button
              type="button"
              className="grid size-10 place-items-center rounded-full text-neutral-800 hover:bg-neutral-100 lg:hidden"
              aria-label={menuOpen ? t.menuClose : t.menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="mx-auto mt-2 max-w-6xl rounded-3xl bg-white p-3 shadow-[0_10px_40px_rgba(15,23,42,0.08)] lg:hidden">
          <div className="grid gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-2xl px-3 py-2.5 font-medium text-neutral-700"
                onClick={(event) => {
                  setMenuOpen(false)
                  onSectionClick(event, link.to)
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

