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
    <div className="mx-auto max-w-[720px] px-5 pt-6 pb-10">
      <h1 className="text-[34px] font-bold tracking-[-1.2px]">Explorar</h1>
      <p className="mt-1 text-[15px] text-mute">Busca por oficio o por la IA que usas.</p>

      <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        {['Todas', ...categories.filter((item) => item.id !== 'Equipos').map((item) => item.id)].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap ${
              category === item ? 'bg-white text-black' : 'bg-white/8 text-white'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {['Todas', ...agents].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setAgent(item)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap ${
              agent === item ? 'bg-blue text-white' : 'bg-white/8 text-white'
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
