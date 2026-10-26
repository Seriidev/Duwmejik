import { Menu, X } from 'lucide-react'
import logoBell from '@/assets/logo-bell.png'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { markManualScroll, scrollToId, scrollToTop } from '@/lib/scrollTo'
import { useHash } from '@/lib/useHash'
import { useAuthStore } from '@/store/useAuthStore'
import { LanguageMenu } from '@/components/LanguageMenu'
import { useCopy, useLocaleStore } from '@/store/useLocaleStore'

export function Header() {
  const user = useAuthStore((state) => state.user)
  const t = useCopy()
  const locale = useLocaleStore((state) => state.locale)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const pathname = usePathname()
  const hash = useHash()
  const router = useRouter()
  const [visible, setVisible] = useState('')
  const onHome = pathname === '/'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!onHome) return
    const ids = ['products', 'about', 'designers', 'contacts']
    const pick = () => {
      const marker = 120
      let current = ''
      for (const id of ids) {
        const node = document.getElementById(id)
        if (node && node.getBoundingClientRect().top <= marker) current = id
      }
      setVisible((prev) => (prev === current ? prev : current))
    }
    pick()
    window.addEventListener('scroll', pick, { passive: true })
    window.addEventListener('hashchange', pick)
    return () => {
      window.removeEventListener('scroll', pick)
      window.removeEventListener('hashchange', pick)
    }
  }, [onHome])

  const links = [
    { to: '/', label: t.home, active: onHome ? visible === '' : false },
    { to: '/#products', label: t.products, active: onHome ? visible === 'products' : hash === '#products' },
    { to: '/#about', label: t.about, active: onHome ? visible === 'about' : hash === '#about' },
    {
      to: '/#designers',
      label: locale === 'ru' ? 'Дизайнерам' : locale === 'tk' ? 'Dizaýnerlere' : 'Designers',
      active: onHome ? visible === 'designers' : hash === '#designers',
    },
    {
      to: '/#contacts',
      label: locale === 'ru' ? 'Контакт' : locale === 'tk' ? 'Kontakt' : 'Contact',
      active: onHome ? visible === 'contacts' : hash === '#contacts',
    },
  ]

  function onSectionClick(event: { preventDefault: () => void }, to: string) {
    event.preventDefault()
    const id = to === '/' ? '' : to.slice(2)
    if (pathname === '/') {
      const nextUrl = id ? `/#${id}` : '/'
      if (`${window.location.pathname}${window.location.hash}` !== nextUrl) {
        markManualScroll()
        window.history.pushState(null, '', nextUrl)
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      }
      if (id) scrollToId(id)
      else scrollToTop()
      return
    }
    if (id) sessionStorage.setItem('duwmejik-pending-scroll', id)
    else sessionStorage.removeItem('duwmejik-pending-scroll')
    router.push('/', { scroll: false })
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 px-3 pt-3 backdrop-blur-md sm:px-6 sm:pt-4">
      <div className="relative z-10 mx-auto flex h-14 max-w-[1180px] items-center gap-2 rounded-full bg-white px-2 shadow-[0_8px_30px_rgba(20,24,40,0.06)] sm:h-[68px] sm:gap-3 sm:px-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex items-center gap-2 pl-1.5 font-bold tracking-tight text-neutral-950">
          <img src={logoBell.src} alt="" className="size-9 object-contain" />
          <span className="text-[16px]">Duwmejik</span>
        </Link>

        <nav className="hidden items-center justify-center gap-4 lg:flex xl:gap-7">
          {links.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              onClick={(event) => onSectionClick(event, link.to)}
                className={cn(
                  'whitespace-nowrap text-[15px] font-medium hover:text-brand',
                  link.active ? 'text-brand underline decoration-2 underline-offset-[7px]' : 'text-[#8B919C]',
                )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center justify-end gap-1 pr-1 lg:ml-0">
          <LanguageMenu trigger="plain" />

          <Link
            href={user ? '/account' : '/login'}
            aria-label={user ? user.name : t.login}
            className={cn(
              'hidden items-center justify-center rounded-full bg-brand text-sm font-semibold text-white lg:inline-flex',
              user ? 'size-10 overflow-hidden' : 'h-10 px-3.5 text-[13px] sm:px-5 sm:text-sm',
            )}
          >
            {user ? (
              user.avatar ? (
                <img src={user.avatar} alt="" className="size-full object-cover" />
              ) : (
                (user.name.trim()[0] ?? 'A').toUpperCase()
              )
            ) : (
              t.login
            )}
          </Link>

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

      {mounted &&
        menuOpen &&
        createPortal(
          <div className="fixed inset-x-0 bottom-0 top-[68px] z-[60] sm:top-[84px] lg:hidden">
          <button type="button" aria-label={t.menuClose} className="absolute inset-0 bg-slate-950/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-x-3 top-2 max-h-[calc(100%-1rem)] overflow-y-auto rounded-3xl bg-white p-3 shadow-[0_16px_50px_rgba(15,23,42,0.18)]">
            <div className="grid gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  href={link.to}
                  className={cn(
                    'rounded-2xl px-3 py-2.5 font-medium hover:text-brand',
                    link.active ? 'text-brand' : 'text-neutral-700',
                  )}
                  onClick={(event) => {
                    setMenuOpen(false)
                    onSectionClick(event, link.to)
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <Link
              href={user ? '/account' : '/login'}
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex items-center gap-3 rounded-2xl border-t border-slate-100 px-3 py-3"
            >
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand text-sm font-semibold text-white">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="size-full object-cover" />
                ) : (
                  (user?.name.trim()[0] ?? t.login.trim()[0] ?? 'A').toUpperCase()
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-neutral-950">{user ? user.name : t.login}</span>
                {user && <span className="block text-xs text-slate-400">{t.account}</span>}
              </span>
            </Link>
          </div>
        </div>,
          document.body,
        )}
    </header>
  )
}
