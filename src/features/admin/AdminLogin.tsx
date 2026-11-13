'use client'

import { useState, type FormEvent } from 'react'
import logoBell from '@/assets/logo-bell.png'
import { isStaff } from '@/lib/authHref'
import { useAuthStore } from '@/store/useAuthStore'

export function AdminLogin({ seat = 'u-admin' }: { seat?: 'u-admin' | 'u-workshop' | 'u-boss' }) {
  const loginAdmin = useAuthStore((state) => state.loginAdmin)
  const user = useAuthStore((state) => state.user)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const title = seat === 'u-workshop' ? 'admin2' : seat === 'u-boss' ? 'суперадмин' : 'admin1'

  function submit(event: FormEvent) {
    event.preventDefault()
    const message = loginAdmin(password, seat)
    if (message) setError(message)
  }

  return (
    <div className="grid min-h-svh place-items-center bg-[#f3f4f6] px-4">
      <form onSubmit={submit} className="w-full max-w-[400px] rounded-2xl bg-white px-8 py-8 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
        <h1 className="flex items-center gap-2 text-[17px] font-semibold tracking-tight text-neutral-950">
          <img src={logoBell.src} alt="" className="size-9 object-contain" />
          Duwmejik
        </h1>
        <p className="mt-4 text-sm font-medium text-neutral-800">Вход {title}</p>
        <p className="mt-1 text-sm text-neutral-500">Введите пароль, чтобы продолжить.</p>
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-6 h-11 w-full rounded-lg border border-neutral-200 px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-400"
        />
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button type="submit" className="mt-4 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white hover:brightness-110">
          Войти
        </button>
        {user && !isStaff(user.role) && <p className="mt-4 text-xs text-neutral-400">Сейчас вы вошли как {user.name}. Вход здесь сменит аккаунт.</p>}
      </form>
    </div>
  )
}
