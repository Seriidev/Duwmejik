'use client'

import { Check, Download, Pencil, Plus, Search, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { formatAmount, salePrice } from '@/lib/superadmin/money'
import { parseMaterialFile } from '@/lib/superadmin/parseMaterials'
import { useAuthStore } from '@/store/useAuthStore'
import { useMaterialStore, type PrintMaterial } from '@/store/useMaterialStore'

const PAGE = 9

export function PricesScreen() {
  const user = useAuthStore((state) => state.user)
  const categories = useMaterialStore((state) => state.categories)
  const materials = useMaterialStore((state) => state.materials)
  const changes = useMaterialStore((state) => state.changes)
  const saveMaterial = useMaterialStore((state) => state.saveMaterial)
  const setCategoryMarkup = useMaterialStore((state) => state.setCategoryMarkup)
  const addCategory = useMaterialStore((state) => state.addCategory)
  const addMaterial = useMaterialStore((state) => state.addMaterial)
  const replaceBook = useMaterialStore((state) => state.replaceBook)
  const [tab, setTab] = useState<'materials' | 'products' | 'promos'>('materials')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [edit, setEdit] = useState<{ id: string; purchase: string; markup: string } | null>(null)
  const [markupOpen, setMarkupOpen] = useState(false)
  const [markupDraft, setMarkupDraft] = useState('30')
  const [creating, setCreating] = useState(false)
  const [categoryDraft, setCategoryDraft] = useState('')
  const [draftName, setDraftName] = useState('')
  const [draftUnit, setDraftUnit] = useState('paçka')
  const [draftPurchase, setDraftPurchase] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const actor = user?.name || 'Суперадмин'
  const activeId = categories.some((item) => item.id === categoryId) ? categoryId : categories[0]?.id ?? ''
  const category = categories.find((item) => item.id === activeId)

  const rows = useMemo(() => {
    const text = query.trim().toLowerCase()
    return materials.filter((item) => item.categoryId === activeId && (!text || item.name.toLowerCase().includes(text)))
  }, [materials, activeId, query])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const currentPage = Math.min(page, pages)
  const visible = rows.slice((currentPage - 1) * PAGE, currentPage * PAGE)

  function pickCategory(id: string) {
    setCategoryId(id)
    setPage(1)
    setEdit(null)
    setMarkupOpen(false)
  }

  function openEdit(item: PrintMaterial) {
    setEdit({ id: item.id, purchase: item.purchase == null ? '' : String(item.purchase), markup: String(item.markup) })
    setError('')
  }

  function commit() {
    if (!edit) return
    const purchase = edit.purchase.trim() === '' ? null : Number(edit.purchase.replace(',', '.'))
    const markup = Number(edit.markup.replace(',', '.'))
    if (purchase != null && !Number.isFinite(purchase)) return setError('Закупка должна быть числом')
    if (!Number.isFinite(markup)) return setError('Наценка должна быть числом')
    const message = saveMaterial(edit.id, purchase, markup, actor)
    if (message) return setError(message)
    setEdit(null)
    setNotice('Цена сохранена. Она действует на новые заказы.')
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setError('')
    try {
      const book = await parseMaterialFile(await file.arrayBuffer())
      replaceBook(book, actor)
      setCategoryId(book[0]?.id ?? '')
      setPage(1)
      setNotice(`Импортировано ${book.reduce((sum, item) => sum + item.materials.length, 0)} позиций.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось прочитать файл')
    }
  }

  function exportBook() {
    const header = ['Категория', '№', 'Наименование', 'Ед.', 'Закупка TMT', 'Наценка %', 'Цена продажи TMT']
    const lines = [header.join(';')]
    for (const group of categories) {
      for (const item of materials.filter((material) => material.categoryId === group.id)) {
        const sale = item.purchase == null ? '' : String(salePrice(item.purchase, item.markup)).replace('.', ',')
        lines.push([group.name, item.no, item.name, item.unit, item.purchase ?? '', String(item.markup).replace('.', ','), sale].map(csv).join(';'))
      }
    }
    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'materialy.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Тарифы и цены печати</h1>
          <p className="mt-1 text-sm text-[#5b6472]">Справочник из файла «Материал» · {materials.length} позиций · валюта TMT</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#e4e7ec] bg-white px-3.5 text-sm font-medium">
            <Upload className="size-4" /> Импорт .xlsx
          </button>
          <button type="button" onClick={exportBook} className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-[#e4e7ec] bg-white px-3.5 text-sm font-medium">
            <Download className="size-4" /> Экспорт
          </button>
          <button type="button" onClick={() => setCreating(true)} className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#6d3ef2] px-3.5 text-sm font-semibold text-white">
            <Plus className="size-4" /> Новая позиция
          </button>
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(event) => { onFile(event.target.files?.[0]); event.target.value = '' }} />
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <TabButton active={tab === 'materials'} onClick={() => setTab('materials')}>Материалы · {materials.length}</TabButton>
        <TabButton active={tab === 'products'} onClick={() => setTab('products')}>Изделия и тарифы</TabButton>
        <TabButton active={tab === 'promos'} onClick={() => setTab('promos')}>Скидки и акции</TabButton>
      </div>

      {tab !== 'materials' ? (
        <div className="mt-6 rounded-2xl border border-[#e4e7ec] bg-white p-8 text-sm text-[#5b6472]">
          {tab === 'products' ? 'Изделия собираются из этого справочника. Форма нового изделия будет следующим шагом.' : 'Акции подключатся вместе с настройками главной.'}
        </div>
      ) : (
        <>
          <p className="mt-4 rounded-xl bg-[#eef1ff] px-4 py-2.5 text-sm text-[#5967d8]">Новая цена действует для новых заказов. Старые заказы сохраняют прежнюю цену.</p>
          {notice && <p className="mt-3 text-sm text-[#12a150]">{notice}</p>}
          {error && <p className="mt-3 text-sm text-[#d92d3a]">{error}</p>}
          <div className="mt-4 grid grid-cols-[280px_minmax(0,1fr)] gap-4">
            <aside className="min-w-0 overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white p-4">
              <p className="px-2 text-[11px] font-semibold tracking-wide text-[#8a93a1]">КАТЕГОРИИ</p>
              <div className="mt-2 grid gap-1">
                {categories.map((item) => {
                  const count = materials.filter((material) => material.categoryId === item.id).length
                  const active = item.id === activeId
                  return (
                    <button key={item.id} type="button" onClick={() => pickCategory(item.id)} className={cn('flex w-full min-w-0 items-start justify-between gap-2 overflow-hidden rounded-xl px-2.5 py-2 text-left text-sm', active ? 'bg-[#efe9ff] font-medium text-[#4f26c9]' : 'text-[#0e1116] hover:bg-[#f6f7f9]')}>
                      <span className="min-w-0 flex-1 break-words">{item.name}</span>
                      <span className={cn('shrink-0 pt-0.5 text-xs', active ? 'text-[#6d3ef2]' : 'text-[#8a93a1]')}>{count}</span>
                    </button>
                  )
                })}
              </div>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  const message = addCategory(categoryDraft)
                  if (message) return setError(message)
                  setCategoryDraft('')
                  setError('')
                }}
              >
                <input value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} placeholder="Новая категория" className="h-9 min-w-0 flex-1 rounded-[10px] border border-[#e4e7ec] px-2.5 text-sm outline-none" />
                <button type="submit" className="grid size-9 place-items-center rounded-[10px] text-[#6d3ef2] hover:bg-[#efe9ff]"><Plus className="size-4" /></button>
              </form>
            </aside>
            <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="min-w-0 break-words text-lg font-semibold">{category?.name}</h2>
                <div className="flex gap-2">
                  <label className="flex h-10 items-center gap-2 rounded-[10px] border border-[#e4e7ec] px-3 text-sm text-[#8a93a1]">
                    <Search className="size-4" />
                    <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Поиск по названию" className="w-44 bg-transparent text-[#0e1116] outline-none placeholder:text-[#8a93a1]" />
                  </label>
                  <button type="button" onClick={() => { setMarkupOpen((open) => !open); setMarkupDraft(String(rows[0]?.markup ?? 30)) }} className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm font-medium">
                    Наценка категории
                  </button>
                </div>
              </div>
              {markupOpen && (
                <form
                  className="mt-3 flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const markup = Number(markupDraft.replace(',', '.'))
                    if (!Number.isFinite(markup)) return setError('Наценка должна быть числом')
                    setCategoryMarkup(activeId, markup, actor)
                    setMarkupOpen(false)
                    setNotice('Наценка категории обновлена.')
                  }}
                >
                  <input value={markupDraft} onChange={(event) => setMarkupDraft(event.target.value)} inputMode="decimal" className="h-10 w-24 rounded-[10px] border border-[#d8c9ff] px-3 text-sm outline-none" />
                  <span className="text-sm text-[#5b6472]">% для всех позиций категории</span>
                  <button type="submit" className="h-10 rounded-[10px] bg-[#6d3ef2] px-3 text-sm font-semibold text-white">Применить</button>
                </form>
              )}
              {creating && (
                <form
                  className="mt-3 grid grid-cols-[1fr_8rem_8rem_auto] gap-2"
                  onSubmit={(event) => {
                    event.preventDefault()
                    const purchase = draftPurchase.trim() === '' ? null : Number(draftPurchase.replace(',', '.'))
                    if (purchase != null && !Number.isFinite(purchase)) return setError('Закупка должна быть числом')
                    const message = addMaterial(activeId, draftName, draftUnit, purchase, actor)
                    if (message) return setError(message)
                    setCreating(false)
                    setDraftName('')
                    setDraftPurchase('')
                    setNotice('Позиция добавлена.')
                  }}
                >
                  <input value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Наименование" className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm outline-none" />
                  <input value={draftUnit} onChange={(event) => setDraftUnit(event.target.value)} placeholder="Ед." className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm outline-none" />
                  <input value={draftPurchase} onChange={(event) => setDraftPurchase(event.target.value)} placeholder="Закупка" inputMode="decimal" className="h-10 rounded-[10px] border border-[#e4e7ec] px-3 text-sm outline-none" />
                  <button type="submit" className="h-10 rounded-[10px] bg-[#6d3ef2] px-3 text-sm font-semibold text-white">Добавить</button>
                </form>
              )}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs text-[#8a93a1]">
                    <tr>
                      <th className="w-12 py-2 font-medium">№</th>
                      <th className="py-2 font-medium">Наименование</th>
                      <th className="px-3 py-2 font-medium">Ед.</th>
                      <th className="px-3 py-2 font-medium">Закупка, TMT</th>
                      <th className="px-3 py-2 font-medium">Наценка</th>
                      <th className="px-3 py-2 font-medium">Цена продажи, TMT</th>
                      <th className="w-12 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((item) => {
                      const open = edit?.id === item.id
                      const sale = item.purchase == null ? null : salePrice(item.purchase, item.markup)
                      return (
                        <tr key={item.id} onClick={() => openEdit(item)} className={cn('cursor-pointer border-t border-[#e4e7ec]', open && 'bg-[#efe9ff]')}>
                          <td className="py-3 text-[#8a93a1]">{item.no}</td>
                          <td className="max-w-[280px] py-3 pr-3 font-medium">{item.name}</td>
                          <td className="px-3 py-3 text-[#5b6472]">{item.unit}</td>
                          <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                            {open ? <CellInput value={edit.purchase} onChange={(value) => setEdit({ ...edit, purchase: value })} /> : item.purchase == null ? <span className="text-[#d92d3a]">цена не задана</span> : formatAmount(item.purchase)}
                          </td>
                          <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}>
                            {open ? <CellInput value={edit.markup} onChange={(value) => setEdit({ ...edit, markup: value })} suffix="%" /> : `${formatAmount(item.markup)}%`}
                          </td>
                          <td className="px-3 py-3 font-semibold">{sale == null ? '—' : formatAmount(open && edit.purchase.trim() ? previewSale(edit.purchase, edit.markup) ?? sale : sale)}</td>
                          <td className="py-3 text-right">
                            {open ? (
                              <button type="button" aria-label="Сохранить" onClick={(event) => { event.stopPropagation(); commit() }} className="grid size-8 place-items-center rounded-lg text-[#12a150]"><Check className="size-4" /></button>
                            ) : (
                              <Pencil className="ml-auto size-4 text-[#8a93a1]" />
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {visible.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-[#8a93a1]">В этой категории ничего не найдено.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-[#8a93a1]">
                <p>Показано {visible.length} из {rows.length}</p>
                <div className="flex gap-1">
                  {Array.from({ length: pages }, (_, index) => index + 1).slice(0, 8).map((number) => (
                    <button key={number} type="button" onClick={() => setPage(number)} className={cn('grid size-8 place-items-center rounded-lg', number === currentPage ? 'bg-[#6d3ef2] font-semibold text-white' : 'hover:bg-[#f6f7f9]')}>{number}</button>
                  ))}
                </div>
              </div>
            </section>
          </div>
          <section className="mt-4 rounded-2xl border border-[#e4e7ec] bg-white p-5">
            <h2 className="text-base font-semibold">Журнал цен</h2>
            {changes.length === 0 ? <p className="mt-3 text-sm text-[#8a93a1]">Изменений ещё не было.</p> : (
              <ul className="mt-3 grid gap-2">
                {changes.slice(0, 8).map((item) => (
                  <li key={item.id} className="flex flex-wrap gap-x-3 text-sm">
                    <span className="text-[#8a93a1]">{new Date(item.at).toLocaleString('ru-RU')}</span>
                    <span className="font-medium">{item.by}</span>
                    <span>{item.material}</span>
                    <span className="text-[#5b6472]">{item.change}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('h-9 rounded-full px-3 text-sm font-medium', active ? 'bg-[#6d3ef2] text-white' : 'text-[#5b6472] hover:bg-white')}>
      {children}
    </button>
  )
}

function CellInput({ value, onChange, suffix }: { value: string; onChange: (value: string) => void; suffix?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <input value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" className="h-8 w-20 rounded-[10px] border border-[#b9a6ff] bg-white px-2 text-sm outline-none" />
      {suffix && <span className="text-[#5b6472]">{suffix}</span>}
    </span>
  )
}

function previewSale(purchase: string, markup: string) {
  const price = Number(purchase.replace(',', '.'))
  const percent = Number(markup.replace(',', '.'))
  if (!Number.isFinite(price) || !Number.isFinite(percent)) return null
  return salePrice(price, percent)
}

function csv(value: string | number) {
  const text = String(value)
  return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
