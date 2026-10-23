import { Paperclip } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Reveal } from '@/components/Reveal'
import { useLocaleStore } from '@/store/useLocaleStore'

const topics = ['claim', 'question', 'feedback'] as const
type Topic = (typeof topics)[number]

const content = {
  ru: {
    title: 'Наши контакты',
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
  en: {
    title: 'Contact us',
    addressLabel: 'Address',
    address: 'Дом 79, просп. Великого Сапармурата Туркменбаши 79, Aşgabat 744000, Turkmenistan',
    phoneLabel: 'Phones',
    phones: ['+(993 12) 22-86-05', '+(993 12) 22-94-93', '+(993 60) 20-31-10'],
    emailLabel: 'Fax and email',
    emails: ['+(993 12) 22-94-87', 'info@duwmejik.com', 'manager.duwmejik@gmail.com'],
    hoursLabel: 'Hours',
    hours: ['Monday – Friday: 9:00 – 18:00', 'Saturday: 10:00 – 14:00', 'Sunday: Closed'],
    liveLabel: 'Live help',
    live: 'Mon–Fri 09:00–18:00',
    finance: 'For finance and office questions, call:',
    write: 'Write to us',
    tabs: { claim: 'Request', question: 'Question', feedback: 'Feedback' },
    name: 'Your name',
    emailField: 'Email',
    message: 'Message',
    extensions: 'Allowed formats',
    attach: 'Attach a file',
    consent:
      'I agree that Duwmejik may keep this message and reply to the email above. You can withdraw consent by writing to info@duwmejik.com.',
    send: 'Send',
    sent: 'Message received. We will reply to the email you entered.',
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
    <section id="contacts" className="mx-auto mt-4 max-w-[1180px] scroll-mt-28 px-4 sm:px-6">
      <div className="rounded-[24px] bg-[#EEEFF3] p-4 sm:rounded-[28px] sm:p-6 md:p-8">
        <div className="grid items-start gap-6 md:grid-cols-2 md:gap-8">
          <Reveal>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{page.title}</h2>
            <div className="mt-6 divide-y divide-slate-200">
              <Info label={page.addressLabel} lines={[page.address]} />
              <Info label={page.phoneLabel} lines={[...page.phones]} emphasis />
              <Info label={page.emailLabel} lines={[...page.emails]} />
              <Info label={page.hoursLabel} lines={[...page.hours]} />
              <Info label={page.liveLabel} lines={[page.live]} />
              <div className="py-3.5">
                <p className="font-semibold">{page.finance}</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{page.phones[0]}</p>
              </div>
            </div>
          </div>
          </Reveal>

          <Reveal delay={120}>
          <form onSubmit={onSubmit} className="rounded-[24px] bg-brand p-4 text-white sm:rounded-[28px] sm:p-7">
            <p className="text-sm font-semibold tracking-[0.14em]">{page.write.toUpperCase()}</p>
            {sent ? (
              <p className="mt-6 leading-7 text-white/90">{page.sent}</p>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2">
                  {topics.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTopic(item)}
                      className={
                        topic === item
                          ? 'h-10 rounded-full bg-white px-1 text-xs font-semibold text-slate-900 sm:text-sm'
                          : 'h-10 rounded-full px-1 text-xs font-semibold text-white/90 hover:bg-white/10 sm:text-sm'
                      }
                    >
                      {page.tabs[item]}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="topic" value={topic} />
                <div className="mt-4 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
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
                <button type="submit" className="mt-5 h-11 rounded-full bg-white px-8 text-sm font-semibold text-slate-900">
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
    <div className="py-3.5">
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
