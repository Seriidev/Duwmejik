import { PenLine, Printer, ScanLine, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import cardPhoto from '@/assets/card-preview.jpg'
import { Reveal } from '@/components/Reveal'
import { cn } from '@/lib/cn'
import { useLocaleStore, type Locale } from '@/store/useLocaleStore'

const banners = [
  { ru: 'Визитки', tk: 'Wizitkalar', tone: '' },
  { ru: 'Буклеты', tk: 'Bukletler', tone: 'hue-rotate-60' },
  { ru: 'Гравировка', tk: 'Lazer oýma', tone: 'hue-rotate-180' },
] as const

const content = {
  ru: {
    title: 'О нас',
    lead: 'Duwmejik делает макет, печать и оформление под ваш бренд. Готовый шаблон можно скачать сразу.',
    points: [
      {
        title: 'Готовые макеты',
        text: 'Визитки, буклеты, баннеры и сувениры уже собраны в каталоге. Макет можно скачать и отдать в печать.',
        icon: Sparkles,
      },
      {
        title: 'Печать и тираж',
        text: 'Если нужен тираж, заявка считает срок и стоимость по выбранной услуге, без скрытых доплат в конце.',
        icon: Printer,
      },
      {
        title: 'Дизайн под задачу',
        text: 'Когда шаблона мало, опишите задачу. Макет готовим под бренд, правки входят в выбранный тариф.',
        icon: PenLine,
      },
      {
        title: 'Лазерная гравировка',
        text: 'Наносим рисунок на металл, дерево, стекло и кожу. Макет можно взять из каталога или прислать свой.',
        icon: ScanLine,
      },
    ],
  },
  tk: {
    title: 'Biz barada',
    lead: 'Duwmejik maket, çap we brendiňize görä dizaýn edýär. Taýýar şablony göçürip alyp bolýar.',
    points: [
      {
        title: 'Taýýar maketler',
        text: 'Wizitkalar, bukletler, bannerler we suwenirler katalogda bar. Maketi göçürip alyp, çapa berip bolýar.',
        icon: Sparkles,
      },
      {
        title: 'Çap we tiraž',
        text: 'Tiraž gerek bolsa, arzadan möhlet we baha saýlanan hyzmat boýunça hasaplanýar.',
        icon: Printer,
      },
      {
        title: 'Işe görä dizaýn',
        text: 'Şablon ýeterlik bolmasa, işiňizi ýazyň. Maket brendiňize görä taýýarlanýar.',
        icon: PenLine,
      },
      {
        title: 'Lazer oýma',
        text: 'Surat metal, agaç, aýna we derä geçirilýär. Maketi katalogdan alyp ýa-da özüňizi ugradyp bolýar.',
        icon: ScanLine,
      },
    ],
  },
} as const

export function AboutSection() {
  const locale = useLocaleStore((state) => state.locale)
  const page = content[locale]

  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-14 sm:px-6">
      <Reveal>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{page.title}</h2>
        <p className="mt-3 max-w-2xl text-slate-500">{page.lead}</p>
      </Reveal>
      <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.2fr)]">
        <Reveal>
          <AboutBanner locale={locale} />
        </Reveal>
        <div className="grid gap-3">
          {page.points.map((point, index) => (
            <Reveal key={point.title} delay={index * 80}>
            <article className="flex items-center gap-4 rounded-[28px] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(55,70,120,0.06)]">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-600">
                <point.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-950">{point.title}</h3>
                <p className="mt-0.5 text-sm leading-5 text-slate-500">{point.text}</p>
              </div>
            </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function AboutBanner({ locale }: { locale: Locale }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length)
    }, 4000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="relative h-56 overflow-hidden rounded-[28px] lg:h-full lg:min-h-[320px]">
      {banners.map((banner, bannerIndex) => (
        <img
          key={banner.ru}
          src={cardPhoto}
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
            banner.tone,
            bannerIndex === index ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-10">
        <p className="text-lg font-semibold text-white">{banners[index][locale]}</p>
        <div className="flex items-center gap-1.5">
          {banners.map((banner, bannerIndex) => (
            <button
              key={banner.ru}
              type="button"
              aria-label={banner[locale]}
              onClick={() => setIndex(bannerIndex)}
              className={cn('h-2 rounded-full transition-all', bannerIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/60')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
