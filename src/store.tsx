import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { skills } from './data/skills'
import { fetchInstalled, installSkill, uninstallSkill, type InstallTarget, type InstalledMap } from './lib/api'
import { installCommand } from './lib/catalog'
import { formatTargets } from './lib/targets'
import { InstallSheet } from './components/InstallSheet'
import { Toast } from './ui/Toast'

const fallbackHomes: Record<InstallTarget, string> = {
  cursor: '~/.cursor/skills',
  claude: '~/.claude/skills',
  codex: '~/.codex/skills',
}

type Status = 'idle' | 'busy' | 'installed'

type StoreValue = {
  ready: boolean
  homes: Record<InstallTarget, string>
  installed: InstalledMap
  statusOf: (id: string) => Status
  requestInstall: (id: string) => void
  removeSkill: (id: string) => Promise<void>
  copyCommand: (id: string) => Promise<void>
  notify: (message: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [installed, setInstalled] = useState<InstalledMap>({})
  const [homes, setHomes] = useState(fallbackHomes)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState<string[]>([])
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const pending = useMemo(() => skills.find((skill) => skill.id === pendingId) ?? null, [pendingId])

  useEffect(() => {
    fetchInstalled()
      .then((data) => {
        setInstalled(data.installed)
        setHomes(data.homes)
      })
      .catch(() => {
        // En la web pública no hay instalador: un visitante no debe ver instrucciones de desarrollo.
        if (import.meta.env.DEV) setMessage('Reinicia npm run dev para activar el instalador.')
      })
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 3200)
    return () => window.clearTimeout(timer)
  }, [message])

  const value = useMemo<StoreValue>(() => {
    function statusOf(id: string): Status {
      if (busy.includes(id)) return 'busy'
      if (installed[id]?.length) return 'installed'
      return 'idle'
    }

    return {
      ready,
      homes,
      installed,
      statusOf,
      requestInstall(id) {
        if (busy.includes(id)) return
        if (installed[id]?.length) return
        setError(null)
        setPendingId(id)
      },
      async removeSkill(id) {
        setBusy((current) => [...current, id])
        try {
          await uninstallSkill(id)
          setInstalled((current) => {
            const next = { ...current }
            delete next[id]
            return next
          })
          setMessage('Skill quitada de tus agentes')
        } catch (reason) {
          setMessage(reason instanceof Error ? reason.message : 'No se pudo quitar')
        } finally {
          setBusy((current) => current.filter((item) => item !== id))
        }
      },
      async copyCommand(id) {
        try {
          await navigator.clipboard.writeText(installCommand(id))
          setMessage('Comando copiado')
        } catch {
          setMessage('No se pudo copiar el comando')
        }
      },
      notify: setMessage,
    }
  }, [busy, homes, installed, ready])

  async function confirmInstall(targets: InstallTarget[]) {
    if (!pendingId) return
    const id = pendingId
    setBusy((current) => [...current, id])
    setError(null)
    try {
      const result = await installSkill(id, targets)
      setInstalled((current) => ({ ...current, [id]: result.targets }))
      setPendingId(null)
      setMessage(`Instalada en ${formatTargets(result.targets)}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo instalar')
    } finally {
      setBusy((current) => current.filter((item) => item !== id))
    }
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
      {pending ? (
        <InstallSheet
          skill={pending}
          homes={homes}
          busy={busy.includes(pending.id)}
          error={error}
          onClose={() => setPendingId(null)}
          onInstall={confirmInstall}
        />
      ) : null}
      {message ? <Toast message={message} /> : null}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore fuera del provider')
  return value
}
