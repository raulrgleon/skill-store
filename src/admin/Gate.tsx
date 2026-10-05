import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { LockKeyhole } from 'lucide-react'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Input'
import { Skeleton } from '../ui/Skeleton'
import { adminApi, type AdminMode, type Session } from './api'

type AdminSession = { mode: AdminMode; logout: () => Promise<void> }

const SessionContext = createContext<AdminSession | null>(null)

export function useAdminSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useAdminSession fuera de AdminGate')
  return value
}

function LoginForm({ configured, onDone }: { configured: boolean; onDone: (session: Session) => void }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!password) return
    setBusy(true)
    setError(null)
    try {
      onDone(await adminApi.login(password))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[420px] px-5 py-16">
      <div className="flex size-11 items-center justify-center rounded-[12px] border border-line bg-surface">
        <LockKeyhole size={18} aria-hidden />
      </div>
      <h1 className="mt-5 text-[28px] font-medium tracking-tight">Administración</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-mute">
        {configured
          ? 'Entra con la contraseña del panel para agregar o editar skills.'
          : 'El panel no está configurado en este servidor (faltan ADMIN_PASSWORD y SESSION_SECRET).'}
      </p>
      {configured ? (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Contraseña">
            <Input
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
            />
          </Field>
          {error ? (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy || !password}>
            {busy ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      ) : null}
    </div>
  )
}

export function AdminGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .session()
      .then(setSession)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo comprobar la sesión.'))
  }, [])

  const logout = useCallback(async () => {
    await adminApi.logout().catch(() => undefined)
    window.location.assign('/admin')
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <p role="alert" className="text-[15px]">
          {error}
        </p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!session.authenticated) return <LoginForm configured={session.configured} onDone={setSession} />

  return <SessionContext.Provider value={{ mode: session.mode, logout }}>{children}</SessionContext.Provider>
}
