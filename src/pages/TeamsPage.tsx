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
    <div className="mx-auto max-w-[720px] px-5 pt-6 pb-10">
      <h1 className="text-[34px] font-bold tracking-tight">Equipos</h1>
      <p className="mt-1 text-[15px] text-mute">
        El conocimiento que solo ustedes tienen. No aparece en la tienda pública.
      </p>

      <div className="mt-6 rounded-[22px] bg-gradient-to-br from-[#2c2c2e] to-[#111] p-5">
        <p className="text-[12px] font-bold uppercase text-mute" style={{ letterSpacing: '1.2px' }}>
          Catálogo privado
        </p>
        <h2 className="mt-1 text-[24px] font-bold tracking-tight">Estudio Norte + Nimbus</h2>
        <p className="mt-2 max-w-[42ch] text-[14px] text-white/70">
          Dos skills internas. El tono de la agencia y el playbook de PRs. Invisible para el resto del mundo.
        </p>
      </div>

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
