import type { Skill } from '../types'
import { formatCount } from '../lib/format'
import { GetButton } from './GetButton'
import { SkillIcon } from './SkillIcon'

type SkillCardProps = {
  skill: Skill
  status: 'idle' | 'busy' | 'installed'
  onOpen: () => void
  onGet: () => void
}

export function SkillCard({ skill, status, onOpen, onGet }: SkillCardProps) {
  return (
    <article className="flex w-[168px] shrink-0 flex-col">
      <button type="button" onClick={onOpen} className="group text-left">
        <span className="block transition duration-300 group-hover:scale-[1.03]">
          <SkillIcon skill={skill} size={168} />
        </span>
        <p className="mt-2.5 truncate text-[13px] font-semibold tracking-[-0.2px]">{skill.name}</p>
        <p className="truncate text-[12px] text-mute">{skill.category}</p>
      </button>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-mute">{skill.rating.toFixed(1)} · {formatCount(skill.ratingsCount)}</p>
        <GetButton
          price={skill.price}
          status={status}
          onClick={(event) => {
            event.stopPropagation()
            onGet()
          }}
        />
      </div>
    </article>
  )
}
