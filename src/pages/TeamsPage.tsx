import { SkillCard } from '../components/SkillCard'
import { skills } from '../data/skills'

export function TeamsPage() {
  const privateSkills = skills.filter((skill) => skill.private)

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <h1 className="text-[40px] font-medium tracking-tight">Equipos</h1>
      <p className="mt-2 max-w-[48ch] text-[16px] leading-relaxed text-mute">
        Skills que solo usa tu equipo. No aparecen en la búsqueda pública.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {privateSkills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  )
}
