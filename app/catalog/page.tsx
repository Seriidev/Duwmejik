import { redirect } from 'next/navigation'

type Query = Record<string, string | string[] | undefined>

export default async function Page({ searchParams }: { searchParams: Promise<Query> }) {
  const params = await searchParams
  const next = new URLSearchParams()
  for (const key of ['category', 'q'] as const) {
    const value = params[key]
    if (typeof value === 'string' && value) next.set(key, value)
  }
  const suffix = next.toString()
  redirect(suffix ? `/templates?${suffix}` : '/templates')
}
