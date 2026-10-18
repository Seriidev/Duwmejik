'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function useHash() {
  const pathname = usePathname()
  const [hash, setHash] = useState('')

  useEffect(() => {
    const read = () => setHash(window.location.hash)
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [pathname])

  return hash
}
