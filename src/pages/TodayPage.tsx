import { GetButton } from '../components/GetButton'
import { SkillIcon } from '../components/SkillIcon'
import { SkillRow } from '../components/SkillRow'
import { skills } from '../data/skills'

type TodayPageProps = {
  statusOf: (id: string) => 'idle' | 'busy' | 'installed'
  onOpen: (id: string) => void
  onGet: (id: string) => void
  onExplore: () => void
}

export function TodayPage({ statusOf, onOpen, onGet, onExplore }: TodayPageProps) {
  const stories = skills.filter((skill) => skill.story)
  const publicSkills = skills.filter((skill) => !skill.private)
  const official = publicSkills.filter((skill) => skill.author === 'Anthropic' || skill.author === 'Vercel')
  const lead = stories[0] ?? official[0]
  const featured = official.filter((skill) => skill.id !== lead?.id).slice(0, 8)
  const forCursor = publicSkills.filter((skill) => skill.compatibility.Cursor === 'full').slice(0, 10)
  const verified = publicSkills.filter(
    (skill) => skill.verified && skill.author !== 'Anthropic' && skill.author !== 'Vercel',
  )
  const work = publicSkills.filter((skill) => ['Marketing', 'Ventas', 'Legal', 'Finanzas'].includes(skill.category))

  return (
    <div className="mx-auto max-w-[880px] px-5 pt-8 pb-12">
      {lead ? (
        <section className="grid items-center gap-6 border-b border-line pb-8 sm:grid-cols-[168px_1fr]">
          <button type="button" onClick={() => onOpen(lead.id)} className="justify-self-start">
            <SkillIcon skill={lead} size={168} />
          </button>
          <div className="max-w-[46ch]">
            <h1 className="display text-[40px] leading-[1.05] sm:text-[48px]">{lead.name}</h1>
            <p className="mt-3 text-[17px] leading-relaxed text-mute">{lead.subtitle}</p>
            <div className="mt-5">
              <GetButton price={lead.price} status={statusOf(lead.id)} onClick={() => onGet(lead.id)} />
            </div>
          </div>
        </section>
      ) : null}

      <SkillRow
        title="Oficiales"
        subtitle="Escritas por Anthropic y por Vercel."
        skills={featured}
        statusOf={statusOf}
        onOpen={onOpen}
        onGet={onGet}
        onSeeAll={onExplore}
      />
      <SkillRow
        title="Listas para Cursor"
        subtitle="Cursor las carga desde tu carpeta de skills."
        skills={forCursor}
        statusOf={statusOf}
        onOpen={onOpen}
        onGet={onGet}
        onSeeAll={onExplore}
      />
      <SkillRow
        title="De la casa"
        subtitle="Skills propias de Skill Store"
        skills={verified}
        statusOf={statusOf}
        onOpen={onOpen}
        onGet={onGet}
      />
      <SkillRow
        title="Para el negocio"
        subtitle="Marketing, ventas, legal y finanzas"
        skills={work}
        statusOf={statusOf}
        onOpen={onOpen}
        onGet={onGet}
      />
    </div>
  )
}
