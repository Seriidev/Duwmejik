export type Role = 'buyer' | 'seller' | 'admin'

export type FileType = 'PSD' | 'AI' | 'Figma' | 'PNG' | 'PDF'

export type StyleId = 'minimal' | 'bold' | 'elegant' | 'playful' | 'corporate'

export type Orientation = 'portrait' | 'landscape' | 'square'

export type LicenseId = 'personal' | 'commercial' | 'extended'

export type ProductStatus = 'published' | 'pending' | 'rejected'

export type ServiceType = 'print' | 'souvenir' | 'graphic' | 'identity' | 'laser'

export type TariffId = 'basic' | 'standard' | 'premium'

export type OrderStatus = 'new' | 'in_progress' | 'done' | 'cancelled'

export interface Category {
  id: string
  title: string
  color: string
  blurb: string
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  categoryId: string
  fileTypes: FileType[]
  colors: string[]
  style: StyleId
  orientation: Orientation
  license: LicenseId
  author: string
  authorId: string
  downloads: number
  rating: number
  accent: string
  seed: number
  tags: string[]
  status: ProductStatus
}

export interface ProductDraft {
  title: string
  description: string
  price: number
  categoryId: string
  fileTypes: FileType[]
  colors: string[]
  style: StyleId
  orientation: Orientation
  license: LicenseId
  tags: string[]
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  phone: string
  company: string
  city: string
  address: string
}

export interface AccountUser extends SessionUser {
  password: string
}

export interface Purchase {
  id: string
  userId: string
  productId: string
  title: string
  price: number
  purchasedAt: string
}

export interface CustomOrder {
  id: string
  userId: string
  service: ServiceType
  subtype: string
  tariff: TariffId
  price: number
  days: number
  status: OrderStatus
  customerName: string
  email: string
  phone: string
  comment: string
  quantity: number
  references: string[]
  brief: Record<string, string>
  createdAt: string
}
