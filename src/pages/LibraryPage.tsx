import { SkillIcon } from '../components/SkillIcon'
import { skills } from '../data/skills'
import { skillPath } from '../lib/catalog'
import { TARGET_LABEL } from '../lib/api'
import { useRouter } from '../lib/router'
import { useStore } from '../store'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'

export function LibraryPage() {
  const { ready, installed, homes, removeSkill, statusOf } = useStore()
  const { navigate } = useRouter()
  const owned = skills.filter((skill) => installed[skill.id]?.length)

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10">
      <h1 className="text-[40px] font-medium tracking-tight">Biblioteca</h1>
      <p className="mt-2 max-w-[46ch] text-[16px] leading-relaxed text-mute">Skills que ya están en tus agentes.</p>

      {!ready ? (
        <div className="mt-8 grid gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : owned.length === 0 ? (
        <div className="mt-10 max-w-md">
          <h2 className="text-[20px] font-medium tracking-tight">Todavía no instalas ninguna</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-mute">Cuando instales una skill desde el catálogo, aparecerá aquí.</p>
          <Button className="mt-4" onClick={() => navigate('/explorar')}>
            Explorar skills
          </Button>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {owned.map((skill) => (
            <li key={skill.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
              <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => navigate(skillPath(skill.id))}>
                <SkillIcon skill={skill} size={44} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium">{skill.name}</span>
                  <span className="block truncate font-mono text-[12px] text-mute">
                    {(installed[skill.id] ?? []).map((target) => `${TARGET_LABEL[target]} ${homes[target]}`).join(', ')}
                  </span>
                </span>
              </button>
              <Button variant="secondary" size="sm" disabled={statusOf(skill.id) === 'busy'} onClick={() => removeSkill(skill.id)}>
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
