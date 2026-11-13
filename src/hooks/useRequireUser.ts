import { useRouter } from 'next/navigation'
import { authHref } from '@/lib/authHref'
import { useAuthStore } from '@/store/useAuthStore'

export function useRequireUser() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  return (from?: string) => {
    if (user) return true
    router.push(authHref(from ?? `${window.location.pathname}${window.location.search}`))
    return false
  }
}
