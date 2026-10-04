import type { Agent, Skill } from '../types'
import type { InstallTarget } from '../lib/api'
import { formatCount, starRow } from '../lib/format'
import { formatTargets } from '../lib/targets'
import { GetButton } from './GetButton'
import { SkillIcon } from './SkillIcon'

const compatibilityLabel = {
  full: 'Funciona',
  partial: 'Parcial',
  none: 'No aplica',
} as const

const compatibilityClass = {
  full: 'bg-[#30d158]/15 text-[#30d158]',
  partial: 'bg-[#ff9f0a]/15 text-[#ff9f0a]',
  none: 'bg-card-2 text-mute',
} as const

const agents: Agent[] = ['Cursor', 'Claude', 'ChatGPT', 'Codex', 'Gemini', 'Copilot']

type SkillDetailProps = {
  skill: Skill
  status: 'idle' | 'busy' | 'installed'
  installedOn?: InstallTarget[]
  onClose: () => void
  onGet: () => void
  onRemove: () => void
}

export function SkillDetail({ skill, status, installedOn, onClose, onGet, onRemove }: SkillDetailProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper px-4 py-3">
        <button type="button" onClick={onClose} className="text-[16px] text-blue">
          Volver a la tienda
        </button>
        <GetButton price={skill.price} status={status} onClick={onGet} />
      </div>

      <div className="mx-auto max-w-[720px] px-5 pt-8 pb-24">
        <div className="flex items-start gap-4">
          <SkillIcon skill={skill} size={112} />
          <div className="min-w-0 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="display text-[36px] leading-none">{skill.name}</h1>
              {skill.verified ? (
                <span className="rounded-full bg-[#30d158]/15 px-2 py-0.5 text-[11px] font-bold text-[#30d158]">
                  Verificada
                </span>
              ) : null}
              {skill.private ? (
                <span className="border border-line px-2 py-0.5 text-[12px] text-mute">
                  Privada
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[15px] text-blue">{skill.author}</p>
            <p className="mt-1 text-[14px] text-mute">{skill.subtitle}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-4 gap-2 border-y border-line py-4 text-center">
          <div>
            <dt className="text-[11px] text-mute">{formatCount(skill.ratingsCount)} valoraciones</dt>
            <dd className="mt-1 text-[20px] font-bold tracking-tight">{skill.rating.toFixed(1)}</dd>
            <p className="stars text-[10px]">
              {starRow(skill.rating).map((on, i) => (
                <span key={i} className={on ? 'on' : ''}>
                  ★
                </span>
              ))}
            </p>
          </div>
          <div>
            <dt className="text-[11px] text-mute">Edad</dt>
            <dd className="mt-1 text-[20px] font-bold tracking-tight">{skill.age}</dd>
            <p className="text-[11px] text-dim">Años</p>
          </div>
          <div>
            <dt className="text-[11px] text-mute">Categoría</dt>
            <dd className="mt-1 text-[15px] leading-[28px] font-bold">{skill.category}</dd>
            <p className="text-[11px] text-dim">Oficio</p>
          </div>
          <div>
            <dt className="text-[11px] text-mute">Tamaño</dt>
            <dd className="mt-1 text-[15px] leading-[28px] font-bold">{skill.size}</dd>
            <p className="text-[11px] text-dim">v{skill.version}</p>
          </div>
        </dl>

        <section className="mt-6">
          <h2 className="display text-[26px]">Compatibilidad</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {agents.map((agent) => {
              const level = skill.compatibility[agent] ?? 'none'
              return (
                <span
                  key={agent}
                  className={`border border-line px-2.5 py-1 text-[13px] ${compatibilityClass[level]}`}
                >
                  {agent}, {compatibilityLabel[level]}
                </span>
              )
            })}
          </div>
        </section>

        <section className="mt-7">
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {skill.screenshots.map((shot) => (
              <div
                key={shot.title}
                className="h-[220px] w-[168px] shrink-0 rounded-[18px] p-4"
                style={{ background: `linear-gradient(160deg, ${shot.from}, ${shot.to})` }}
              >
                <p className="text-[13px] font-bold">{shot.title}</p>
                <p className="mt-2 text-[13px] leading-snug text-white/85">{shot.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="display text-[26px]">Descripción</h2>
          <p className="mt-2 max-w-[62ch] text-[16px] leading-relaxed">{skill.description}</p>
        </section>

        <section className="mt-8">
          <h2 className="display text-[26px]">Novedades</h2>
          <p className="mt-1 text-[14px] text-mute">Versión {skill.version}</p>
          <p className="mt-2 max-w-[62ch] text-[16px] leading-relaxed">{skill.whatsNew}</p>
        </section>

        <section className="mt-8">
          <h2 className="display text-[26px]">Valoraciones</h2>
          <div className="mt-3 space-y-4">
            {skill.reviews.map((review) => (
              <article key={review.user} className="border-b border-line pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-semibold">{review.user}</p>
                  <p className="text-[12px] text-mute">{review.date}</p>
                </div>
                <p className="stars mt-1 text-[11px]">
                  {starRow(review.rating).map((on, i) => (
                    <span key={i} className={on ? 'on' : ''}>
                      ★
                    </span>
                  ))}
                </p>
                <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed">{review.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="display text-[26px]">Información</h2>
          <dl className="mt-3 divide-y divide-line text-[15px]">
            <div className="flex justify-between py-3">
              <dt className="text-mute">Proveedor</dt>
              <dd>{skill.author}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-mute">Categoría</dt>
              <dd>{skill.category}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-mute">Compatibilidad</dt>
              <dd>{skill.agents.join(', ')}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-mute">Precio</dt>
              <dd>{skill.price}</dd>
            </div>
            {installedOn?.length ? (
              <div className="flex justify-between py-3">
                <dt className="text-mute">Instalada en</dt>
                <dd>{formatTargets(installedOn)}</dd>
              </div>
            ) : null}
          </dl>
          {installedOn?.length ? (
            <button
              type="button"
              onClick={onRemove}
              className="mt-4 text-[14px] font-semibold text-[#ff453a]"
            >
              Quitar de los agentes
            </button>
          ) : null}
        </section>
      </div>
    </div>
  )
}
