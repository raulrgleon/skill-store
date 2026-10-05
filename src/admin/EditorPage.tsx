import { Suspense, lazy, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, FileText, Save, Wand2 } from 'lucide-react'
import { SkillCard } from '../components/SkillCard'
import { SYMBOL_NAMES } from '../icons/symbolNames.ts'
import { symbolIcons } from '../icons/symbols'
import { agents as agentList, categories } from '../data/skills'
import { useRouter } from '../lib/router'
import { cn } from '../lib/cn'
import { useStore } from '../store'
import type { Agent, Compatibility, Skill } from '../types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Field, Input, TextArea } from '../ui/Input'
import { Skeleton } from '../ui/Skeleton'
import { Tabs } from '../ui/Tabs'
import { adminApi, AuthError, flash, takeFlash } from './api'
import { GalleryEditor, newKey, type GalleryItem } from './GalleryEditor'
import { useAdminSession } from './Gate'

const Markdown = lazy(() => import('../ui/Markdown'))

const LEVELS: { id: Compatibility; label: string }[] = [
  { id: 'full', label: 'Completa' },
  { id: 'partial', label: 'Parcial' },
  { id: 'none', label: 'No' },
]

const PALETTE: [string, string][] = [
  ['#4338CA', '#818CF8'],
  ['#0A84FF', '#64D2FF'],
  ['#30D158', '#64D2FF'],
  ['#FF375F', '#FF9F0A'],
  ['#BF5AF2', '#5E5CE6'],
  ['#D97757', '#1A1A1A'],
]

type Form = {
  id: string
  name: string
  subtitle: string
  author: string
  category: string
  price: string
  version: string
  verified: boolean
  private: boolean
  description: string
  whatsNew: string
  compatibility: Record<Agent, Compatibility>
  agents: Agent[]
  from: string
  to: string
  symbol: string
  rating: string
  ratingsCount: string
  size: string
  age: string
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function blankForm(): Form {
  const [from, to] = PALETTE[Math.floor(Math.random() * PALETTE.length)]
  const compatibility = Object.fromEntries(
    agentList.map((agent) => [agent, agent === 'Cursor' || agent === 'Claude' || agent === 'Codex' ? 'full' : 'none']),
  ) as Form['compatibility']
  return {
    id: '',
    name: '',
    subtitle: '',
    author: localStorage.getItem('skillstore-admin-author') ?? '',
    category: 'Productividad',
    price: 'Gratis',
    version: '1.0',
    verified: false,
    private: false,
    description: '',
    whatsNew: '',
    compatibility,
    agents: ['Cursor', 'Claude', 'Codex'],
    from,
    to,
    symbol: '',
    rating: '0',
    ratingsCount: '0',
    size: '',
    age: '4+',
  }
}

function formFromSkill(skill: Skill): Form {
  const compatibility = Object.fromEntries(
    agentList.map((agent) => [agent, skill.compatibility[agent] ?? 'none']),
  ) as Form['compatibility']
  return {
    id: skill.id,
    name: skill.name,
    subtitle: skill.subtitle,
    author: skill.author,
    category: skill.category,
    price: skill.price,
    version: skill.version,
    verified: skill.verified,
    private: Boolean(skill.private),
    description: skill.description,
    whatsNew: skill.whatsNew,
    compatibility,
    agents: skill.agents,
    from: skill.icon.from,
    to: skill.icon.to,
    symbol: skill.icon.symbol ?? '',
    rating: String(skill.rating),
    ratingsCount: String(skill.ratingsCount),
    size: skill.size,
    age: skill.age,
  }
}

function toSkill(form: Form, previous: Skill | null, gallery: GalleryItem[] = []): Skill {
  return {
    id: form.id || 'nueva-skill',
    name: form.name.trim() || 'Nombre de la skill',
    subtitle: form.subtitle.trim() || 'Una línea que explica para qué sirve',
    author: form.author.trim() || 'Autor',
    category: form.category,
    rating: Number(form.rating) || 0,
    ratingsCount: Number(form.ratingsCount) || 0,
    price: form.price.trim() || 'Gratis',
    verified: form.verified,
    ...(form.private ? { private: true } : {}),
    agents: form.agents,
    compatibility: form.compatibility,
    description: form.description.trim() || 'La descripción aparecerá aquí.',
    whatsNew: form.whatsNew.trim(),
    version: form.version.trim() || '1.0',
    size: form.size.trim(),
    age: form.age.trim() || '4+',
    icon: {
      from: form.from,
      to: form.to,
      glyph: previous?.icon.glyph ?? form.name.trim().slice(0, 2),
      ...(form.symbol ? { symbol: form.symbol } : {}),
    },
    ...(gallery.length > 0
      ? { gallery: gallery.map((item) => ({ file: item.file, caption: item.caption.trim(), w: item.w, h: item.h })) }
      : {}),
    story: previous?.story,
    screenshots: previous?.screenshots ?? [],
    reviews: previous?.reviews ?? [],
  }
}

function template(form: Form) {
  const title = form.name.trim() || form.id
  return `---
name: ${form.id}
description: ${form.description.trim() || 'Cuándo debe usar el agente esta skill.'}
---

# ${title}

## Cuándo usarla

- Describe las situaciones en las que el agente debe activar esta skill.

## Cómo trabajar

1. Primer paso.
2. Segundo paso.
3. Entrega el resultado así.

## Reglas

- Lo que nunca debe hacer.
`
}

function docIssues(doc: string, id: string) {
  const issues: string[] = []
  const match = doc.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return ['Falta el bloque inicial --- con name y description: sin él, el agente no sabe cuándo usarla.']
  const meta = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([\w-]+):\s*(.*)$/))
      .filter((pair): pair is RegExpMatchArray => Boolean(pair))
      .map((pair) => [pair[1], pair[2].trim()]),
  )
  if (!meta.name) issues.push('El bloque inicial no tiene name.')
  else if (id && meta.name.replace(/^["']|["']$/g, '') !== id) issues.push(`name debería ser "${id}" (igual que la carpeta).`)
  if (!meta.description) issues.push('El bloque inicial no tiene description.')
  return issues
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-medium">{title}</h2>
      {hint ? <p className="mt-1 text-[13px] text-mute">{hint}</p> : null}
      <div className="mt-4 space-y-4">{children}</div>
    </Card>
  )
}

const selectClass = 'h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-[14px] text-ink outline-none focus-visible:border-accent'

export default function EditorPage({ id }: { id: string | null }) {
  const { navigate } = useRouter()
  const { notify } = useStore()
  const { mode } = useAdminSession()
  const isNew = id === null

  const [form, setForm] = useState<Form>(blankForm)
  const [previous, setPrevious] = useState<Skill | null>(null)
  const [doc, setDoc] = useState('')
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [extraFiles, setExtraFiles] = useState(0)
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [idTouched, setIdTouched] = useState(false)
  const [docTab, setDocTab] = useState('editar')
  const saved = useRef(false)

  useEffect(() => {
    const message = takeFlash()
    if (message) notify(message)
  }, [notify])

  useEffect(() => {
    if (id === null) return
    let alive = true
    adminApi
      .get(id)
      .then((data) => {
        if (!alive) return
        setForm(formFromSkill(data.skill))
        setPrevious(data.skill)
        setGallery((data.skill.gallery ?? []).map((item) => ({ ...item, key: newKey() })))
        setDoc(data.doc)
        setExtraFiles(data.extraFiles)
      })
      .catch((err) => alive && setLoadError(err instanceof Error ? err.message : 'No se pudo cargar la skill.'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (!dirty) return
    function warn(event: BeforeUnloadEvent) {
      if (saved.current) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function patch(partial: Partial<Form>) {
    setForm((current) => ({ ...current, ...partial }))
    setDirty(true)
    setError(null)
  }

  function setName(name: string) {
    patch(idTouched || !isNew ? { name } : { name, id: slugify(name) })
  }

  function setLevel(agent: Agent, level: Compatibility) {
    const compatibility = { ...form.compatibility, [agent]: level }
    // `agents` es la lista que se muestra en tarjetas: sigue a la compatibilidad.
    const agents = agentList.filter((item) => compatibility[item] !== 'none')
    patch({ compatibility, agents })
  }

  const skill = useMemo(() => toSkill(form, previous, gallery), [form, previous, gallery])
  const issues = useMemo(() => docIssues(doc, form.id), [doc, form.id])
  const categoryOptions = categories.some((item) => item.id === form.category)
    ? categories
    : [...categories, { id: form.category, label: form.category, color: '#888888' }]

  function validate() {
    if (!form.name.trim()) return 'Escribe el nombre.'
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.id)) return 'El id solo admite minúsculas, números y guiones.'
    if (!form.subtitle.trim()) return 'Escribe el subtítulo.'
    if (!form.author.trim()) return 'Escribe el autor.'
    if (!form.description.trim()) return 'Escribe la descripción.'
    if (form.agents.length === 0) return 'Marca al menos un agente compatible.'
    const rating = Number(form.rating)
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) return 'La puntuación va de 0 a 5.'
    if (!doc.trim()) return 'El SKILL.md está vacío: es lo que instala el agente.'
    return null
  }

  async function save() {
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = toSkill(form, previous, gallery)
      if (!payload.size) payload.size = `${Math.max(1, Math.round(new Blob([doc]).size / 1024))} KB`
      // Las imágenes nuevas viajan en la misma petición: un solo guardado, un solo commit.
      const uploads = Object.fromEntries(gallery.filter((item) => item.data).map((item) => [item.file, item.data as string]))
      await adminApi.save(form.id, { isNew, skill: payload, doc, uploads })
      localStorage.setItem('skillstore-admin-author', form.author.trim())
      saved.current = true
      const message =
        mode === 'remote'
          ? `"${form.name}" ${isNew ? 'creada' : 'guardada'}. La web se actualiza en ~1 minuto.`
          : isNew
            ? `"${form.name}" creada. Publica los cambios para subirla.`
            : `"${form.name}" guardada.`
      flash(message)
      // Recarga completa: así el catálogo público también ve los datos nuevos.
      window.location.assign('/admin')
    } catch (err) {
      setError(
        err instanceof AuthError
          ? 'Tu sesión terminó. Abre /admin en otra pestaña, inicia sesión y vuelve a pulsar Guardar aquí: no pierdes lo escrito.'
          : err instanceof Error
            ? err.message
            : 'No se pudo guardar.',
      )
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-6 h-96" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <p role="alert" className="text-[15px]">
          {loadError}
        </p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate('/admin')}>
          Volver al listado
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <button
        type="button"
        onClick={() => navigate('/admin')}
        className="inline-flex items-center gap-1.5 text-[13px] text-mute hover:text-ink"
      >
        <ArrowLeft size={14} aria-hidden /> Administración
      </button>
      <h1 className="mt-2 text-[32px] font-medium tracking-tight">
        {isNew ? 'Nueva skill' : form.name || 'Editar skill'}
      </h1>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Section title="Identidad">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre">
                <Input value={form.name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="Code Review" />
              </Field>
              <Field
                label="Id (carpeta)"
                hint={isNew ? 'Se genera del nombre. No se puede cambiar después.' : 'No se puede cambiar: es la carpeta y el comando de instalación.'}
              >
                <Input
                  value={form.id}
                  disabled={!isNew}
                  className="font-mono text-[13px]"
                  onChange={(event) => {
                    setIdTouched(true)
                    patch({ id: slugify(event.target.value) })
                  }}
                  placeholder="code-review"
                />
              </Field>
            </div>
            <Field label="Subtítulo" hint="Una línea que explica para qué sirve.">
              <Input value={form.subtitle} maxLength={90} onChange={(event) => patch({ subtitle: event.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Autor">
                <Input value={form.author} maxLength={40} onChange={(event) => patch({ author: event.target.value })} />
              </Field>
              <Field label="Categoría">
                <select className={selectClass} value={form.category} onChange={(event) => patch({ category: event.target.value })}>
                  {categoryOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Precio" hint="Gratis, Privada o un importe como 9,99 €.">
                <Input value={form.price} maxLength={20} list="precios" onChange={(event) => patch({ price: event.target.value })} />
                <datalist id="precios">
                  <option value="Gratis" />
                  <option value="Privada" />
                </datalist>
              </Field>
              <Field label="Versión">
                <Input value={form.version} maxLength={12} onChange={(event) => patch({ version: event.target.value })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.verified} onChange={(event) => patch({ verified: event.target.checked })} />
                Verificada
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.private} onChange={(event) => patch({ private: event.target.checked })} />
                Privada (solo en Equipos, fuera del catálogo público)
              </label>
            </div>
          </Section>

          <Section title="Descripción">
            <Field label="Descripción" hint={`${form.description.length}/600`}>
              <TextArea value={form.description} maxLength={600} onChange={(event) => patch({ description: event.target.value })} />
            </Field>
            <Field label="Novedades de esta versión" hint="Opcional.">
              <TextArea value={form.whatsNew} maxLength={300} className="min-h-20" onChange={(event) => patch({ whatsNew: event.target.value })} />
            </Field>
          </Section>

          <Section title="Compatibilidad" hint="Con qué agentes funciona. Define dónde aparece la skill en las tarjetas.">
            <ul className="divide-y divide-line rounded-[10px] border border-line">
              {agentList.map((agent) => (
                <li key={agent} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="text-[14px]">{agent}</span>
                  <div role="radiogroup" aria-label={`Compatibilidad con ${agent}`} className="flex rounded-[8px] border border-line p-0.5">
                    {LEVELS.map((level) => {
                      const active = form.compatibility[agent] === level.id
                      return (
                        <button
                          key={level.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setLevel(agent, level.id)}
                          className={cn(
                            'rounded-[6px] px-2.5 py-1 text-[13px]',
                            active ? 'bg-accent text-accent-ink' : 'text-mute hover:text-ink',
                          )}
                        >
                          {level.label}
                        </button>
                      )
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Aspecto" hint="Símbolo y colores del icono.">
            <div>
              <p className="mb-2 text-[13px] text-mute">Símbolo</p>
              <div role="radiogroup" aria-label="Símbolo del icono" className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.symbol === ''}
                  onClick={() => patch({ symbol: '' })}
                  title="Automático: la ilustración original o un destello"
                  className={cn(
                    'grid h-11 place-items-center rounded-[10px] border text-[11px]',
                    form.symbol === '' ? 'border-accent bg-surface-2 text-ink' : 'border-line text-mute hover:text-ink',
                  )}
                >
                  Auto
                </button>
                {SYMBOL_NAMES.map((name) => {
                  const Icon = symbolIcons[name]
                  const active = form.symbol === name
                  return (
                    <button
                      key={name}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={name}
                      title={name}
                      onClick={() => patch({ symbol: name })}
                      className={cn(
                        'grid h-11 place-items-center rounded-[10px] border',
                        active ? 'border-accent bg-surface-2 text-ink' : 'border-line text-mute hover:text-ink',
                      )}
                    >
                      <Icon size={18} aria-hidden />
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              {(['from', 'to'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 text-[14px]">
                  <input
                    type="color"
                    value={form[key]}
                    onChange={(event) => patch({ [key]: event.target.value } as Partial<Form>)}
                    className="size-9 cursor-pointer rounded-[8px] border border-line bg-surface p-0.5"
                    aria-label={key === 'from' ? 'Color inicial' : 'Color final'}
                  />
                  <span className="font-mono text-[12px] text-mute">{form[key].toUpperCase()}</span>
                </label>
              ))}
              <div className="flex gap-1.5" aria-label="Combinaciones sugeridas">
                {PALETTE.map(([from, to]) => (
                  <button
                    key={from}
                    type="button"
                    aria-label={`Usar ${from} y ${to}`}
                    onClick={() => patch({ from, to })}
                    className="size-7 rounded-full ring-1 ring-ink/10"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  />
                ))}
              </div>
            </div>
          </Section>

          <Section title="Imágenes" hint="Capturas o GIF de la skill en uso. Salen en una franja bajo el título de la ficha; la primera es la principal.">
            <GalleryEditor
              skillId={form.id}
              items={gallery}
              onChange={(items) => {
                setGallery(items)
                setDirty(true)
                setError(null)
              }}
            />
          </Section>

          <Section title="SKILL.md" hint="Lo que se copia al agente. El bloque inicial con name y description es lo que decide cuándo la usa.">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[12px] text-mute">catalog/{form.id || '…'}/SKILL.md</p>
              <Button
                variant="secondary"
                size="sm"
                disabled={!form.id}
                onClick={() => {
                  if (doc.trim() && !window.confirm('Esto reemplaza el SKILL.md actual por una plantilla. ¿Continuar?')) return
                  setDoc(template(form))
                  setDirty(true)
                }}
              >
                <Wand2 size={14} aria-hidden /> Usar plantilla
              </Button>
            </div>
            <Tabs
              label="Editor del SKILL.md"
              value={docTab}
              onChange={setDocTab}
              tabs={[
                { id: 'editar', label: 'Editar' },
                { id: 'vista', label: 'Vista previa' },
              ]}
            >
              {docTab === 'editar' ? (
                <textarea
                  aria-label="Contenido de SKILL.md"
                  value={doc}
                  spellCheck={false}
                  onChange={(event) => {
                    setDoc(event.target.value)
                    setDirty(true)
                    setError(null)
                  }}
                  className="min-h-[420px] w-full resize-y rounded-[10px] border border-line bg-surface p-3 font-mono text-[13px] leading-relaxed text-ink outline-none focus-visible:border-accent"
                />
              ) : (
                <div className="min-h-40 rounded-[10px] border border-line p-5">
                  <Suspense fallback={<Skeleton className="h-40" />}>
                    <Markdown>{doc.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '') || '*Sin contenido*'}</Markdown>
                  </Suspense>
                </div>
              )}
            </Tabs>
            {issues.length > 0 && doc.trim() ? (
              <ul className="space-y-1 text-[13px] text-mute" aria-label="Avisos del SKILL.md">
                {issues.map((issue) => (
                  <li key={issue}>• {issue}</li>
                ))}
              </ul>
            ) : null}
            {extraFiles > 0 ? (
              <p className="flex items-start gap-2 text-[13px] text-mute">
                <FileText size={15} aria-hidden className="mt-0.5 shrink-0" />
                Esta skill incluye {extraFiles} {extraFiles === 1 ? 'archivo más' : 'archivos más'} en su carpeta
                (scripts, referencias). Aquí solo se edita SKILL.md; el resto se respeta tal cual.
              </p>
            ) : null}
          </Section>

          <details className="rounded-[12px] border border-line bg-surface p-5">
            <summary className="cursor-pointer text-[15px] font-medium">Métricas (avanzado)</summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Puntuación (0–5)">
                <Input type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(event) => patch({ rating: event.target.value })} />
              </Field>
              <Field label="Valoraciones">
                <Input type="number" min={0} value={form.ratingsCount} onChange={(event) => patch({ ratingsCount: event.target.value })} />
              </Field>
              <Field label="Tamaño" hint="Vacío = se calcula del SKILL.md.">
                <Input value={form.size} maxLength={20} onChange={(event) => patch({ size: event.target.value })} placeholder="24 KB" />
              </Field>
              <Field label="Edad">
                <Input value={form.age} maxLength={6} onChange={(event) => patch({ age: event.target.value })} />
              </Field>
            </div>
          </details>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-[13px] text-mute">Así se verá en el catálogo</p>
          <SkillCard skill={skill} quiet />

          <div className="mt-5 space-y-3">
            {error ? (
              <p role="alert" className="rounded-[10px] border border-danger/40 px-3 py-2 text-[13px] text-danger">
                {error}
              </p>
            ) : null}
            <Button className="w-full" onClick={save} disabled={saving}>
              <Save size={15} aria-hidden />
              {saving ? 'Guardando…' : isNew ? 'Crear skill' : 'Guardar cambios'}
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => navigate('/admin')} disabled={saving}>
              Cancelar
            </Button>
            {dirty ? <p className="text-center text-[12px] text-mute">Tienes cambios sin guardar.</p> : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
