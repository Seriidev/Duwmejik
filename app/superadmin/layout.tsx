'use client'

import type { ReactNode } from 'react'
import { SuperadminShell } from '@/features/superadmin/SuperadminShell'

export default function SuperadminLayout({ children }: { children: ReactNode }) {
  return <SuperadminShell>{children}</SuperadminShell>
}
