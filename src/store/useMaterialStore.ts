import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import seedFile from '@/data/printMaterials.json'
import { createId } from '@/lib/format'
import { roundMoney } from '@/lib/superadmin/money'
import type { ParsedCategory } from '@/lib/superadmin/parseMaterials'

export const DEFAULT_MARKUP = 30

export type PrintCategory = { id: string; name: string }
export type PrintMaterial = {
  id: string
  categoryId: string
  no: number
  name: string
  unit: string
  purchase: number | null
  markup: number
}
export type PriceChange = {
  id: string
  at: string
  by: string
  material: string
  change: string
}

type SeedFile = ParsedCategory[]

function fromSeed(seed: SeedFile) {
  const categories: PrintCategory[] = seed.map((item) => ({ id: item.id, name: item.name }))
  const materials: PrintMaterial[] = seed.flatMap((category) =>
    category.materials.map((item) => ({
      ...item,
      categoryId: category.id,
      purchase: item.purchase == null ? null : roundMoney(item.purchase),
      markup: DEFAULT_MARKUP,
    })),
  )
  return { categories, materials }
}

const initial = fromSeed(seedFile as SeedFile)

type MaterialState = {
  categories: PrintCategory[]
  materials: PrintMaterial[]
  changes: PriceChange[]
  saveMaterial: (id: string, purchase: number | null, markup: number, by: string) => string | null
  setCategoryMarkup: (categoryId: string, markup: number, by: string) => void
  addCategory: (name: string) => string | null
  addMaterial: (categoryId: string, name: string, unit: string, purchase: number | null, by: string) => string | null
  replaceBook: (book: ParsedCategory[], by: string) => void
}

function change(by: string, material: string, text: string): PriceChange {
  return { id: createId('price'), at: new Date().toISOString(), by, material, change: text }
}

export const useMaterialStore = create<MaterialState>()(
  persist(
    (set, get) => ({
      ...initial,
      changes: [],
      saveMaterial: (id, purchase, markup, by) => {
        const current = get().materials.find((item) => item.id === id)
        if (!current) return 'Позиция не найдена'
        if (markup < 0 || markup > 500) return 'Наценка от 0 до 500%'
        if (purchase != null && purchase < 0) return 'Закупка не может быть меньше нуля'
        const nextPurchase = purchase == null ? null : roundMoney(purchase)
        const nextMarkup = roundMoney(markup)
        const notes: PriceChange[] = []
        if (current.purchase !== nextPurchase) {
          notes.push(change(by, current.name, `закупка ${label(current.purchase)} → ${label(nextPurchase)}`))
        }
        if (current.markup !== nextMarkup) {
          notes.push(change(by, current.name, `наценка ${current.markup}% → ${nextMarkup}%`))
        }
        if (notes.length === 0) return null
        set({
          materials: get().materials.map((item) => (item.id === id ? { ...item, purchase: nextPurchase, markup: nextMarkup } : item)),
          changes: [...notes, ...get().changes].slice(0, 200),
        })
        return null
      },
      setCategoryMarkup: (categoryId, markup, by) => {
        const category = get().categories.find((item) => item.id === categoryId)
        if (!category || markup < 0 || markup > 500) return
        const nextMarkup = roundMoney(markup)
        const touched = get().materials.filter((item) => item.categoryId === categoryId && item.markup !== nextMarkup)
        if (touched.length === 0) return
        set({
          materials: get().materials.map((item) => (item.categoryId === categoryId ? { ...item, markup: nextMarkup } : item)),
          changes: [change(by, category.name, `наценка категории ${nextMarkup}% · ${touched.length} поз.`), ...get().changes].slice(0, 200),
        })
      },
      addCategory: (name) => {
        const title = name.trim()
        if (!title) return 'Введите название категории'
        if (get().categories.some((item) => item.name.toLowerCase() === title.toLowerCase())) return 'Такая категория уже есть'
        set({ categories: [...get().categories, { id: createId('cat'), name: title }] })
        return null
      },
      addMaterial: (categoryId, name, unit, purchase, by) => {
        const title = name.trim()
        if (!title || !unit.trim()) return 'Укажите название и единицу'
        if (purchase != null && purchase < 0) return 'Закупка не может быть меньше нуля'
        const no = get().materials.reduce((max, item) => Math.max(max, item.no), 0) + 1
        const material: PrintMaterial = {
          id: createId('mat'),
          categoryId,
          no,
          name: title,
          unit: unit.trim(),
          purchase: purchase == null ? null : roundMoney(purchase),
          markup: DEFAULT_MARKUP,
        }
        set({
          materials: [...get().materials, material],
          changes: [change(by, title, 'новая позиция'), ...get().changes].slice(0, 200),
        })
        return null
      },
      replaceBook: (book, by) => {
        const next = fromSeed(book)
        set({
          categories: next.categories,
          materials: next.materials,
          changes: [change(by, 'Импорт', `${next.materials.length} позиций из файла`), ...get().changes].slice(0, 200),
        })
      },
    }),
    { name: 'duwmejik-materials' },
  ),
)

function label(value: number | null) {
  return value == null ? 'не задана' : String(value)
}
