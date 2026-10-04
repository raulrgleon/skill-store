import { useEffect, useMemo, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { InstallSheet } from './components/InstallSheet'
import { SkillDetail } from './components/SkillDetail'
import { StoreHeader } from './components/StoreHeader'
import { Toast } from './components/Toast'
import { skills } from './data/skills'
import { fetchInstalled, installSkill, uninstallSkill, type InstallTarget, type InstalledMap } from './lib/api'
import { formatTargets } from './lib/targets'
import { ExplorePage } from './pages/ExplorePage'
import { LibraryPage } from './pages/LibraryPage'
import { TeamsPage } from './pages/TeamsPage'
import { TodayPage } from './pages/TodayPage'
import type { StoreTab } from './types'

const fallbackHomes: Record<InstallTarget, string> = {
  cursor: '~/.cursor/skills',
  claude: '~/.claude/skills',
  codex: '~/.codex/skills',
}

export default function App() {
  const [tab, setTab] = useState<StoreTab>('hoy')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [busy, setBusy] = useState<string[]>([])
  const [installed, setInstalled] = useState<InstalledMap>({})
  const [homes, setHomes] = useState(fallbackHomes)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const selected = useMemo(
    () => skills.find((skill) => skill.id === selectedId) ?? null,
    [selectedId],
  )
  const pending = useMemo(
    () => skills.find((skill) => skill.id === pendingId) ?? null,
    [pendingId],
  )

  useEffect(() => {
    fetchInstalled()
      .then((data) => {
        setInstalled(data.installed)
        setHomes(data.homes)
      })
      .catch(() => {
        setToast('Reinicia npm run dev para activar el instalador.')
      })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function statusOf(id: string) {
    if (busy.includes(id)) return 'busy'
    if (installed[id]?.length) return 'installed'
    return 'idle'
  }

  function handleGet(id: string) {
    if (busy.includes(id)) return
    if (installed[id]?.length) {
      setSelectedId(id)
      return
    }
    setError(null)
    setPendingId(id)
  }

  async function confirmInstall(targets: InstallTarget[]) {
    if (!pendingId) return
    const id = pendingId
    setBusy((current) => [...current, id])
    setError(null)
    try {
      const result = await installSkill(id, targets)
      setInstalled((current) => ({ ...current, [id]: result.targets }))
      setPendingId(null)
      setToast(`Instalada en ${formatTargets(result.targets)}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo instalar')
    } finally {
      setBusy((current) => current.filter((item) => item !== id))
    }
  }

  async function handleRemove(id: string) {
    setBusy((current) => [...current, id])
    try {
      await uninstallSkill(id)
      setInstalled((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
      setToast('Skill quitada de tus agentes')
    } catch (reason) {
      setToast(reason instanceof Error ? reason.message : 'No se pudo quitar')
    } finally {
      setBusy((current) => current.filter((item) => item !== id))
    }
  }

  const installedIds = Object.keys(installed)

  return (
    <div className="min-h-svh bg-paper pb-20 md:pb-0">
      <StoreHeader
        tab={tab}
        query={query}
        onTab={setTab}
        onQuery={(value) => {
          setQuery(value)
          if (value) setTab('explorar')
        }}
      />

      {tab === 'hoy' ? (
        <TodayPage
          statusOf={statusOf}
          onOpen={setSelectedId}
          onGet={handleGet}
          onExplore={() => setTab('explorar')}
        />
      ) : null}

      {tab === 'explorar' ? (
        <ExplorePage query={query} statusOf={statusOf} onOpen={setSelectedId} onGet={handleGet} />
      ) : null}

      {tab === 'equipos' ? (
        <TeamsPage statusOf={statusOf} onOpen={setSelectedId} onGet={handleGet} />
      ) : null}

      {tab === 'biblioteca' ? (
        <LibraryPage
          installed={installedIds}
          locations={installed}
          statusOf={statusOf}
          onOpen={setSelectedId}
          onGet={handleGet}
          onExplore={() => setTab('explorar')}
        />
      ) : null}

      <BottomNav tab={tab} onTab={setTab} />

      {selected ? (
        <SkillDetail
          skill={selected}
          status={statusOf(selected.id)}
          installedOn={installed[selected.id]}
          onClose={() => setSelectedId(null)}
          onGet={() => handleGet(selected.id)}
          onRemove={() => handleRemove(selected.id)}
        />
      ) : null}

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

      {toast ? <Toast message={toast} /> : null}
    </div>
  )
}
