import { useEffect, useState } from 'react'
import { useLocaleStore } from '@/store/useLocaleStore'

const TYPE_MS = 70
const DELETE_MS = 35
const HOLD_MS = 1600

const phrases = {
  ru: [
    { accent: 'Дизайн', rest: ' полиграфии', tone: 'text-violet-600' },
    { accent: 'Оперативная', rest: ' полиграфия', tone: 'text-blue-600' },
    { accent: 'Цифровая', rest: ' типография', tone: 'text-violet-600' },
    { accent: 'Постпечатные', rest: ' услуги', tone: 'text-blue-600' },
    { accent: 'Лазерная', rest: ' гравировка', tone: 'text-violet-600' },
  ],
  tk: [
    { accent: 'Çap', rest: ' dizaýny', tone: 'text-violet-600' },
    { accent: 'Çalt', rest: ' poligrafiýa', tone: 'text-blue-600' },
    { accent: 'Sanly', rest: ' çap', tone: 'text-violet-600' },
    { accent: 'Çapdan soňky', rest: ' hyzmatlar', tone: 'text-blue-600' },
    { accent: 'Lazer', rest: ' grawirowka', tone: 'text-violet-600' },
  ],
} as const

export function AnimatedHeroTitle() {
  const locale = useLocaleStore((state) => state.locale)
  const list = phrases[locale]
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const phrase = list[index] ?? list[0]
  const full = `${phrase.accent}${phrase.rest}`

  useEffect(() => {
    setIndex(0)
    setText('')
    setDeleting(false)
  }, [locale])

  useEffect(() => {
    let delay = deleting ? DELETE_MS : TYPE_MS
    if (!deleting && text === full) delay = HOLD_MS
    if (deleting && text === '') delay = 400

    const timer = window.setTimeout(() => {
      if (!full.startsWith(text) && !deleting) {
        setText('')
        return
      }
      if (!deleting && text === full) {
        setDeleting(true)
        return
      }
      if (deleting && text === '') {
        setDeleting(false)
        setIndex((current) => (current + 1) % list.length)
        return
      }
      const nextLength = deleting ? text.length - 1 : text.length + 1
      setText(full.slice(0, nextLength))
    }, delay)

    return () => window.clearTimeout(timer)
  }, [text, deleting, full, list.length])

  const accentText = text.slice(0, phrase.accent.length)
  const restText = text.slice(phrase.accent.length)

  return (
    <h1
      aria-label={full}
      className="min-h-[1.15em] w-full text-center text-[2.65rem] font-extrabold leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-6xl"
    >
      <span aria-hidden="true">
        <span className={phrase.tone}>{accentText}</span>
        {restText}
      </span>
      <span aria-hidden="true" className="ml-1 inline-block h-[0.82em] w-[3px] translate-y-[0.06em] animate-pulse bg-slate-950 align-middle" />
    </h1>
  )
}
