import type { Skill } from '../types'
import { SkillCard } from './SkillCard'

type SkillRowProps = {
  title: string
  subtitle?: string
  skills: Skill[]
  statusOf: (id: string) => 'idle' | 'busy' | 'installed'
  onOpen: (id: string) => void
  onGet: (id: string) => void
  onSeeAll?: () => void
}

export function SkillRow({ title, subtitle, skills, statusOf, onOpen, onGet, onSeeAll }: SkillRowProps) {
  if (skills.length === 0) return null

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between px-5">
        <div>
          <h3 className="text-[22px] font-bold tracking-[-0.6px]">{title}</h3>
          {subtitle ? <p className="text-[13px] text-mute">{subtitle}</p> : null}
        </div>
        {onSeeAll ? (
          <button type="button" onClick={onSeeAll} className="text-[15px] font-semibold text-blue">
            Ver todo
          </button>
        ) : null}
      </div>
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-5 pb-1">
        {skills.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            status={statusOf(skill.id)}
            onOpen={() => onOpen(skill.id)}
            onGet={() => onGet(skill.id)}
          />
        ))}
      </div>
    </section>
  )
}
