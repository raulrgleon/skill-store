import { useMemo, useState } from 'react'
import { SkillListItem } from '../components/SkillListItem'
import { agents, categories, skills } from '../data/skills'

type ExplorePageProps = {
  query: string
  statusOf: (id: string) => 'idle' | 'busy' | 'installed'
  onOpen: (id: string) => void
  onGet: (id: string) => void
}

export function ExplorePage({ query, statusOf, onOpen, onGet }: ExplorePageProps) {
  const [category, setCategory] = useState('Todas')
  const [agent, setAgent] = useState('Todas')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return skills.filter((skill) => {
      if (skill.private) return false
      if (category !== 'Todas' && skill.category !== category) return false
      if (agent !== 'Todas' && skill.compatibility[agent as keyof typeof skill.compatibility] !== 'full') return false
      if (!needle) return true
      return [skill.name, skill.subtitle, skill.category, skill.author, ...skill.agents]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [agent, category, query])

  return (
    <div className="mx-auto max-w-[880px] px-5 pt-8 pb-12">
      <h1 className="display text-[40px]">Explorar</h1>
      <p className="mt-2 max-w-[42ch] text-[16px] leading-relaxed text-mute">
        Filtra por oficio o por el agente donde la vas a usar.
      </p>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        {['Todas', ...categories.filter((item) => item.id !== 'Equipos').map((item) => item.id)].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`border px-3 py-1.5 text-[14px] whitespace-nowrap ${
              category === item ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
        {['Todas', ...agents].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setAgent(item)}
            className={`border px-3 py-1.5 text-[14px] whitespace-nowrap ${
              agent === item ? 'border-blue bg-blue text-white' : 'border-line bg-card text-ink'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-[15px] text-mute">
            No hay skills para esa combinación. Prueba otra IA u oficio.
          </p>
        ) : (
          filtered.map((skill, index) => (
            <SkillListItem
              key={skill.id}
              skill={skill}
              status={statusOf(skill.id)}
              last={index === filtered.length - 1}
              onOpen={() => onOpen(skill.id)}
              onGet={() => onGet(skill.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
