import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { cn } from '@/lib/cn'
import { scrollToId, scrollToTop } from '@/lib/scrollTo'

export function AppLayout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => scrollToId(hash.slice(1)))
      return
    }
    requestAnimationFrame(() => scrollToTop())
  }, [pathname, hash])

  return (
    <div className="flex min-h-svh flex-col bg-surface text-ink">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollTop />
    </div>
  )
}

function ScrollTop() {
  const [visible, setVisible] = useState(false)
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()

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
        if (pathname !== '/' || hash) navigate('/')
        else scrollToTop()
      }}
      className={cn(
        'fixed bottom-6 right-6 z-40 grid size-12 place-items-center rounded-full bg-violet-600 text-white shadow-[0_10px_24px_rgba(109,40,217,0.35)] transition duration-300 hover:bg-violet-700',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp className="size-5" />
    </button>
  )
}
