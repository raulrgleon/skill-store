import type { Skill } from '../types'
import { SkillListItem } from './SkillListItem'

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
    <section className="mt-10">
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <div>
          <h2 className="display text-[26px]">{title}</h2>
          {subtitle ? <p className="mt-1 max-w-[48ch] text-[15px] leading-snug text-mute">{subtitle}</p> : null}
        </div>
        {onSeeAll ? (
          <button type="button" onClick={onSeeAll} className="shrink-0 text-[15px] text-blue">
            Ver todas
          </button>
        ) : null}
      </div>
      <div>
        {skills.map((skill, index) => (
          <SkillListItem
            key={skill.id}
            skill={skill}
            status={statusOf(skill.id)}
            last={index === skills.length - 1}
            onOpen={() => onOpen(skill.id)}
            onGet={() => onGet(skill.id)}
          />
        ))}
      </div>
    </section>
  )
}
