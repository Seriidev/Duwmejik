import { Menu, X } from 'lucide-react'
import logoBell from '@/assets/logo-bell.png'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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

  const pathname = usePathname()
  const hash = useHash()
  const router = useRouter()
  const [visible, setVisible] = useState('')
  const onHome = pathname === '/'

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
    <header className="sticky top-0 z-40 bg-white/90 px-3 pt-3 backdrop-blur-md sm:px-6 sm:pt-4">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-2 rounded-full bg-white px-2 shadow-[0_8px_30px_rgba(20,24,40,0.06)] sm:h-[68px] sm:gap-3 sm:px-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
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
              'inline-flex items-center justify-center rounded-full bg-brand text-sm font-semibold text-white',
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

      {menuOpen && (
        <div className="mx-auto mt-2 max-w-[1180px] rounded-3xl bg-white p-3 shadow-[0_10px_40px_rgba(15,23,42,0.08)] lg:hidden">
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
        </div>
      )}
    </header>
  )
}
