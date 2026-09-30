import { Link } from 'react-router-dom'
import { useCopy } from '@/store/useLocaleStore'

export function ViewTabs() {
  const t = useCopy()
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link to="/order" className="order-glow inline-flex rounded-full px-9 py-3.5 text-base font-semibold text-white">
        {t.order}
      </Link>
      <Link
        to="/catalog"
        className="inline-flex rounded-full bg-white px-9 py-3.5 text-base font-semibold text-slate-900 shadow-[0_10px_30px_rgba(37,99,235,0.12)]"
      >
        {t.catalog}
      </Link>
    </div>
  )
}
