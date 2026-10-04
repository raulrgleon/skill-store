import { SkillListItem } from '../components/SkillListItem'
import { skills } from '../data/skills'
import type { InstalledMap } from '../lib/api'
import { formatTargets } from '../lib/targets'

type LibraryPageProps = {
  installed: string[]
  locations: InstalledMap
  statusOf: (id: string) => 'idle' | 'busy' | 'installed'
  onOpen: (id: string) => void
  onGet: (id: string) => void
  onExplore: () => void
}

export function LibraryPage({ installed, locations, statusOf, onOpen, onGet, onExplore }: LibraryPageProps) {
  const owned = skills.filter((skill) => installed.includes(skill.id))

  return (
    <div className="mx-auto max-w-[720px] px-5 pt-6 pb-10">
      <h1 className="text-[34px] font-bold tracking-[-1.2px]">Biblioteca</h1>
      <p className="mt-1 text-[15px] text-mute">Las skills que ya están en tus agentes.</p>

      {owned.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-[17px] font-semibold">Aún no has obtenido ninguna skill</p>
          <p className="mx-auto mt-2 max-w-[36ch] text-[14px] text-mute">
            Explora la tienda, pulsa Obtener y elige Cursor, Claude o Codex. La skill se copia a tu máquina.
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="mt-5 rounded-full bg-blue px-5 py-2 text-[14px] font-bold text-white"
          >
            Explorar tienda
          </button>
        </div>
      ) : (
        <div className="mt-6">
          {owned.map((skill, index) => (
            <SkillListItem
              key={skill.id}
              skill={skill}
              status={statusOf(skill.id)}
              extra={formatTargets(locations[skill.id])}
              last={index === owned.length - 1}
              onOpen={() => onOpen(skill.id)}
              onGet={() => onGet(skill.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
