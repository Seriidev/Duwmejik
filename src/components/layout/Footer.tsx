import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import logoBell from '@/assets/logo-bell.png'
import { Reveal } from '@/components/Reveal'

const address = 'Дом 79, просп. Великого Сапармурата Туркменбаши 79, Aşgabat 744000, Turkmenistan'

export function Footer() {
  return (
    <footer id="contact" className="mt-8 border-t border-line bg-[#f7f9fc] text-slate-800">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 lg:grid-cols-2">
        <Reveal>
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-lg font-semibold text-slate-950">
            <img src={logoBell} alt="" className="size-10 object-contain" />
            Duwmejik
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
            Типография и дизайн: шаблоны, печать и заказы под задачу.
          </p>
        </div>
        </Reveal>

        <Reveal delay={90}>
        <div>
          <p className="text-sm font-semibold tracking-wide text-slate-950">Контакты</p>
          <div className="mt-4 grid gap-4 text-sm text-blue-600">
            <a href="mailto:info@duwmejik.com" className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 shrink-0" />
              info@duwmejik.com
            </a>
            <a href="tel:+99312228605" className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 shrink-0" />
              +(993 12) 22-86-05
            </a>
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              <span>{address}</span>
            </p>
          </div>
        </div>
        </Reveal>
      </div>
      <p className="border-t border-line py-4 text-center text-sm text-slate-400">© {new Date().getFullYear()} Duwmejik</p>
    </footer>
  )
}
