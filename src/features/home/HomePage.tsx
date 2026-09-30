import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, CreditCard, LayoutTemplate, Package, PenLine, Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryPill } from '@/components/CategoryPill'
import { ProductCard } from '@/components/ProductCard'
import { SearchBox } from '@/components/SearchBox'
import { SectionHeading } from '@/components/SectionHeading'
import { ViewTabs } from '@/components/ViewTabs'
import { AboutSection } from '@/features/about/AboutPage'
import { ContactSection } from '@/features/contacts/ContactsPage'
import { buttonClass } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/Reveal'
import { PreviewModal } from '@/features/catalog/PreviewModal'
import { AnimatedHeroTitle } from '@/features/home/AnimatedHeroTitle'
import { hasHeroBanner, HeroBanner } from '@/features/home/HeroBanner'
import { cn } from '@/lib/cn'
import { useCatalogStore } from '@/store/useCatalogStore'

const featured = [
  {
    id: 'cards',
    title: 'Визитки',
    text: 'Стильные и современные визитки для вашего бренда.',
    price: 'от 990 тг',
    className: 'bg-[linear-gradient(135deg,#e7f1ff_0%,#f7fbff_48%,#d7e7ff_100%)]',
    art: 'cards' as const,
  },
  {
    id: 'brochures',
    title: 'Буклеты и брошюры',
    text: 'Профессиональные макеты для вашего бизнеса.',
    price: 'от 1990 тг',
    className: 'bg-[linear-gradient(135deg,#f3e8ff_0%,#f8f5ff_46%,#e4d4ff_100%)]',
    art: 'brochures' as const,
  },
]

const steps = [
  {
    icon: LayoutTemplate,
    title: 'Выбери шаблон',
    text: 'Откройте каталог и возьмите готовый макет.',
  },
  {
    icon: PenLine,
    title: 'Опиши и отправь заявку',
    text: 'Напишите, что нужно, или приложите своё описание и отправьте заявку.',
  },
  {
    icon: Package,
    title: 'Получи заказ',
    text: 'Заберите готовый тираж или макет.',
  },
]

const reviews = [
  {
    name: 'Алина К.',
    role: 'кофейня «Северная»',
    text: 'Буклеты и кружки собрали из одного набора. Цвет на керамике совпал с листовкой, тираж забрали через неделю.',
  },
  {
    name: 'Игорь М.',
    role: 'небольшое издательство',
    text: 'Обложку книги поправили по полям типографии. Три правки вошли в тариф, без доплат в последний день.',
  },
  {
    name: 'Студия «Поле»',
    role: 'дизайн-бюро',
    text: 'Визитки скачали в PDF и сразу отдали в печать. В лицензии прямо написано, можно ли ставить макет клиенту.',
  },
  {
    name: 'Марина С.',
    role: 'маркетолог',
    text: 'Баннер на выставку и листовки оформили визардом. Сумма на экране совпала с тем, что пришло в заявке.',
  },
]

export function HomePage() {
  const categories = useCatalogStore((state) => state.categories)
  const products = useCatalogStore((state) => state.products)
  const published = products.filter((item) => item.status === 'published')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [reviewIndex, setReviewIndex] = useState(0)
  const preview = published.find((item) => item.id === previewId) ?? null
  const visibleReviews = [0, 1, 2].map((offset) => reviews[(reviewIndex + offset) % reviews.length])

  return (
    <div>
      <section id="top" className="relative flex min-h-[calc(100svh-5.5rem)] flex-col justify-center">
        <div className="pointer-events-none absolute inset-x-0 -top-28 bottom-0 bg-[radial-gradient(ellipse_at_75%_0%,rgba(96,165,250,0.45),transparent_58%),radial-gradient(ellipse_at_15%_30%,rgba(167,139,250,0.28),transparent_52%)]" />
        <div
          className={cn(
            'relative mx-auto flex w-full max-w-[1180px] flex-col items-center justify-center px-4 pb-8 pt-10 sm:px-6',
            hasHeroBanner && 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)] lg:items-center lg:gap-10',
          )}
        >
          <div className="flex w-full min-w-0 flex-col items-center justify-center text-center">
            <AnimatedHeroTitle />
            <div className="mt-8">
              <ViewTabs />
            </div>
            <div className="mt-8 w-full max-w-3xl">
              <SearchBox large showFilters />
            </div>
          </div>
          {hasHeroBanner && <HeroBanner />}
        </div>
        <div className="relative mx-auto mt-6 w-full max-w-[1180px] px-4 pb-8 sm:px-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((category, index) => (
              <Reveal key={category.id} delay={(index % 5) * 70}>
                <CategoryPill category={category} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <AboutSection />

      <section className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6">
        <Reveal>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Каталог</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Популярные категории</h2>
            <p className="mt-2 text-slate-500">Крупные направления, с которых чаще всего начинают заказ.</p>
          </div>
          <Link to="/catalog" className="inline-flex items-center gap-1 text-sm font-medium text-violet-600">
            Смотреть все
            <ArrowRight className="size-4" />
          </Link>
        </div>
        </Reveal>
        <div className="grid gap-4 lg:grid-cols-2">
          {featured.map((item, index) => (
            <Reveal key={item.id} delay={index * 90}>
            <Link to={`/catalog?category=${item.id}`} className={cn('relative flex min-h-[250px] overflow-hidden rounded-[28px] p-7 shadow-[0_16px_40px_rgba(70,90,150,0.08)]', item.className)}>
              <div className="relative z-10 flex max-w-[16rem] flex-col">
                <span className="grid size-10 place-items-center rounded-xl bg-white/80 text-violet-600 shadow-sm">
                  {item.art === 'cards' ? <CreditCard className="size-5" /> : <BookOpen className="size-5" />}
                </span>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-900">
                  Перейти
                  <ArrowRight className="size-4" />
                </span>
                <p className="mt-auto pt-8 text-sm text-slate-500">{item.price}</p>
              </div>
              {item.art === 'cards' ? <CardsArt /> : <BrochuresArt />}
            </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="fresh" className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-14">
        <Reveal>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            className="mb-0"
            eyebrow="Витрина"
            title="Свежие шаблоны"
            text="Наведите на карточку, чтобы купить, или откройте быстрый просмотр."
          />
          <Link to="/catalog" className={buttonClass('secondary', 'sm')}>
            Весь каталог
          </Link>
        </div>
        </Reveal>
        <div className="grid grid-cols-4 gap-4">
          {published.slice(0, 4).map((product, index) => (
            <Reveal key={product.id} delay={index * 80} className="h-full">
              <ProductCard product={product} onPreview={setPreviewId} />
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-4">
        <Reveal>
          <SectionHeading eyebrow="Процесс" title="Как это работает" />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 90} className="h-full">
            <Card className="h-full p-5">
              <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                <step.icon className="size-5" />
              </div>
              <p className="text-sm font-semibold text-violet-600">0{index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
            </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <Reveal>
        <div className="mb-8 flex items-end justify-between gap-4">
          <SectionHeading eyebrow="Клиенты" title="Отзывы" />
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Предыдущий отзыв"
              className="grid size-10 place-items-center rounded-full border border-line"
              onClick={() => setReviewIndex((index) => (index + reviews.length - 1) % reviews.length)}
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Следующий отзыв"
              className="grid size-10 place-items-center rounded-full border border-line"
              onClick={() => setReviewIndex((index) => (index + 1) % reviews.length)}
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {visibleReviews.map((review, index) => (
            <Reveal key={`${review.name}-${index}`} delay={index * 90} className={cn(index > 0 && 'hidden md:block')}>
            <Card className="p-5">
              <div className="mb-3 flex gap-1 text-amber-400">
                {Array.from({ length: 5 }, (_, star) => (
                  <Star key={star} className="size-4 fill-current" />
                ))}
              </div>
              <p className="leading-7">{review.text}</p>
              <p className="mt-4 font-semibold">{review.name}</p>
              <p className="text-sm text-muted">{review.role}</p>
            </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <ContactSection />
      <PreviewModal product={preview} onClose={() => setPreviewId(null)} />
    </div>
  )
}

function CardsArt() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[52%]" aria-hidden="true">
      <div className="absolute bottom-8 right-8 h-32 w-48 rotate-[-18deg] rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl" />
      <div className="absolute bottom-14 right-12 h-32 w-48 rotate-[8deg] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80">
        <div className="grid size-8 place-items-center rounded-lg bg-violet-600 text-xs font-bold text-white">D</div>
        <p className="mt-3 text-sm font-semibold text-slate-800">Duwmejik</p>
        <div className="mt-2 h-1.5 w-16 rounded-full bg-slate-200" />
        <div className="mt-1.5 h-1.5 w-10 rounded-full bg-slate-100" />
      </div>
    </div>
  )
}

function BrochuresArt() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[52%]" aria-hidden="true">
      <div className="absolute right-6 top-10 h-44 w-28 rotate-[16deg] rounded-2xl bg-gradient-to-b from-violet-300 to-violet-500 shadow-lg" />
      <div className="absolute right-16 top-8 h-48 w-32 -rotate-6 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-violet-100">
        <div className="h-20 rounded-xl bg-gradient-to-br from-violet-200 via-white to-sky-100" />
        <p className="mt-3 text-[11px] font-semibold leading-4 text-violet-700">Better ideas Together</p>
        <div className="mt-2 h-1.5 w-16 rounded-full bg-violet-100" />
      </div>
      <div className="absolute bottom-6 right-8 grid size-8 place-items-center rounded-lg bg-violet-600 text-[10px] font-bold text-white shadow-md">
        D
      </div>
    </div>
  )
}
