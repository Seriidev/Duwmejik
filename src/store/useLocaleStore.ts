import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Locale = 'ru' | 'en' | 'tk'

const copy = {
  ru: {
    ourHeading: 'Наша галерея',
    home: 'Главный',
    about: 'О нас',
    ourCatalog: 'Шаблоны',
    contacts: 'Контакты',
    order: 'Заказать',
    portfolio: 'Портфолио',
    catalog: 'Каталог',
    cart: 'Корзина',
    profile: 'Профиль',
    account: 'Кабинет',
    seller: 'Кабинет дизайнера',
    admin: 'Админка',
    logout: 'Выйти',
    login: 'Войти',
    hero: 'Заказывай\nдизайн онлайн',
    heroLabel: 'Заказывай дизайн онлайн',
    menuOpen: 'Открыть меню',
    menuClose: 'Закрыть меню',
  },
  en: {
    ourHeading: 'Our gallery',
    home: 'Home',
    about: 'About',
    ourCatalog: 'Templates',
    contacts: 'Contacts',
    order: 'Order',
    portfolio: 'Portfolio',
    catalog: 'Catalog',
    cart: 'Cart',
    profile: 'Profile',
    account: 'Account',
    seller: 'Designer account',
    admin: 'Admin',
    logout: 'Log out',
    login: 'Log in',
    hero: 'Order\ndesign online',
    heroLabel: 'Order design online',
    menuOpen: 'Open menu',
    menuClose: 'Close menu',
  },
  tk: {
    ourHeading: 'Biziň galereýamyz',
    home: 'Esasy',
    about: 'Biz barada',
    ourCatalog: 'Şablonlar',
    contacts: 'Kontaktlar',
    order: 'Sargyt et',
    portfolio: 'Portfolio',
    catalog: 'Katalog',
    cart: 'Sebet',
    profile: 'Profil',
    account: 'Kabinet',
    seller: 'Dizaýner kabineti',
    admin: 'Admin',
    logout: 'Çykmak',
    login: 'Girmek',
    hero: 'Dizaýny\nonlaýn sargyt et',
    heroLabel: 'Dizaýny onlaýn sargyt et',
    menuOpen: 'Menýuny aç',
    menuClose: 'Menýuny ýap',
  },
} as const

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: 'ru',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'duwmejik-locale' },
  ),
)

export function useCopy() {
  const locale = useLocaleStore((state) => state.locale)
  return copy[locale]
}
