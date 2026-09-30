import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TemplateArt } from '@/components/TemplateArt'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/cn'
import { useCatalogStore } from '@/store/useCatalogStore'

export function SearchBox({
  value,
  onSubmit,
  large = false,
  showFilters = false,
  placeholder = 'Искать что угодно…',
}: {
  value?: string
  onSubmit?: (query: string) => void
  large?: boolean
  showFilters?: boolean
  placeholder?: string
}) {
  const navigate = useNavigate()
  const products = useCatalogStore((state) => state.products)
  const categories = useCatalogStore((state) => state.categories)
  const external = value ?? ''
  const [tracked, setTracked] = useState(external)
  const [text, setText] = useState(external)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const debounced = useDebouncedValue(text, 300)

  if (value !== undefined && external !== tracked) {
    setTracked(external)
    setText(external)
  }

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  const suggestions = useMemo(() => {
    const query = debounced.trim().toLowerCase()
    if (!query) return []
    return products
      .filter((item) => item.status === 'published')
      .filter((item) => {
        const category = categories.find((entry) => entry.id === item.categoryId)?.title ?? ''
        return `${item.title} ${item.description} ${item.tags.join(' ')} ${item.author} ${category}`.toLowerCase().includes(query)
      })
      .slice(0, 6)
  }, [debounced, products, categories])

  function submit(query: string) {
    setOpen(false)
    if (onSubmit) onSubmit(query)
    else navigate(query ? `/catalog?q=${encodeURIComponent(query)}` : '/catalog')
  }

  return (
    <div ref={boxRef} className="relative text-left">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          submit(text.trim())
        }}
      >
        <label className="sr-only" htmlFor="site-search">
          Поиск
        </label>
        <Search
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400',
            large ? 'left-5 size-5' : 'left-4 size-4',
          )}
        />
        <input
          id="site-search"
          value={text}
          placeholder={placeholder}
          onChange={(event) => {
            setText(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className={cn(
            'w-full rounded-full border border-white/80 bg-white text-slate-900 shadow-[0_12px_40px_rgba(55,48,120,0.12)] outline-none ring-violet-500/30 placeholder:text-slate-400 focus:ring-2',
            large ? 'h-14 pl-14 text-base' : 'h-12 pl-11 pr-4 text-sm',
            large && (showFilters ? 'pr-28' : 'pr-6'),
          )}
        />
        {large && showFilters && (
          <button
            type="submit"
            className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white"
          >
            Поиск
          </button>
        )}
      </form>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-line bg-card py-2 text-ink shadow-xl">
          {suggestions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-soft"
                onClick={() => {
                  setOpen(false)
                  navigate(`/product/${item.id}`)
                }}
              >
                <TemplateArt
                  categoryId={item.categoryId}
                  accent={item.accent}
                  seed={item.seed}
                  className="size-12 shrink-0 rounded-lg"
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.title}</span>
                  <span className="text-sm text-muted">{formatPrice(item.price)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
