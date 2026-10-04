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
    <div className={`flex items-center gap-3 py-3 ${last ? '' : 'border-b border-white/6'}`}>
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <SkillIcon skill={skill} size={62} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-semibold tracking-[-0.2px]">{skill.name}</p>
            {skill.verified ? (
              <span className="text-[11px] text-[#30d158]" title="Verificada">
                ✓
              </span>
            ) : null}
          </div>
          <p className="truncate text-[12px] text-mute">{skill.subtitle}</p>
          <p className="mt-0.5 text-[11px] text-dim">
            {extra
              ? extra
              : `${skill.category} · ${skill.rating.toFixed(1)} · ${formatCount(skill.ratingsCount)} valoraciones`}
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
