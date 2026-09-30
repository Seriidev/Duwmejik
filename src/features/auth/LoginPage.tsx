import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { ROLE_LABEL } from '@/data/labels'
import { useAuthStore } from '@/store/useAuthStore'

const demos = [
  { email: 'buyer@duwmejik.ru', label: 'Покупатель' },
  { email: 'seller@duwmejik.ru', label: 'Дизайнер' },
  { email: 'admin@duwmejik.ru', label: 'Админ' },
]

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/account'
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('demo')
  const [error, setError] = useState('')

  function go() {
    navigate(from)
  }

  return (
    <div className="mx-auto grid max-w-xl gap-6 px-4 py-12">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">{mode === 'login' ? 'Вход' : 'Регистрация'}</h1>
        <p className="mt-2 text-muted">Пароль у демо-аккаунтов — demo. Роли: {ROLE_LABEL.buyer}, {ROLE_LABEL.seller}, {ROLE_LABEL.admin}.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {demos.map((demo) => (
          <button
            key={demo.email}
            type="button"
            className="rounded-2xl border border-line bg-card px-3 py-3 text-left text-sm hover:border-violet-400"
            onClick={() => {
              const message = login(demo.email, 'demo')
              if (message) setError(message)
              else go()
            }}
          >
            <span className="block font-semibold">{demo.label}</span>
            <span className="text-muted">{demo.email}</span>
          </button>
        ))}
      </div>
      <Card className="p-5">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            const message = mode === 'login' ? login(email, password) : register(name, email, password)
            if (message) setError(message)
            else go()
          }}
        >
          {mode === 'register' && <Input label="Имя" value={name} onChange={(event) => setName(event.target.value)} />}
          <Input label="Почта" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Пароль" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error && (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          )}
          <Button type="submit">{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</Button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-violet-700"
          onClick={() => {
            setMode((current) => (current === 'login' ? 'register' : 'login'))
            setError('')
          }}
        >
          {mode === 'login' ? 'Нет аккаунта — зарегистрироваться' : 'Уже есть аккаунт — войти'}
        </button>
      </Card>
      <Link to="/" className="text-sm text-muted">
        На главную
      </Link>
    </div>
  )
}
