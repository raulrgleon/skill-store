import type { Skill } from '../types'
import { formatCount } from '../lib/format'
import { GetButton } from './GetButton'
import { SkillIcon } from './SkillIcon'

type SkillListItemProps = {
  skill: Skill
  status: 'idle' | 'busy' | 'installed'
  extra?: string
  last?: boolean
  onOpen: () => void
  onGet: () => void
}

export function SkillListItem({ skill, status, extra, last, onOpen, onGet }: SkillListItemProps) {
  return (
    <div className={`flex items-center gap-4 py-3.5 ${last ? '' : 'border-b border-line'}`}>
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-4 text-left">
        <SkillIcon skill={skill} size={56} />
        <div className="min-w-0">
          <p className="display truncate text-[20px] leading-tight">{skill.name}</p>
          <p className="mt-0.5 truncate text-[14px] text-mute">{skill.subtitle}</p>
          <p className="mt-0.5 text-[13px] text-dim">
            {extra ? extra : `${skill.author}, ${skill.category}, ${formatCount(skill.ratingsCount)} valoraciones`}
          </p>
        </div>
      </button>
      <GetButton
        price={skill.price}
        status={status}
        onClick={(event) => {
          event.stopPropagation()
          onGet()
        }}
      />
    </div>
  )
}
