import { strFromU8, unzipSync } from 'fflate'

export type ParsedMaterial = {
  id: string
  no: number
  name: string
  unit: string
  purchase: number | null
}

export type ParsedCategory = {
  id: string
  name: string
  materials: ParsedMaterial[]
}

function decode(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseMaterialSheet(sharedStringsXml: string, sheetXml: string): ParsedCategory[] {
  const strings: string[] = []
  for (const block of sharedStringsXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const parts = [...block[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((item) => decode(item[1]))
    strings.push(parts.join(''))
  }
  const rows: Array<Record<string, string>> = []
  for (const row of sheetXml.matchAll(/<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: Record<string, string> = {}
    const body = row[2].replace(/<c\b[^>]*\/>/g, '')
    for (const cell of body.matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const type = /t="([^"]+)"/.exec(cell[2])?.[1] ?? ''
      const raw = /<v>([\s\S]*?)<\/v>/.exec(cell[3])?.[1] ?? ''
      cells[cell[1]] = type === 's' ? (strings[Number(raw)] ?? '') : raw
    }
    rows.push(cells)
  }
  const categories: ParsedCategory[] = []
  let current: ParsedCategory | null = null
  for (const row of rows) {
    const name = (row.B ?? '').trim()
    const number = (row.A ?? '').trim()
    const unit = (row.C ?? '').trim()
    const priceText = (row.D ?? '').trim()
    if (!name) continue
    const numbered = number !== '' && !Number.isNaN(Number(number))
    if (!numbered && !unit && !priceText) {
      current = { id: `cat-${categories.length + 1}`, name, materials: [] }
      categories.push(current)
      continue
    }
    if (!current || !numbered) continue
    const purchase = priceText === '' ? null : Number(priceText.replace(',', '.'))
    current.materials.push({
      id: `mat-${number}`,
      no: Number(number),
      name,
      unit,
      purchase: Number.isFinite(purchase) ? purchase : null,
    })
  }
  return categories
}

export async function parseMaterialFile(file: ArrayBuffer) {
  const packed = unzipSync(new Uint8Array(file))
  const shared = strFromU8(packed['xl/sharedStrings.xml'] ?? new Uint8Array())
  const sheet = strFromU8(packed['xl/worksheets/sheet1.xml'] ?? new Uint8Array())
  const categories = parseMaterialSheet(shared, sheet)
  const total = categories.reduce((sum, item) => sum + item.materials.length, 0)
  if (total === 0) throw new Error('В файле нет позиций')
  return categories
}
