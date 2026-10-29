'use client'

import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Reveal } from '@/components/Reveal'
import { SearchBox } from '@/components/SearchBox'
import { TemplateArt } from '@/components/TemplateArt'
import { ContactSection } from '@/features/contacts/ContactsPage'
import { cn } from '@/lib/cn'
import { useCatalogStore } from '@/store/useCatalogStore'
import { useLocaleStore, type Locale } from '@/store/useLocaleStore'

const cardBlurb: Record<string, string> = {
  'tpl-card-nord': 'Светлая визитка с крупным именем и тихой сеткой. Две стороны, сразу в печать.',
  'tpl-card-foil': 'Тёмный фон и золотая линия под тиснение. Для студий и частных практик.',
  'tpl-card-startup': 'Синяя плашка, слоган и QR на обороте. Макет в Figma правится быстро.',
  'tpl-broch-cafe': 'Трёхсгиб с меню напитков и фото-окном. Тёплые цвета, читается издалека.',
  'tpl-broch-arch': 'Восемь страниц с большими полями и подписями. Спокойный старт для портфолио.',
  'tpl-book-poetry': 'Обложка и корешок с крупной типографикой. Фиолетовый фон под печать.',
  'tpl-book-kids': 'Альбомный разворот с крупными пятнами цвета. Место под рисунок и текст.',
  'tpl-mug-morning': 'Обёртка для керамики с оранжевым знаком. Короткая фраза, без текста у ручки.',
  'tpl-mug-corp': 'Синий деловой паттерн и место под логотип. Для корпоративных наборов.',
  'tpl-pen-logo': 'Тампопечать в одну краску и поля от клипа. Знак садится ровно на корпус.',
  'tpl-note-dots': 'Зелёная точка на обложке и спокойная сетка. Для ежедневных заметок.',
  'tpl-note-grid': 'Серая деловая обложка и страница в клетку. Без лишней графики.',
  'tpl-form-free': 'Счёт и акт на одной сетке, поля подписаны. Правится в Figma и в PDF.',
  'tpl-form-letter': 'Письмо на бланке: шапка, колонтитул, подпись. Чёрный набор и много воздуха.',
  'tpl-banner-expo': 'Ролл-ап с крупным заголовком, датой и местом. Видно с прохода на выставке.',
  'tpl-banner-social': 'Квадрат и широкий кадр для профиля. Текст остаётся в безопасной зоне.',
  'tpl-flyer-sale': 'Листовка А6 с крупной ценой и датой. Красный и жёлтый, видна на стойке.',
  'tpl-pack-box': 'Развёртка крышки и боковин коробки. Место под состав и штрихкод.',
  'tpl-stickers': 'Восемь стикеров на листе А5. Розовый и жёлтый, для писем и упаковки.',
  'tpl-stickers-pack': 'Марки для коробов: «хрупкое», состав, логотип. Контурная резка в две краски.',
  'tpl-card-holiday': 'Лицо и оборот с крупным поздравлением. Поле для подписи от руки.',
  'tpl-card-wedding': 'Белый картон, золотая рамка и имена. Печать на плотной бумаге.',
}

const productCovers: Record<string, string> = {
  'tpl-card-nord': '/products/nord.jpg',
  'tpl-card-foil': '/products/foil.jpg',
  'tpl-card-startup': '/products/startup.jpg',
  'tpl-broch-cafe': '/products/broch-cafe.jpg',
  'tpl-broch-arch': '/products/broch-arch.jpg',
  'tpl-book-poetry': '/products/book-poetry.jpg',
  'tpl-book-kids': '/products/book-kids.jpg',
  'tpl-mug-morning': '/products/mug-morning.jpg',
  'tpl-mug-corp': '/products/mug-corp.jpg',
  'tpl-pen-logo': '/products/pen-logo.jpg',
  'tpl-note-dots': '/products/note-dots.jpg',
  'tpl-note-grid': '/products/note-grid.jpg',
  'tpl-form-free': '/products/form-invoice.jpg',
  'tpl-form-letter': '/products/form-letter.jpg',
  'tpl-banner-expo': '/products/banner-expo.jpg',
  'tpl-banner-social': '/products/banner-social.jpg',
  'tpl-flyer-sale': '/products/flyer-sale.jpg',
  'tpl-pack-box': '/products/pack-box.jpg',
  'tpl-stickers': '/products/stickers.jpg',
  'tpl-stickers-pack': '/products/stickers-pack.jpg',
  'tpl-card-holiday': '/products/card-holiday.jpg',
  'tpl-card-wedding': '/products/card-wedding.jpg',
}

const wrap = 'mx-auto mt-4 max-w-[1180px] px-4 sm:px-6'
const panel = 'rounded-[28px] bg-[#EEEFF3] p-5 sm:p-7'

const circleIds = ['cards', 'flyers', 'brochures', 'banners', 'stickers', 'packaging', 'mugs', 'books'] as const

const homeCircles = [
  { href: '/templates?category=cards', src: '/categories/cards.jpg', ru: 'Визитки', en: 'Cards', tk: 'Wizitkalar' },
  { href: '/templates?category=flyers', src: '/categories/flyer.jpg', ru: 'Флаеры', en: 'Flyers', tk: 'Flaerler' },
  { href: '/templates?category=brochures', src: '/categories/booklet.jpg', ru: 'Буклеты', en: 'Brochures', tk: 'Bukletler' },
  { href: '/templates?q=меню', src: '/categories/menu.png', ru: 'Меню', en: 'Menus', tk: 'Menýu' },
  { href: '/templates?category=banners', src: '/categories/banner.png', ru: 'Баннеры', en: 'Banners', tk: 'Bannerler' },
  { href: '/templates?category=stickers', src: '/categories/sticker.png', ru: 'Наклейки', en: 'Stickers', tk: 'Stikerler' },
  { href: '/templates?category=packaging', src: '/categories/packaging.png', ru: 'Упаковка', en: 'Packaging', tk: 'Gaplama' },
  { href: '/templates?category=postcards', src: '/categories/postcard.jpg', ru: 'Открытки', en: 'Postcards', tk: 'Açyk hatlar' },
  { href: '/templates?q=бокал', src: '/categories/glasses.jpg', ru: 'Бокалы', en: 'Glasses', tk: 'Bokalary' },
  { href: '/templates?category=pens', src: '/categories/pens.jpg', ru: 'Ручки', en: 'Pens', tk: 'Ruçkalar' },
  { href: '/templates?category=notebooks', src: '/categories/notebooks.jpg', ru: 'Блокноты', en: 'Notebooks', tk: 'Bloknotlar' },
  { href: '/templates?q=гравировка', src: '/categories/engraving.jpg', ru: 'Гравировки', en: 'Engraving', tk: 'Grawirleme' },
] as const

function CircleRail({ locale }: { locale: Locale }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    const box = boxRef.current
    const track = trackRef.current
    if (!box || !track) return

    const apply = () => {
      const half = track.scrollWidth / 2
      if (half <= 0) return
      while (offsetRef.current >= half) offsetRef.current -= half
      while (offsetRef.current < 0) offsetRef.current += half
      track.style.transform = `translate3d(${-offsetRef.current}px,0,0)`
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      let delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
      if (event.deltaMode === 1) delta *= 16
      if (event.deltaMode === 2) delta *= box.clientHeight
      offsetRef.current += delta
      apply()
    }

    let touchX = 0
    const onTouchStart = (event: TouchEvent) => {
      touchX = event.touches[0]?.clientX ?? 0
    }
    const onTouchMove = (event: TouchEvent) => {
      const x = event.touches[0]?.clientX ?? touchX
      offsetRef.current += touchX - x
      touchX = x
      event.preventDefault()
      apply()
    }

    box.addEventListener('wheel', onWheel, { passive: false })
    box.addEventListener('touchstart', onTouchStart, { passive: true })
    box.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      box.removeEventListener('wheel', onWheel)
      box.removeEventListener('touchstart', onTouchStart)
      box.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  const loop = [...homeCircles, ...homeCircles]

  return (
    <div ref={boxRef} className="overflow-hidden rounded-[24px] bg-[#F4F5F7] px-3 py-6 sm:rounded-[28px] sm:px-8 sm:py-8">
      <div ref={trackRef} className="flex w-max gap-4 will-change-transform sm:gap-6">
        {loop.map((item, index) => (
          <Link
            key={`${item.href}-${index}`}
            href={item.href}
            className="group flex w-[84px] shrink-0 flex-col items-center gap-2 sm:w-[108px] sm:gap-3"
            tabIndex={index >= homeCircles.length ? -1 : undefined}
            aria-hidden={index >= homeCircles.length ? true : undefined}
          >
            <span className="relative size-[76px] overflow-hidden rounded-full border-2 border-[#6E8BFF] bg-white sm:size-[100px]">
              <img
                src={item.src}
                alt=""
                className="h-full w-full origin-center object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </span>
            <span className="text-center text-[13px] font-medium text-slate-500">{item[locale]}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

const shortName: Record<Locale, Record<string, string>> = {
  ru: {
    cards: 'Визитки',
    flyers: 'Флаеры',
    brochures: 'Буклеты',
    banners: 'Баннеры',
    stickers: 'Наклейки',
    packaging: 'Упаковка',
    mugs: 'Кружки',
    books: 'Книги',
  },
  en: {
    cards: 'Cards',
    flyers: 'Flyers',
    brochures: 'Brochures',
    banners: 'Banners',
    stickers: 'Stickers',
    packaging: 'Packaging',
    mugs: 'Mugs',
    books: 'Books',
  },
  tk: {
    cards: 'Wizitkalar',
    flyers: 'Listowkalar',
    brochures: 'Bukletler',
    banners: 'Bannerler',
    stickers: 'Stikerler',
    packaging: 'Gaplama',
    mugs: 'Krujkalar',
    books: 'Kitaplar',
  },
}

const copy = {
  ru: {
    hero: 'Выберите шаблон — мы подготовим макет и напечатаем',
    search: 'Поиск: визитки, флаеры, баннеры, футболки...',
    find: 'Найти',
    allTemplates: 'Выбрать шаблон',
    orderPrint: 'Заказать печать',
    order: 'Заказать',
    products: 'Продукция',
    all: 'Все',
    prev: 'Назад',
    next: 'Дальше',
    empty: 'В этой категории пока нет макетов.',
    aboutTitle: 'Коротко о нас',
    aboutLead: 'Печать и макеты в одном месте',
    aboutText:
      'Duwmejik собирает шаблон, готовит файл под типографию и печатает тираж. Визитки, буклеты, баннеры и сувениры можно взять из каталога или собрать под ваш бренд.',
    statTemplates: 'более выполненных работ',
    statRating: 'наши клиенты оценивают нас',
    skillsTitle: 'Наши skills',
    skillsText: 'Цветопроба, тиснение, резка и тираж. Файл готовим под печать и ведём заказ до готовой пачки.',
    openCatalog: 'Открыть каталог',
    howTitle: 'Как заказать дизайн и\nпечать',
    steps: [
      { title: 'Выберите шаблон', text: 'Откройте каталог и возьмите готовый макет или начните заявку без него.' },
      { title: 'Опишите задачу', text: 'Напишите тираж, срок и что должно быть на макете.' },
      { title: 'Проверьте файл', text: 'Мы соберём макет под печать и покажем, как он ляжет на лист.' },
      { title: 'Оплатите заказ', text: 'Подтвердите тираж и оплатите счёт. После оплаты запускаем печать.' },
      { title: 'Получите тираж', text: 'Заберите печать или скачайте готовый файл.' },
    ],
    designersTitle: 'Дизайнерам: загружайте шаблоны и показывайте себя',
    designerCardTitle: 'Кабинет дизайнера',
    designerCardMeta: 'после проверки',
    designerCardText:
      'Загрузите макет в PDF, PSD, AI или Figma. После модерации он появится в каталоге, а заказчик сможет скачать файл или отдать его в печать.',
    designerCta: 'Стать дизайнером',
    designerNote: 'Каждый шаблон проходит модерацию. В карточке видны лицензия, формат файла и можно ли отдавать макет клиенту.',
    ctaKicker: 'QR на макете',
    ctaTitle: 'Ваша визитка со своей ссылкой',
    ctaText: 'Соберите страницу с контактами и поставьте код на карточку.',
    ctaButton: 'Собрать',
    tariffsTitle: 'Тарифы онлайн-визиток',
    plans: [
      {
        n: '01',
        title: 'Бесплатная',
        text: 'Одна страница с контактами и QR на карточке. Без абонентской платы.',
        price: '0',
        unit: 'TMT',
        action: 'Начать',
        href: '/templates?section=qr',
        featured: true,
      },
      {
        n: '02',
        title: 'Премиум · месяц',
        text: 'Свой дизайн, три правки и карточка со ссылкой на 30 дней.',
        price: '20',
        unit: 'TMT',
        action: 'Выбрать',
        href: '/templates?section=qr',
        featured: false,
      },
      {
        n: '03',
        title: 'Премиум · год',
        text: 'Онлайн-визитка на год и правки без лимита. Один тариф на весь срок.',
        price: '200',
        unit: 'TMT',
        action: 'Выбрать',
        href: '/templates?section=qr',
        featured: false,
      },
    ],
  },
  en: {
    hero: 'Pick a template — we will prepare the file and print it',
    search: 'Search: cards, flyers, banners, t-shirts...',
    find: 'Search',
    allTemplates: 'Choose a template',
    orderPrint: 'Order print',
    order: 'Order',
    products: 'Products',
    all: 'All',
    prev: 'Previous',
    next: 'Next',
    empty: 'No designs in this category yet.',
    aboutTitle: 'In short',
    aboutLead: 'Print and artwork in one place',
    aboutText:
      'Duwmejik picks a template, prepares a print-ready file, and runs the job. Cards, brochures, banners, and gifts can come from the catalog or be made for your brand.',
    statTemplates: 'completed jobs',
    statRating: 'our clients rate us',
    skillsTitle: 'Our skills',
    skillsText: 'Proofs, foil, cutting, and the print run. We prepare the file and carry the order through to the finished stack.',
    openCatalog: 'Open catalog',
    howTitle: 'How to order\ndesign and print',
    steps: [
      { title: 'Choose a template', text: 'Open the catalog and take a ready file, or start an order without one.' },
      { title: 'Describe the job', text: 'Write the quantity, the deadline, and what should be on the design.' },
      { title: 'Check the file', text: 'We build the print file and show how it sits on the sheet.' },
      { title: 'Pay the order', text: 'Confirm the quantity and pay the invoice. Printing starts after payment.' },
      { title: 'Get the run', text: 'Pick up the print or download the finished file.' },
    ],
    designersTitle: 'Designers: upload templates and show your work',
    designerCardTitle: 'Designer account',
    designerCardMeta: 'after review',
    designerCardText:
      'Upload a PDF, PSD, AI, or Figma file. After review it appears in the catalog, and a client can download it or send it to print.',
    designerCta: 'Become a designer',
    designerNote: 'Every template is reviewed. The card shows the license, the file type, and whether the file can go to a client.',
    ctaKicker: 'QR on the design',
    ctaTitle: 'Your card with its own link',
    ctaText: 'Build a contact page and put the code on the card.',
    ctaButton: 'Build',
    tariffsTitle: 'Online card plans',
    plans: [
      {
        n: '01',
        title: 'Free',
        text: 'One contact page and a QR on the card. No subscription.',
        price: '0',
        unit: 'TMT',
        action: 'Start',
        href: '/templates?section=qr',
        featured: true,
      },
      {
        n: '02',
        title: 'Premium · month',
        text: 'Your design, three revisions, and a linked card for 30 days.',
        price: '20',
        unit: 'TMT',
        action: 'Choose',
        href: '/templates?section=qr',
        featured: false,
      },
      {
        n: '03',
        title: 'Premium · year',
        text: 'An online card for a year and unlimited revisions. One rate for the whole term.',
        price: '200',
        unit: 'TMT',
        action: 'Choose',
        href: '/templates?section=qr',
        featured: false,
      },
    ],
  },
  tk: {
    hero: 'Şablon saýlaň — maketi taýýarlap, çap ederis',
    search: 'Gözleg: wizitka, flaer, banner...',
    find: 'Gözle',
    allTemplates: 'Şablon saýla',
    orderPrint: 'Çap sargyt et',
    order: 'Sargyt et',
    products: 'Önümler',
    all: 'Ählisi',
    prev: 'Yza',
    next: 'Öňe',
    empty: 'Bu kategoriýada entek maket ýok.',
    aboutTitle: 'Gysgaça biz barada',
    aboutLead: 'Çap we maket bir ýerde',
    aboutText:
      'Duwmejik şablony saýlaýar, çapa taýýar faýly taýýarlaýar we tiražy çap edýär. Wizitka, buklet, banner we suwenirleri katalogdan alyp ýa-da brendiňize görä ýasadylyp bolýar.',
    statTemplates: 'ýerine ýetirilen iş',
    statRating: 'müşderiler bize baha berýär',
    skillsTitle: 'Biziň skills',
    skillsText: 'Reňk synagy, basma, kesim we tiraž. Faýly çapa taýýarlaýarys we sargydy taýýar toplumyna çenli alyp barýarys.',
    openCatalog: 'Katalogy aç',
    howTitle: 'Dizaýny we çapy\nnädip sargyt etmeli',
    steps: [
      { title: 'Şablon saýlaň', text: 'Katalogdan taýýar maket alyň ýa-da şablonsuz arza başlaň.' },
      { title: 'Işi düşündiriň', text: 'Tiražy, möhleti we maketde nämeleriň bolmalydygyny ýazyň.' },
      { title: 'Faýly barlaň', text: 'Maketi çapa taýýarlaýarys we listede nähili ýatjakdygyny görkezýäris.' },
      { title: 'Sargydy töleň', text: 'Tiražy tassyklaň we hasaby töleň. Tölegden soň çap başlaýar.' },
      { title: 'Tiražy alyň', text: 'Çapy alyň ýa-da taýýar faýly göçürip alyň.' },
    ],
    designersTitle: 'Dizaýnerlere: şablon ýükläň we öz işiňizi görkeziň',
    designerCardTitle: 'Dizaýner kabineti',
    designerCardMeta: 'barlagdan soň',
    designerCardText:
      'PDF, PSD, AI ýa-da Figma faýlyny ýükläň. Barlagdan soň katalogda peýda bolar, müşderi göçürip alyp ýa-da çapa berip biler.',
    designerCta: 'Dizaýner bol',
    designerNote: 'Her şablon barlagdan geçýär. Kartada ygtyýarnama, faýl görnüşi we maketi müşderä berip boljakdygy görünýär.',
    ctaKicker: 'Maketdäki QR',
    ctaTitle: 'Öz salgyňyz bolan wizitka',
    ctaText: 'Kontakt sahypasyny düzüň we kody kartanyň üstüne goýuň.',
    ctaButton: 'Düz',
    tariffsTitle: 'Onlaýn wizitka nyrhlary',
    plans: [
      {
        n: '01',
        title: 'Mugt',
        text: 'Kontakt sahypasy we kartadaky QR. Abonent tölegsiz.',
        price: '0',
        unit: 'TMT',
        action: 'Başla',
        href: '/templates?section=qr',
        featured: true,
      },
      {
        n: '02',
        title: 'Premium · aý',
        text: 'Öz dizaýnyňyz, üç düzediş we 30 günlük salgyly kart.',
        price: '20',
        unit: 'TMT',
        action: 'Saýla',
        href: '/templates?section=qr',
        featured: false,
      },
      {
        n: '03',
        title: 'Premium · ýyl',
        text: 'Bir ýyllyk onlaýn wizitka we çäksiz düzediş. Tutuş möhlet üçin bir nyrh.',
        price: '200',
        unit: 'TMT',
        action: 'Saýla',
        href: '/templates?section=qr',
        featured: false,
      },
    ],
  },
} as const

export function HomePage() {
  const locale = useLocaleStore((state) => state.locale)
  const page = copy[locale]
  const names = shortName[locale]
  const categories = useCatalogStore((state) => state.categories)
  const products = useCatalogStore((state) => state.products)
  const published = products.filter((item) => item.status === 'published')
  const [categoryId, setCategoryId] = useState('')
  const [productPage, setProductPage] = useState(0)
  const circles = circleIds
    .map((id) => categories.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const filtered = published.filter((item) => !categoryId || item.categoryId === categoryId)
  const pageCount = Math.max(1, Math.ceil(filtered.length / 3))
  const safePage = Math.min(productPage, pageCount - 1)
  const visible = filtered.slice(safePage * 3, safePage * 3 + 3)
  const rating = published.length ? published.reduce((sum, item) => sum + item.rating, 0) / published.length : 4.9

  return (
    <div className="pb-2">
      <section className="mx-auto max-w-[1180px] px-4 pt-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[24px] px-4 py-12 text-center sm:rounded-[32px] sm:px-10 sm:py-16 md:px-12 md:py-20">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-blue-950/45" />
          <div className="relative z-10">
            <h1 className="mx-auto max-w-[820px] text-[28px] font-bold leading-[1.2] tracking-tight text-white sm:text-[36px] md:text-[46px]">
              {page.hero}
            </h1>
            <div className="mx-auto mt-9 w-full max-w-[540px]">
              <SearchBox appearance="hero" placeholder={page.search} submitLabel={page.find} />
            </div>
            <div className="mx-auto mt-5 flex w-full max-w-[540px] justify-center gap-2 sm:w-auto sm:max-w-none sm:gap-3">
              <Link href="/templates" className="inline-flex h-10 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-brand px-3 text-xs font-semibold text-white sm:flex-none sm:px-5 sm:text-sm">
                {page.allTemplates}
              </Link>
              <Link href="/templates?section=orders" className="inline-flex h-10 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-white px-3 text-xs font-semibold text-neutral-950 sm:flex-none sm:px-5 sm:text-sm">
                {page.orderPrint}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={wrap}>
        <Reveal>
          <CircleRail locale={locale} />
        </Reveal>
      </section>

      <section id="products" className={cn(wrap, 'scroll-mt-28')}>
        <Reveal>
        <div className={panel}>
          <h2 className="text-lg font-semibold text-slate-950">{page.products}</h2>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
              <FilterChip active={categoryId === ''} onClick={() => { setCategoryId(''); setProductPage(0) }}>
                {page.all}
              </FilterChip>
              {circles.map((category) => (
                <FilterChip
                  key={category.id}
                  active={categoryId === category.id}
                  onClick={() => { setCategoryId(category.id); setProductPage(0) }}
                >
                  {names[category.id] ?? category.title}
                </FilterChip>
              ))}
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                aria-label={page.prev}
                disabled={safePage === 0}
                onClick={() => setProductPage(safePage - 1)}
                className="grid size-8 place-items-center rounded-full bg-white text-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label={page.next}
                disabled={safePage >= pageCount - 1}
                onClick={() => setProductPage(safePage + 1)}
                className="grid size-8 place-items-center rounded-full bg-white text-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">{page.empty}</p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((product) => (
                <article key={product.id} className="flex flex-col rounded-[22px] bg-white p-3">
                  <Link href={`/product/${product.id}`} className="block overflow-hidden rounded-2xl bg-[#E6E7EB]">
                    {productCovers[product.id] ? (
                      <img src={productCovers[product.id]} alt="" className="aspect-[16/10] w-full object-cover" />
                    ) : (
                      <TemplateArt categoryId={product.categoryId} accent={product.accent} seed={product.seed} className="aspect-[16/10] w-full" />
                    )}
                  </Link>
                  <div className="px-1.5 pb-1 pt-3">
                    <Link href={`/product/${product.id}`} className="line-clamp-1 text-[15px] font-semibold text-slate-950">
                      {product.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{cardBlurb[product.id] ?? product.description}</p>
                  </div>
                  <Link href={`/templates?section=orders&product=${product.id}`} className="mx-1.5 mb-1 mt-3 inline-flex h-9 w-fit items-center rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white">
                    {page.order}
                  </Link>
                </article>
              ))}
            </div>
          )}

          <div className="mt-4 h-1.5 w-14 overflow-hidden rounded-full bg-[#E1E3E8]">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${100 / pageCount}%`, marginLeft: `${(safePage / pageCount) * 100}%` }}
            />
          </div>
        </div>
        </Reveal>
      </section>

      <section id="about" className={cn(wrap, 'scroll-mt-28')}>
        <Reveal>
        <div className={panel}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative min-h-[200px] overflow-hidden rounded-[24px] bg-blue-100 sm:min-h-[240px] lg:col-span-2">
              <img src="/about/press.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center px-1 py-3 lg:col-span-2 lg:px-4">
              <h2 className="text-[24px] font-semibold tracking-tight text-slate-950 sm:text-[28px]">{page.aboutTitle}</h2>
              <p className="mt-4 text-base font-semibold text-slate-900">{page.aboutLead}</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{page.aboutText}</p>
            </div>
            <Link href="/templates" className="flex min-h-[148px] flex-col justify-between rounded-[22px] bg-brand p-5 text-white">
              <p className="text-[32px] font-bold leading-none">100+</p>
              <p className="text-sm text-white/80">{page.statTemplates}</p>
            </Link>
            <Link href="/templates" aria-label={page.openCatalog} className="relative min-h-[148px] overflow-hidden rounded-[22px] bg-blue-100">
              <img src="/about/type.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
            </Link>
            <div className="flex min-h-[148px] flex-col justify-between rounded-[22px] bg-white p-5 shadow-[0_10px_28px_rgba(20,24,40,0.06)]">
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: 5 }, (_, star) => (
                  <Star key={star} className="size-5 fill-current" />
                ))}
              </div>
              <div>
                <p className="text-[32px] font-bold leading-none text-slate-950">{rating.toFixed(1)}</p>
                <p className="mt-2 text-sm leading-5 text-slate-500">{page.statRating}</p>
              </div>
            </div>
            <div className="flex min-h-[148px] flex-col justify-between rounded-[22px] bg-blue-900 p-5 text-white">
              <p className="text-base font-semibold leading-tight">{page.skillsTitle}</p>
              <p className="text-[13px] leading-5 text-white/80">{page.skillsText}</p>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      <section className={wrap}>
        <Reveal>
        <div className={cn(panel, 'sm:p-10')}>
          <div className="grid items-center gap-6 md:grid-cols-2 md:gap-8">
            <h2 className="whitespace-pre-line text-[28px] font-bold leading-[1.15] tracking-tight text-slate-950 sm:text-[34px] md:text-[40px]">
              {page.howTitle}
            </h2>
            <ol className="grid gap-5">
              {page.steps.map((step, index) => (
                <li key={step.title}>
                  <p className="text-[22px] font-bold leading-none tracking-tight text-brand">0{index + 1}</p>
                  <h3 className="mt-1 font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
        </Reveal>
      </section>

      <section id="designers" className={cn(wrap, 'scroll-mt-28')}>
        <Reveal>
        <div className={panel}>
          <h2 className="text-center text-lg font-semibold text-slate-950 sm:text-xl">{page.designersTitle}</h2>
          <div className="mt-6 grid items-center gap-8 md:mt-8 md:grid-cols-2">
            <div className="relative mx-auto h-[230px] w-full max-w-[460px] sm:h-[280px] lg:h-[300px]">
              <img
                src="/products/nord.jpg"
                alt=""
                className="absolute left-0 top-6 h-32 w-[48%] -rotate-6 rounded-[18px] object-cover shadow-[0_16px_40px_rgba(20,24,40,0.16)] ring-4 ring-white sm:top-8 sm:h-44 sm:w-52 sm:rounded-[22px]"
              />
              <img
                src="/products/broch-cafe.jpg"
                alt=""
                className="absolute right-0 top-0 h-28 w-[44%] rotate-[7deg] rounded-[18px] object-cover shadow-[0_16px_40px_rgba(20,24,40,0.16)] ring-4 ring-white sm:h-40 sm:w-48 sm:rounded-[22px]"
              />
              <img
                src="/products/startup.jpg"
                alt=""
                className="absolute bottom-0 left-[16%] h-28 w-[62%] rounded-[18px] object-cover shadow-[0_18px_44px_rgba(20,24,40,0.2)] ring-4 ring-white sm:bottom-1 sm:left-16 sm:h-40 sm:w-60 sm:rounded-[22px]"
              />
            </div>
            <div className="rounded-[24px] bg-white p-6 shadow-[0_10px_30px_rgba(20,24,40,0.04)]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-brand text-sm font-bold text-white">D</span>
                <div>
                  <p className="font-semibold text-slate-950">{page.designerCardTitle}</p>
                  <p className="text-xs text-slate-400">{page.designerCardMeta}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">{page.designerCardText}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['PDF', 'PSD', 'AI', 'Figma'].map((format) => (
                  <span key={format} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-brand">
                    {format}
                  </span>
                ))}
              </div>
              <Link href="/account?tab=settings" className="mt-5 flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white">
                {page.designerCta}
              </Link>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-6 text-slate-500">{page.designerNote}</p>
        </div>
        </Reveal>
      </section>

      <section className={wrap}>
        <Reveal>
        <div className="flex flex-col items-start justify-between gap-5 rounded-[24px] bg-brand px-6 py-6 text-white sm:flex-row sm:items-center sm:px-8">
          <div>
            <p className="text-sm text-white/70">{page.ctaKicker}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{page.ctaTitle}</h2>
            <p className="mt-1 text-sm text-white/80">{page.ctaText}</p>
          </div>
          <Link href="/templates?section=qr" className="inline-flex h-11 shrink-0 items-center rounded-full bg-white px-5 text-sm font-semibold text-slate-950">
            {page.ctaButton}
          </Link>
        </div>
        </Reveal>
      </section>

      <ContactSection />

      <section className={cn(wrap, 'pb-2')}>
        <Reveal>
        <div className={cn(panel, 'sm:px-8 sm:py-8')}>
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-950">{page.tariffsTitle}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.plans.map((plan) => (
              <Link
                key={plan.n}
                href={plan.href}
                className={cn(
                  'group flex min-h-[280px] flex-col rounded-[24px] p-5 shadow-[0_10px_30px_rgba(20,24,40,0.04)] transition-colors duration-300 hover:bg-brand hover:text-white',
                  plan.featured ? 'bg-brand text-white' : 'bg-white text-slate-950',
                )}
              >
                <p className={cn('text-right text-[28px] font-bold leading-none', plan.featured ? 'text-white/70' : 'text-brand group-hover:text-white/80')}>{plan.n}</p>
                <h3 className="mt-4 text-xl font-semibold">{plan.title}</h3>
                <p className="mt-3 flex items-end gap-2">
                  <span className="text-[34px] font-bold leading-none tracking-tight sm:text-[42px]">{plan.price}</span>
                  <span className={cn('mb-1 text-sm font-semibold', plan.featured ? 'text-white/75' : 'text-slate-400 group-hover:text-white/75')}>{plan.unit}</span>
                </p>
                <p className={cn('mt-3 text-sm leading-6', plan.featured ? 'text-white/80' : 'text-slate-500 group-hover:text-white/80')}>{plan.text}</p>
                <span
                  className={cn(
                    'mt-auto inline-flex h-10 w-fit items-center rounded-full px-4 text-sm font-semibold transition-colors duration-300',
                    plan.featured ? 'bg-white text-slate-950' : 'bg-neutral-950 text-white group-hover:bg-white group-hover:text-slate-950',
                  )}
                >
                  {plan.action}
                </span>
              </Link>
            ))}
          </div>
        </div>
        </Reveal>
      </section>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 shrink-0 rounded-full px-3.5 text-sm font-medium',
        active ? 'bg-neutral-950 text-white' : 'bg-white text-slate-600',
      )}
    >
      {children}
    </button>
  )
}
