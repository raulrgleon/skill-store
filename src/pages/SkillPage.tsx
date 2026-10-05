import { lazy, Suspense, useEffect, useState } from 'react'
import { BadgeCheck, Check, ChevronLeft, Copy } from 'lucide-react'
import { Gallery } from '../components/Gallery'
import { SkillCard } from '../components/SkillCard'
import { SkillIcon } from '../components/SkillIcon'
import { skills } from '../data/skills'
import { TARGET_LABEL, type InstallTarget } from '../lib/api'
import { authorPath, installCommand, publicCatalog } from '../lib/catalog'
import { formatCount } from '../lib/format'
import { useRouter } from '../lib/router'
import { loadSkillDoc, type SkillDoc } from '../lib/skillDoc'
import { installableTargets } from '../lib/targets'
import { useStore } from '../store'
import type { Agent, Compatibility, Skill } from '../types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { Stars } from '../ui/Stars'
import { Tabs } from '../ui/Tabs'
import { WebInstall } from '../components/WebInstall'

const Markdown = lazy(() => import('../ui/Markdown'))

const agents: Agent[] = ['Cursor', 'Claude', 'ChatGPT', 'Codex', 'Gemini', 'Copilot']

const levelLabel: Record<Compatibility, string> = {
  full: 'Funciona',
  partial: 'Parcial',
  none: 'No aplica',
}

function DocView({ skill }: { skill: Skill }) {
  const [doc, setDoc] = useState<SkillDoc | null | undefined>(undefined)

  useEffect(() => {
    let live = true
    setDoc(undefined)
    loadSkillDoc(skill.id)
      .then((value) => live && setDoc(value))
      .catch(() => live && setDoc(null))
    return () => {
      live = false
    }
  }, [skill.id])

  if (doc === undefined) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (doc === null) {
    return (
      <div className="max-w-[68ch] space-y-4 text-[16px] leading-relaxed">
        <p>{skill.description}</p>
        <p className="text-mute">{skill.whatsNew}</p>
      </div>
    )
  }

  return (
    <div>
      {doc.meta.description ? (
        <div className="mb-8 max-w-[72ch] rounded-[12px] border border-line bg-surface p-4">
          <p className="text-[13px] text-mute">Cuándo la usa el agente</p>
          <p className="mt-1 text-[15px] leading-relaxed">{doc.meta.description}</p>
        </div>
      ) : null}
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Markdown>{doc.body}</Markdown>
      </Suspense>
    </div>
  )
}

function InstallPanel({ skill }: { skill: Skill }) {
  const { homes, statusOf, requestInstall, removeSkill, installed, installer, ready, notify } = useStore()
  const options = installableTargets(skill)
  const [target, setTarget] = useState<InstallTarget | null>(options[0]?.id ?? null)
  const [copied, setCopied] = useState(false)
  const status = statusOf(skill.id)
  const command = installCommand(skill.id, target ?? undefined)
  const where = installed[skill.id]

  async function copy() {
    try {
      await navigator.clipboard.writeText(command)
      setCopied(true)
      notify('Comando copiado')
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      notify('No se pudo copiar el comando')
    }
  }

  if (!ready) return <Skeleton className="h-44 w-full rounded-[14px]" />

  if (!installer) {
    return (
      <div className="space-y-3 rounded-[14px] border border-line bg-surface p-4">
        <p className="text-[15px] font-medium">Instalar</p>
        <WebInstall skill={skill} />
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-[14px] border border-line bg-surface p-4">
      <Button className="w-full" disabled={status !== 'idle'} onClick={() => requestInstall(skill.id)}>
        {status === 'busy' ? 'Instalando…' : status === 'installed' ? 'Instalada' : 'Instalar'}
      </Button>

      {status === 'installed' && where?.length ? (
        <div className="flex items-center justify-between gap-3 text-[13px] text-mute">
          <span>En {where.map((item) => TARGET_LABEL[item]).join(', ')}</span>
          <button type="button" className="text-accent hover:underline" onClick={() => removeSkill(skill.id)}>
            Quitar
          </button>
        </div>
      ) : null}

      {options.length > 0 ? (
        <div>
          <div role="tablist" aria-label="Agente" className="grid grid-cols-3 gap-1 rounded-[10px] bg-surface-2 p-1">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={target === option.id}
                onClick={() => setTarget(option.id)}
                className={`h-8 rounded-[8px] text-[13px] ${target === option.id ? 'bg-surface text-ink shadow-sm' : 'text-mute hover:text-ink'}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-[10px] border border-line bg-canvas p-3">
            <div className="flex items-start gap-2">
              <code className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed break-all">{command}</code>
              <button type="button" aria-label="Copiar comando" onClick={copy} className="rounded-[8px] p-1 text-mute hover:text-ink">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            {target ? <p className="mt-2 truncate font-mono text-[11px] text-mute">{homes[target]}/{skill.id}</p> : null}
          </div>
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed text-mute">Esta skill no tiene carpeta en Cursor, Claude ni Codex.</p>
      )}
    </div>
  )
}

export function SkillPage({ id }: { id: string }) {
  const skill = skills.find((item) => item.id === id) ?? null
  const { navigate } = useRouter()
  const [tab, setTab] = useState('skill')

  if (!skill) {
    return (
      <div className="mx-auto max-w-[1200px] px-5 py-16">
        <h1 className="text-[32px] font-medium tracking-tight">Esa skill no está en el catálogo</h1>
        <Button className="mt-6" variant="secondary" onClick={() => navigate('/explorar')}>
          Volver a explorar
        </Button>
      </div>
    )
  }

  const related = publicCatalog().filter((item) => item.category === skill.category && item.id !== skill.id).slice(0, 3)

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8">
      <button type="button" onClick={() => navigate('/explorar')} className="inline-flex items-center gap-1 text-[14px] text-mute hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Catálogo
      </button>

      <header className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <SkillIcon skill={skill} size={88} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[36px] leading-none font-medium tracking-[-0.03em]">{skill.name}</h1>
            {skill.verified ? (
              <Badge tone="accent">
                <BadgeCheck size={12} aria-hidden /> Verificada
              </Badge>
            ) : null}
            {skill.private ? <Badge>Privada</Badge> : null}
          </div>
          <p className="mt-3 max-w-[56ch] text-[16px] leading-relaxed text-mute">{skill.subtitle}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-mute">
            <button type="button" onClick={() => navigate(authorPath(skill.author))} className="text-accent hover:underline">
              {skill.author}
            </button>
            <span>Versión {skill.version}</span>
            <span>{skill.size}</span>
          </p>
        </div>
      </header>

      {skill.gallery && skill.gallery.length > 0 ? <Gallery id={skill.id} items={skill.gallery} /> : null}

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Tabs
          label="Contenido de la skill"
          tabs={[
            { id: 'skill', label: 'SKILL.md' },
            { id: 'ejemplos', label: 'Ejemplos' },
            { id: 'versiones', label: 'Versiones' },
            { id: 'resenas', label: 'Reseñas' },
          ]}
          value={tab}
          onChange={setTab}
        >
          {tab === 'skill' ? <DocView skill={skill} /> : null}

          {tab === 'ejemplos' ? (
            skill.screenshots.length === 0 ? (
              <p className="text-[15px] text-mute">Esta skill no incluye ejemplos.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-3">
                {skill.screenshots.map((shot) => (
                  <li key={shot.title} className="rounded-[12px] border border-line bg-surface p-4">
                    <h3 className="text-[15px] font-medium">{shot.title}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-mute">{shot.body}</p>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {tab === 'versiones' ? (
            <article className="max-w-[60ch] rounded-[12px] border border-line p-4">
              <p className="text-[14px] text-mute">Versión actual</p>
              <h3 className="mt-1 text-[18px] font-medium">{skill.version}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-mute">{skill.whatsNew}</p>
            </article>
          ) : null}

          {tab === 'resenas' ? (
            skill.reviews.length === 0 ? (
              <p className="text-[15px] text-mute">Todavía no hay reseñas.</p>
            ) : (
              <ul className="max-w-[68ch] space-y-4">
                {skill.reviews.map((review) => (
                  <li key={`${review.user}-${review.date}`} className="border-b border-line pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[14px] font-medium">{review.user}</p>
                      <p className="text-[13px] text-mute">{review.date}</p>
                    </div>
                    <div className="mt-1">
                      <Stars value={review.rating} />
                    </div>
                    <p className="mt-2 text-[14px] leading-relaxed text-mute">{review.text}</p>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </Tabs>

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <InstallPanel skill={skill} />

          <div className="space-y-4 rounded-[14px] border border-line bg-surface p-4">
            <div>
              {skill.ratingsCount === 0 ? (
                <p className="text-[14px] text-mute">Aún sin valoraciones</p>
              ) : (
                <>
                  <Stars value={skill.rating} />
                  <p className="mt-2 text-[14px] text-mute">
                    {skill.rating.toFixed(1)} de {formatCount(skill.ratingsCount)} valoraciones
                  </p>
                </>
              )}
            </div>
            <dl className="space-y-2 text-[14px]">
              <Row label="Precio" value={skill.price} />
              <Row label="Categoría" value={skill.category} />
            </dl>
            <div>
              <p className="text-[13px] text-mute">Compatibilidad</p>
              <ul className="mt-2 space-y-1.5">
                {agents.map((agent) => {
                  const level = skill.compatibility[agent] ?? 'none'
                  return (
                    <li key={agent} className="flex items-center justify-between text-[14px]">
                      <span>{agent}</span>
                      <span className={level === 'full' ? 'text-accent' : 'text-mute'}>{levelLabel[level]}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-[22px] font-medium tracking-tight">También en {skill.category}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <SkillCard key={item.id} skill={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-mute">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
