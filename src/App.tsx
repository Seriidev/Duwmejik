import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { buttonClass } from '@/components/ui/Button'
import { AccountPage } from '@/features/account/AccountPage'
import { AdminPage } from '@/features/admin/AdminPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { CartPage } from '@/features/cart/CartPage'
import { CheckoutPage } from '@/features/cart/CheckoutPage'
import { CatalogPage } from '@/features/catalog/CatalogPage'
import { ProductPage } from '@/features/catalog/ProductPage'
import { HomePage } from '@/features/home/HomePage'
import { OrderWizardPage } from '@/features/orders/OrderWizardPage'
import { SellerPage } from '@/features/seller/SellerPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<Navigate to="/#about" replace />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/contacts" element={<Navigate to="/#contacts" replace />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order" element={<OrderWizardPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/seller" element={<SellerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Страница не найдена</h1>
      <Link to="/" className={buttonClass('primary', 'md', 'mt-6')}>
        На главную
      </Link>
    </div>
  )
}
