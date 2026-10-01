import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/useAuthStore'

export function LoginPage() {
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/account'
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  function switchMode() {
    setMode((current) => (current === 'login' ? 'register' : 'login'))
    setError('')
    setPassword('')
    setConfirm('')
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <div className="w-full">
        <h1 className="text-3xl font-semibold tracking-tight">{mode === 'login' ? 'Вход' : 'Регистрация'}</h1>
        <p className="mt-2 text-sm text-muted">
          {mode === 'login' ? 'Введите почту и пароль, чтобы открыть кабинет.' : 'Создайте аккаунт, чтобы сохранять макеты и оформлять заказы.'}
        </p>
        <Card className="mt-6 p-6">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (mode === 'register' && password !== confirm) {
                setError('Пароли не совпадают')
                return
              }
              const message = mode === 'login' ? login(email, password) : register(name, email, password)
              if (message) setError(message)
              else navigate(from)
            }}
          >
            {mode === 'register' && (
              <Input label="Имя" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
            )}
            <Input
              label="Почта"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input
              label="Пароль"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={mode === 'register' ? 4 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {mode === 'register' && (
              <Input
                label="Повторите пароль"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            )}
            {error && (
              <p role="alert" className="text-sm text-rose-600">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full">
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button type="button" className="font-medium text-violet-700" onClick={switchMode}>
              {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </Card>
        <Link to="/" className="mt-5 inline-block text-sm text-muted">
          На главную
        </Link>
      </div>
    </div>
  )
}
