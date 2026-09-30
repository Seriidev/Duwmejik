import { Paperclip } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Reveal } from '@/components/Reveal'
import { useLocaleStore } from '@/store/useLocaleStore'

const topics = ['claim', 'question', 'feedback'] as const
type Topic = (typeof topics)[number]

const content = {
  ru: {
    title: 'Контакты',
    addressLabel: 'Адрес',
    address: 'Дом 79, просп. Великого Сапармурата Туркменбаши 79, Aşgabat 744000, Turkmenistan',
    phoneLabel: 'Телефоны',
    phones: ['+(993 12) 22-86-05', '+(993 12) 22-94-93', '+(993 60) 20-31-10'],
    emailLabel: 'Факс и электронные почты',
    emails: ['+(993 12) 22-94-87', 'info@duwmejik.com', 'manager.duwmejik@gmail.com'],
    hoursLabel: 'Режим работы',
    hours: ['Понедельник – Пятница: 9:00 – 18:00', 'Суббота: 10:00 – 14:00', 'Воскресенье: Выходной'],
    liveLabel: 'Онлайн-помощь',
    live: 'Пн–пт 09:00–18:00',
    finance: 'По финансовым и офисным вопросам звоните:',
    write: 'Напишите нам',
    tabs: { claim: 'Заявка', question: 'Вопрос', feedback: 'Отзыв' },
    name: 'Ваше имя',
    emailField: 'Почта',
    message: 'Сообщение',
    extensions: 'Допустимые форматы',
    attach: 'Прикрепить файл',
    consent:
      'Согласен, чтобы Duwmejik сохранил сообщение и ответил на указанную почту. Согласие можно отозвать письмом на info@duwmejik.com.',
    send: 'Отправить',
    sent: 'Сообщение принято. Мы ответим на указанную почту.',
  },
  tk: {
    title: 'Kontaktlar',
    addressLabel: 'Salgy',
    address: 'Дом 79, просп. Великого Сапармурата Туркменбаши 79, Aşgabat 744000, Turkmenistan',
    phoneLabel: 'Telefonlar',
    phones: ['+(993 12) 22-86-05', '+(993 12) 22-94-93', '+(993 60) 20-31-10'],
    emailLabel: 'Faks we e-poçtalar',
    emails: ['+(993 12) 22-94-87', 'info@duwmejik.com', 'manager.duwmejik@gmail.com'],
    hoursLabel: 'Iş wagty',
    hours: ['Duşenbe – Anna: 9:00 – 18:00', 'Şenbe: 10:00 – 14:00', 'Ýekşenbe: Dynç güni'],
    liveLabel: 'Onlaýn kömek',
    live: 'Duşenbe–Anna 09:00–18:00',
    finance: 'Maliýe we ofis soraglary üçin jaň ediň:',
    write: 'Bize ýazyň',
    tabs: { claim: 'Arza', question: 'Sorag', feedback: 'Teswir' },
    name: 'Adyňyz',
    emailField: 'Poçta',
    message: 'Habar',
    extensions: 'Rugsat berlen formatlar',
    attach: 'Faýl goş',
    consent:
      'Duwmejik habary saklap, görkezilen poçta jogap bersin. Razylgy info@duwmejik.com salgysyna hat ýazyp yzyna alyp bolýar.',
    send: 'Ibermek',
    sent: 'Habar kabul edildi. Görkezilen poçtaňyza jogap bereris.',
  },
} as const

export function ContactSection() {
  const locale = useLocaleStore((state) => state.locale)
  const page = content[locale]
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [topic, setTopic] = useState<Topic>('claim')
  const [fileName, setFileName] = useState('')
  const [sent, setSent] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSent(true)
  }

  return (
    <section id="contacts" className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-16 sm:px-6">
      <div className="rounded-[32px] bg-white p-6 shadow-[0_16px_50px_rgba(55,70,120,0.08)] sm:p-10">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
          <Reveal>
          <div>
            <h2 className="text-4xl font-semibold tracking-tight">{page.title}</h2>
            <div className="mt-6 divide-y divide-slate-200">
              <Info label={page.addressLabel} lines={[page.address]} />
              <Info label={page.phoneLabel} lines={[...page.phones]} emphasis />
              <Info label={page.emailLabel} lines={[...page.emails]} />
              <Info label={page.hoursLabel} lines={[...page.hours]} />
              <Info label={page.liveLabel} lines={[page.live]} />
              <div className="py-5">
                <p className="font-semibold">{page.finance}</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{page.phones[0]}</p>
              </div>
            </div>
          </div>
          </Reveal>

          <Reveal delay={120}>
          <form onSubmit={onSubmit} className="rounded-[28px] bg-blue-600 p-6 text-white sm:p-7">
            <p className="text-sm font-semibold tracking-[0.14em]">{page.write.toUpperCase()}</p>
            {sent ? (
              <p className="mt-6 leading-7 text-white/90">{page.sent}</p>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {topics.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTopic(item)}
                      className={
                        topic === item
                          ? 'h-10 rounded-full bg-white text-sm font-semibold text-slate-900'
                          : 'h-10 rounded-full text-sm font-semibold text-white/90 hover:bg-white/10'
                      }
                    >
                      {page.tabs[item]}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="topic" value={topic} />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <input
                    required
                    name="name"
                    placeholder={page.name}
                    className="h-12 rounded-full bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <label className="flex h-12 items-center gap-1 rounded-full bg-white px-3 text-slate-900">
                    <span aria-hidden="true">🇹🇲</span>
                    <span className="text-sm font-medium">+993</span>
                    <input
                      required
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="65 45-00-12"
                      aria-label={page.phoneLabel}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </label>
                </div>
                <input
                  required
                  name="email"
                  type="email"
                  placeholder={page.emailField}
                  className="mt-3 h-12 w-full rounded-full bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <textarea
                  required
                  name="message"
                  placeholder={page.message}
                  className="mt-3 min-h-36 w-full resize-none rounded-3xl bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                <p className="mt-4 text-sm text-white/80">{page.extensions}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-white/15 px-3 font-medium hover:bg-white/25"
                  >
                    <Paperclip className="size-4" />
                    {page.attach}
                  </button>
                  <span className="text-white/75">{fileName || 'JPG, JPEG, PNG, XLS, HEIC, WEBP'}</span>
                  <input
                    ref={fileRef}
                    name="file"
                    type="file"
                    accept=".jpg,.jpeg,.png,.xls,.xlsx,.heic,.webp"
                    className="hidden"
                    onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
                  />
                </div>
                <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-white/85">
                  <input required name="consent" type="checkbox" className="mt-0.5 size-5 shrink-0 accent-white" />
                  <span>{page.consent}</span>
                </label>
                <button type="submit" className="mt-5 h-14 w-full rounded-full bg-white text-base font-semibold text-slate-900">
                  {page.send}
                </button>
              </>
            )}
          </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Info({ label, lines, href, emphasis }: { label: string; lines: string[]; href?: string; emphasis?: boolean }) {
  return (
    <div className="py-5">
      <p className="font-semibold">{label}</p>
      <div className={emphasis ? 'mt-2 grid gap-1 text-base font-semibold text-slate-900' : 'mt-2 grid gap-1 text-slate-700'}>
        {lines.map((line) =>
          href ? (
            <a key={line} href={href} className="hover:text-blue-700">
              {line}
            </a>
          ) : (
            <p key={line}>{line}</p>
          ),
        )}
      </div>
    </div>
  )
}
