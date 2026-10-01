import type { IconType } from 'react-icons'
import {
  HiOutlineBookOpen,
  HiOutlineClipboardDocumentList,
  HiOutlineCreditCard,
  HiOutlineCube,
  HiOutlineEnvelope,
  HiOutlineFlag,
  HiOutlineNewspaper,
  HiOutlinePencil,
  HiOutlineTag,
} from 'react-icons/hi2'
import { MdCoffee, MdMenuBook, MdStickyNote2 } from 'react-icons/md'
import { Link } from 'react-router-dom'
import type { Category } from '@/types'

const categoryIcons: Record<string, IconType> = {
  cards: HiOutlineCreditCard,
  brochures: HiOutlineBookOpen,
  books: MdMenuBook,
  mugs: MdCoffee,
  pens: HiOutlinePencil,
  notebooks: MdStickyNote2,
  forms: HiOutlineClipboardDocumentList,
  banners: HiOutlineFlag,
  flyers: HiOutlineNewspaper,
  packaging: HiOutlineCube,
  stickers: HiOutlineTag,
  postcards: HiOutlineEnvelope,
}

const iconTone: Record<string, string> = {
  cards: 'text-blue-500',
  brochures: 'text-violet-500',
  books: 'text-emerald-500',
  mugs: 'text-orange-500',
  pens: 'text-sky-500',
  notebooks: 'text-teal-500',
  forms: 'text-blue-500',
  banners: 'text-violet-500',
  flyers: 'text-rose-500',
  packaging: 'text-amber-500',
  stickers: 'text-fuchsia-500',
  postcards: 'text-violet-500',
}

export function CategoryPill({ category, active = false }: { category: Category; active?: boolean }) {
  const Icon = categoryIcons[category.id] ?? HiOutlineTag
  const delay = [...category.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 8
  return (
    <Link
      to={`/catalog?category=${category.id}`}
      className={`flex h-full min-h-[72px] w-full items-center gap-3 rounded-2xl bg-white px-3.5 py-3 shadow-[0_8px_24px_rgba(55,70,120,0.06)] transition hover:shadow-[0_12px_28px_rgba(55,70,120,0.1)] ${active ? 'ring-2 ring-blue-600' : 'ring-1 ring-white'}`}
    >
      <span
        className="category-icon grid size-10 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: category.color, animationDelay: `${delay * 0.18}s` }}
      >
        <Icon className={`size-5 ${iconTone[category.id] ?? 'text-slate-600'}`} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium leading-tight text-slate-800">{category.title}</span>
    </Link>
  )
}
