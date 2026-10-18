import Link from 'next/link'
import { buttonClass } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Страница не найдена</h1>
      <Link href="/" className={buttonClass('primary', 'md', 'mt-6')}>
        На главную
      </Link>
    </div>
  )
}
