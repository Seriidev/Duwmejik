'use client'

import { ArrowUp } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { cn } from '@/lib/cn'
import { consumeManualScroll, markManualScroll, scrollToId, scrollToTop } from '@/lib/scrollTo'
import { useHash } from '@/lib/useHash'

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const hash = useHash()
  const dashboard = pathname.startsWith('/templates') || pathname.startsWith('/seller')
  const hostedQr = pathname === '/q'
  const profile = pathname === '/account' || pathname.startsWith('/designer')
  const bare = dashboard || hostedQr || profile

  useEffect(() => {
    if (consumeManualScroll()) return
    const pending = pathname === '/' ? sessionStorage.getItem('duwmejik-pending-scroll') : null
    if (pending) {
      sessionStorage.removeItem('duwmejik-pending-scroll')
      markManualScroll()
      window.history.replaceState(null, '', `/#${pending}`)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
      scrollToId(pending)
      return
    }
    if (pathname === '/' && hash) {
      scrollToId(hash.slice(1))
      return
    }
    scrollToTop()
  }, [pathname, hash])

  return (
    <div className={cn('flex min-h-svh flex-col text-ink', dashboard || profile ? 'bg-white' : 'bg-surface')}>
      {!bare && <Header />}
      <main className="flex-1">{children}</main>
      {!bare && <Footer />}
      {!bare && <ScrollTop />}
    </div>
  )
}

function ScrollTop() {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()
  const hash = useHash()
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      aria-label="На первый экран"
      onClick={() => {
        if (pathname !== '/' || hash) router.push('/')
        else scrollToTop()
      }}
      className={cn(
        'fixed bottom-6 right-6 z-40 grid size-12 place-items-center rounded-full bg-brand text-white shadow-[0_10px_24px_rgba(47,107,255,0.35)] transition duration-300 hover:brightness-110',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp className="size-5" />
    </button>
  )
}
