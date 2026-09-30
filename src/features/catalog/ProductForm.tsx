import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select, TextArea } from '@/components/ui/Input'
import { COLORS, FILE_TYPES, LICENSES, ORIENTATIONS, PRODUCT_STATUS_LABEL, STYLES } from '@/data/labels'
import { cn } from '@/lib/cn'
import { useCatalogStore } from '@/store/useCatalogStore'
import type { FileType, ProductDraft, ProductStatus } from '@/types'

const empty: ProductDraft = {
  title: '',
  description: '',
  price: 0,
  categoryId: 'cards',
  fileTypes: ['PDF'],
  colors: [],
  style: 'minimal',
  orientation: 'landscape',
  license: 'personal',
  tags: [],
}

export function ProductForm({
  initial,
  submitLabel,
  status,
  onStatus,
  onSubmit,
}: {
  initial?: Partial<ProductDraft>
  submitLabel: string
  status?: ProductStatus
  onStatus?: (status: ProductStatus) => void
  onSubmit: (draft: ProductDraft) => void
}) {
  const categories = useCatalogStore((state) => state.categories)
  const [draft, setDraft] = useState<ProductDraft>({ ...empty, ...initial, categoryId: initial?.categoryId ?? categories[0]?.id ?? 'cards' })
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '))
  const [error, setError] = useState('')

  function toggleFile(file: FileType) {
    setDraft((current) => ({
      ...current,
      fileTypes: current.fileTypes.includes(file)
        ? current.fileTypes.filter((item) => item !== file)
        : [...current.fileTypes, file],
    }))
  }

  function toggleColor(color: string) {
    setDraft((current) => ({
      ...current,
      colors: current.colors.includes(color)
        ? current.colors.filter((item) => item !== color)
        : [...current.colors, color],
    }))
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!draft.title.trim()) {
          setError('Добавьте название')
          return
        }
        if (draft.fileTypes.length === 0) {
          setError('Выберите хотя бы один формат')
          return
        }
        if (draft.price < 0 || Number.isNaN(draft.price)) {
          setError('Цена не может быть отрицательной')
          return
        }
        setError('')
        onSubmit({
          ...draft,
          title: draft.title.trim(),
          description: draft.description.trim(),
          tags: tagsText
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        })
      }}
    >
      <Input label="Название" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
      <TextArea
        label="Описание"
        value={draft.description}
        onChange={(event) => setDraft({ ...draft, description: event.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Цена, ₽"
          type="number"
          min={0}
          value={draft.price}
          onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
        />
        <Select
          label="Категория"
          value={draft.categoryId}
          onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </Select>
        <Select label="Стиль" value={draft.style} onChange={(event) => setDraft({ ...draft, style: event.target.value as ProductDraft['style'] })}>
          {STYLES.map((style) => (
            <option key={style.id} value={style.id}>
              {style.label}
            </option>
          ))}
        </Select>
        <Select
          label="Ориентация"
          value={draft.orientation}
          onChange={(event) => setDraft({ ...draft, orientation: event.target.value as ProductDraft['orientation'] })}
        >
          {ORIENTATIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select
          label="Лицензия"
          value={draft.license}
          onChange={(event) => setDraft({ ...draft, license: event.target.value as ProductDraft['license'] })}
        >
          {LICENSES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
        {onStatus && status && (
          <Select label="Статус" value={status} onChange={(event) => onStatus(event.target.value as ProductStatus)}>
            {(Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[]).map((item) => (
              <option key={item} value={item}>
                {PRODUCT_STATUS_LABEL[item]}
              </option>
            ))}
          </Select>
        )}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Форматы</p>
        <div className="flex flex-wrap gap-2">
          {FILE_TYPES.map((file) => (
            <button
              key={file}
              type="button"
              onClick={() => toggleFile(file)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium',
                draft.fileTypes.includes(file) ? 'bg-neutral-950 text-white' : 'bg-soft',
              )}
            >
              {file}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Цвета</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              onClick={() => toggleColor(color.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm',
                draft.colors.includes(color.id) ? 'border-violet-600 bg-violet-50 text-violet-800' : 'border-line',
              )}
            >
              {color.id}
            </button>
          ))}
        </div>
      </div>
      <Input label="Теги через запятую" value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <Button type="submit">{submitLabel}</Button>
    </form>
  )
}
