import { BadgeCheck, Check, Copy, Star } from 'lucide-react'
import { authorPath, skillPath } from '../lib/catalog'
import { formatCount } from '../lib/format'
import { useRouter } from '../lib/router'
import { installableTargets } from '../lib/targets'
import { useStore } from '../store'
import type { Skill } from '../types'
import { Button } from '../ui/Button'
import { SkillIcon } from './SkillIcon'

type SkillCardProps = {
  skill: Skill
  quiet?: boolean
  large?: boolean
}

export function SkillCard({ skill, quiet = false, large = false }: SkillCardProps) {
  const { navigate } = useRouter()
  const { statusOf, requestInstall, copyCommand } = useStore()
  const status = statusOf(skill.id)
  const agents = installableTargets(skill).filter((item) => item.level === 'full')

  return (
    <article className="card-hover group flex h-full flex-col rounded-[14px] border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => navigate(skillPath(skill.id))} aria-label={`Abrir ${skill.name}`} disabled={quiet} className="rounded-[12px]">
          <SkillIcon skill={skill} size={large ? 56 : 44} />
        </button>
        <div className="min-w-0 flex-1 pt-0.5">
          <button
            type="button"
            onClick={() => navigate(skillPath(skill.id))}
            disabled={quiet}
            className="block max-w-full truncate text-left text-[15px] font-medium tracking-tight hover:text-accent"
          >
            {skill.name}
          </button>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-mute">
            <button type="button" className="truncate hover:text-ink" disabled={quiet} onClick={() => navigate(authorPath(skill.author))}>
              {skill.author}
            </button>
            {skill.verified ? <BadgeCheck size={14} className="shrink-0 text-accent" aria-label="Verificada" /> : null}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-mute">{skill.subtitle}</p>
      {large ? <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-mute/90">{skill.description}</p> : null}

      {agents.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Funciona con">
          {agents.map((agent) => (
            <li key={agent.id} className="rounded-[6px] border border-line px-1.5 py-0.5 font-mono text-[11px] text-mute">
              {agent.label}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {skill.ratingsCount === 0 ? (
          <p className="text-[13px] text-mute">Nueva</p>
        ) : (
          <p className="flex items-center gap-1.5 text-[13px] text-mute">
            <Star size={13} className="fill-current text-ink" aria-hidden />
            <span className="text-ink">{skill.rating.toFixed(1)}</span>
            <span>{formatCount(skill.ratingsCount)}</span>
          </p>
        )}
        {quiet ? null : (
          <div className="flex shrink-0 gap-1.5">
            <Button
              size="sm"
              variant={status === 'installed' ? 'secondary' : 'primary'}
              disabled={status === 'busy'}
              onClick={() => (status === 'installed' ? navigate(skillPath(skill.id)) : requestInstall(skill.id))}
            >
              {status === 'installed' ? <Check size={14} aria-hidden /> : null}
              {status === 'busy' ? 'Instalando…' : status === 'installed' ? 'Instalada' : 'Instalar'}
            </Button>
            <Button size="sm" variant="secondary" aria-label={`Copiar comando de ${skill.name}`} onClick={() => copyCommand(skill.id)}>
              <Copy size={14} />
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}
