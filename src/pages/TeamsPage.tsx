import { SkillListItem } from '../components/SkillListItem'
import { skills } from '../data/skills'

type TeamsPageProps = {
  statusOf: (id: string) => 'idle' | 'busy' | 'installed'
  onOpen: (id: string) => void
  onGet: (id: string) => void
}

export function TeamsPage({ statusOf, onOpen, onGet }: TeamsPageProps) {
  const privateSkills = skills.filter((skill) => skill.private)

  return (
    <div className="mx-auto max-w-[880px] px-5 pt-8 pb-12">
      <h1 className="display text-[40px]">Equipos</h1>
      <p className="mt-2 max-w-[46ch] text-[16px] leading-relaxed text-mute">
        Lo que solo usa tu equipo. Estas skills no aparecen en la tienda pública.
      </p>

      <div className="mt-6">
        {privateSkills.map((skill, index) => (
          <SkillListItem
            key={skill.id}
            skill={skill}
            status={statusOf(skill.id)}
            last={index === privateSkills.length - 1}
            onOpen={() => onOpen(skill.id)}
            onGet={() => onGet(skill.id)}
          />
        ))}
      </div>
    </div>
  )
}
