'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import logoBell from '@/assets/logo-bell.png'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { dashboardFor, isStaff, safeFrom } from '@/lib/authHref'
import { useAuthStore } from '@/store/useAuthStore'

export function LoginPage() {
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const router = useRouter()
  const params = useSearchParams()
  const from = safeFrom(params.get('from'))
  const [mode, setMode] = useState<'login' | 'register'>(params.get('mode') === 'register' ? 'register' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    if (from?.startsWith('/admin') && !isStaff(user.role)) return
    router.replace(from ?? dashboardFor(user.role))
  }, [user, from, router])

  function switchMode() {
    setMode((current) => (current === 'login' ? 'register' : 'login'))
    setError('')
    setPassword('')
    setConfirm('')
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md items-center px-4 py-12">
      <div className="w-full">
        <div className="flex items-center gap-2 font-bold tracking-tight text-neutral-950">
          <img src={logoBell.src} alt="" className="size-9 object-contain" />
          <span className="text-[16px]">Duwmejik</span>
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Добро пожаловать</h1>
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
            <Button type="button" variant="secondary" className="w-full" onClick={() => router.back()}>
              Назад
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted">
            {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button type="button" className="font-medium text-blue-700" onClick={switchMode}>
              {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </p>
        </Card>
      </div>
    </div>
  )
}
