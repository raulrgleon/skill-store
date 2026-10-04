import { StoryCard } from '../components/StoryCard'
import { SkillRow } from '../components/SkillRow'
import { skills } from '../data/skills'
import { todayLabel } from '../lib/format'

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
  const featured = official.slice(0, 8)
  const forCursor = publicSkills.filter((skill) => skill.compatibility.Cursor === 'full').slice(0, 10)
  const verified = publicSkills.filter(
    (skill) => skill.verified && skill.author !== 'Anthropic' && skill.author !== 'Vercel',
  )
  const work = publicSkills.filter((skill) => ['Marketing', 'Ventas', 'Legal', 'Finanzas'].includes(skill.category))

  return (
    <div className="mx-auto max-w-[1080px] pb-10">
      <div className="px-5 pt-6">
        <p className="text-[13px] font-semibold tracking-[0.6px] text-mute uppercase">
          {todayLabel()}
        </p>
        <h1 className="text-[34px] font-bold tracking-[-1.2px]">Hoy</h1>
      </div>

      <div className="mt-4 grid gap-5 px-5 lg:grid-cols-2">
        {stories.map((skill, index) => (
          <StoryCard
            key={skill.id}
            skill={skill}
            large={index === 0}
            onOpen={() => onOpen(skill.id)}
          />
        ))}
      </div>

      <SkillRow
        title="Oficiales"
        subtitle="Extraídas de Anthropic, Vercel y skills.sh"
        skills={featured}
        statusOf={statusOf}
        onOpen={onOpen}
        onGet={onGet}
        onSeeAll={onExplore}
      />
      <SkillRow
        title="Listas para Cursor"
        subtitle="Instalación en un toque"
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
