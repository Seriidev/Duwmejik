import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import { AppLayout } from '@/components/layout/AppLayout'
import '@/index.css'

export const metadata: Metadata = {
  title: 'Duwmejik — типография и дизайн',
  description: 'Duwmejik — шаблоны, печать и дизайн на заказ',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
