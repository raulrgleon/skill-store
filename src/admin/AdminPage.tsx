import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BadgeCheck, ExternalLink, LogOut, Pencil, Plus, Search, Trash2, UploadCloud } from 'lucide-react'
import { SkillIcon } from '../components/SkillIcon'
import { categories } from '../data/skills'
import { useRouter } from '../lib/router'
import { skillPath } from '../lib/catalog'
import { useStore } from '../store'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field, Input } from '../ui/Input'
import { Skeleton } from '../ui/Skeleton'
import { adminApi, AuthError, flash, takeFlash, type AdminItem, type AdminMode, type AdminStatus } from './api'
import { useAdminSession } from './Gate'

const CODE_LABEL: Record<string, string> = {
  M: 'Modificado',
  A: 'Nuevo',
  '??': 'Nuevo',
  D: 'Eliminado',
  R: 'Renombrado',
}

function PublishDialog({
  status,
  onClose,
  onDone,
}: {
  status: AdminStatus
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [message, setMessage] = useState('Actualizar catálogo')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function publish() {
    setBusy(true)
    setError(null)
    try {
      const result = await adminApi.publish(message)
      onDone(`Publicado (${result.commit}). Coolify despliega en ~1 minuto.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar.')
      setBusy(false)
    }
  }

  return (
    <Dialog title="Publicar cambios" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[14px] leading-relaxed text-mute">
          Se hace commit solo del catálogo y se sube a <span className="text-ink">{status.branch}</span>. El webhook
          despliega el sitio solo.
        </p>

        {status.changes.length > 0 ? (
          <ul className="max-h-48 divide-y divide-line overflow-auto rounded-[10px] border border-line text-[13px]">
            {status.changes.map((change) => (
              <li key={change.file} className="flex items-center gap-3 px-3 py-2">
                <Badge className="shrink-0">{CODE_LABEL[change.code] ?? change.code}</Badge>
                <span className="min-w-0 truncate font-mono text-[12px]">{change.file}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[10px] border border-line px-3 py-2 text-[13px] text-mute">
            No hay cambios nuevos, pero hay {status.ahead} {status.ahead === 1 ? 'commit' : 'commits'} sin subir.
          </p>
        )}

        {status.changes.length > 0 ? (
          <Field label="Mensaje del cambio">
            <Input value={message} maxLength={120} onChange={(event) => setMessage(event.target.value)} />
          </Field>
        ) : null}

        {error ? (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={publish} disabled={busy || (status.changes.length > 0 && !message.trim())}>
            <UploadCloud size={15} aria-hidden />
            {busy ? 'Publicando…' : 'Publicar ahora'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

function DeleteDialog({
  item,
  mode,
  onClose,
  onDone,
}: {
  item: AdminItem
  mode: AdminMode
  onClose: () => void
  onDone: (message: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { skill } = item

  async function remove() {
    setBusy(true)
    setError(null)
    try {
      await adminApi.remove(skill.id)
      onDone(
        mode === 'remote'
          ? `"${skill.name}" eliminada. La web se actualiza en ~1 minuto.`
          : `"${skill.name}" eliminada. La carpeta quedó en catalog/.trash.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.')
      setBusy(false)
    }
  }

  return (
    <Dialog title="Eliminar skill" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-[14px] leading-relaxed">
          Vas a quitar <strong className="font-medium">{skill.name}</strong> del catálogo.
        </p>
        {mode === 'remote' ? (
          <p className="text-[13px] leading-relaxed text-mute">
            Se borra del repositorio y la web se redespliega sola. Si te equivocas, el historial de git la conserva y se
            puede recuperar.
          </p>
        ) : (
          <p className="text-[13px] leading-relaxed text-mute">
            La carpeta <span className="font-mono text-[12px]">catalog/{skill.id}</span> se mueve a{' '}
            <span className="font-mono text-[12px]">catalog/.trash</span> (no se sube a git). Si ya publicaste esta
            skill, sigue en el historial de git hasta que publiques este cambio.
          </p>
        )}
        {error ? (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={remove} disabled={busy} className="bg-danger text-white hover:brightness-110">
            <Trash2 size={15} aria-hidden />
            {busy ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default function AdminPage() {
  const { navigate } = useRouter()
  const { notify } = useStore()
  const { mode, logout } = useAdminSession()
  const remote = mode === 'remote'
  const [items, setItems] = useState<AdminItem[] | null>(null)
  const [status, setStatus] = useState<AdminStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState<AdminItem | null>(null)

  const load = useCallback(async () => {
    try {
      const [list, git] = await Promise.all([adminApi.list(), adminApi.status()])
      setItems(list.items)
      setStatus(git)
      setError(null)
    } catch (err) {
      // Sesión caducada: recargar muestra la pantalla de acceso.
      if (err instanceof AuthError) return window.location.reload()
      setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo.')
    }
  }, [])

  useEffect(() => {
    const message = takeFlash()
    if (message) notify(message)
    void load()
  }, [load, notify])

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('es')
    return (items ?? []).filter(({ skill }) => {
      if (category && skill.category !== category) return false
      if (!q) return true
      return [skill.name, skill.id, skill.author, skill.category].join(' ').toLocaleLowerCase('es').includes(q)
    })
  }, [items, query, category])

  const pending = status ? status.changes.length + (status.changes.length === 0 ? status.ahead : 0) : 0

  function afterPublish(message: string) {
    notify(message)
    setPublishing(false)
    void load()
  }

  function afterDelete(message: string) {
    // Recarga completa: el catálogo público también debe dejar de ver la skill borrada.
    flash(message)
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-mute">
            {remote
              ? 'Cada cambio se publica al guardar · la web se actualiza en ~1 minuto'
              : 'Solo en tu equipo · no se incluye en la web pública'}
          </p>
          <h1 className="mt-1 text-[32px] font-medium tracking-tight">Administración</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {remote ? (
            <Button variant="ghost" onClick={() => void logout()}>
              <LogOut size={15} aria-hidden />
              Salir
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setPublishing(true)} disabled={!status?.git || pending === 0}>
              <UploadCloud size={15} aria-hidden />
              Publicar cambios
              {pending > 0 ? <Badge tone="accent">{pending}</Badge> : null}
            </Button>
          )}
          <Button onClick={() => navigate('/admin/nueva')}>
            <Plus size={15} aria-hidden />
            Nueva skill
          </Button>
        </div>
      </div>

      {status && !status.git ? (
        <p className="mt-6 flex items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[13px] text-mute">
          <AlertTriangle size={15} aria-hidden /> Esta carpeta no es un repositorio git: puedes editar, pero no publicar.
        </p>
      ) : null}

      {!remote && pending > 0 ? (
        <p className="mt-6 rounded-[10px] border border-accent/40 bg-accent/8 px-3 py-2.5 text-[13px]">
          {status && status.changes.length > 0
            ? `Tienes ${status.changes.length} ${status.changes.length === 1 ? 'archivo' : 'archivos'} sin publicar.`
            : `Tienes ${status?.ahead} commits sin subir.`}{' '}
          Los cambios se ven aquí en local; la web pública no cambia hasta que publiques.
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1 sm:max-w-sm">
          <Search size={15} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-mute" />
          <Input
            aria-label="Buscar skill"
            placeholder="Buscar por nombre, id o autor"
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar por categoría"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-10 rounded-[10px] border border-line bg-surface px-3 text-[14px]"
        >
          <option value="">Todas las categorías</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <p className="ml-auto self-center text-[13px] text-mute">
          {items ? `${visible.length} de ${items.length}` : ''}
        </p>
      </div>

      {error ? (
        <div role="alert" className="mt-6 rounded-[12px] border border-line bg-surface p-5">
          <p className="text-[14px]">{error}</p>
          <Button className="mt-3" variant="secondary" size="sm" onClick={() => void load()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-[12px] border border-line bg-surface">
        <div className="hidden grid-cols-[minmax(0,2.4fr)_1fr_1fr_0.7fr_0.8fr_auto] gap-4 border-b border-line px-4 py-2.5 text-[12px] text-mute md:grid">
          <span>Skill</span>
          <span>Autor</span>
          <span>Categoría</span>
          <span>Versión</span>
          <span>Precio</span>
          <span className="w-[116px]" />
        </div>

        {!items && !error
          ? Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="border-b border-line p-4 last:border-0">
                <Skeleton className="h-10" />
              </div>
            ))
          : null}

        {items && visible.length === 0 ? (
          <p className="px-4 py-12 text-center text-[14px] text-mute">Ninguna skill coincide con ese filtro.</p>
        ) : null}

        <ul>
          {visible.map((item) => {
            const { skill } = item
            return (
              <li
                key={skill.id}
                className="grid items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 last:border-0 md:grid-cols-[minmax(0,2.4fr)_1fr_1fr_0.7fr_0.8fr_auto]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <SkillIcon skill={skill} size={40} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-[14px] font-medium">
                      {skill.name}
                      {skill.verified ? <BadgeCheck size={14} aria-label="Verificada" className="shrink-0 text-accent" /> : null}
                      {skill.private ? <Badge>Privada</Badge> : null}
                    </p>
                    <p className="truncate font-mono text-[12px] text-mute">
                      {skill.id}
                      {!item.hasDoc ? <span className="ml-2 text-danger">sin SKILL.md</span> : null}
                      {item.extraFiles > 0 ? <span className="ml-2 font-sans">+{item.extraFiles} archivos</span> : null}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-mute md:contents md:text-ink">
                  <p className="truncate">{skill.author}</p>
                  <p className="truncate">{skill.category}</p>
                  <p>v{skill.version}</p>
                  <p>{skill.price}</p>
                </div>
                <div className="flex w-[116px] justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Editar ${skill.name}`}
                    onClick={() => navigate(`/admin/editar/${encodeURIComponent(skill.id)}`)}
                  >
                    <Pencil size={15} aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Ver ${skill.name} en el catálogo`}
                    onClick={() => navigate(skillPath(skill.id))}
                  >
                    <ExternalLink size={15} aria-hidden />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Eliminar ${skill.name}`} onClick={() => setDeleting(item)}>
                    <Trash2 size={15} aria-hidden />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {publishing && status ? (
        <PublishDialog status={status} onClose={() => setPublishing(false)} onDone={afterPublish} />
      ) : null}
      {deleting ? <DeleteDialog item={deleting} mode={mode} onClose={() => setDeleting(null)} onDone={afterDelete} /> : null}
    </div>
  )
}
