import { useId } from 'react'
import { artwork, fallbackArt } from '../icons/artwork'
import type { Skill } from '../types'

type SkillIconProps = {
  skill: Skill
  size?: number
}

export function SkillIcon({ skill, size = 62 }: SkillIconProps) {
  const uid = useId().replace(/:/g, '')
  const radius = Math.round(size * 0.2237)
  const paint = artwork[skill.id] ?? fallbackArt
  const from = skill.icon.from
  const to = skill.icon.to

  return (
    <div
      className="relative shrink-0 overflow-hidden ring-1 ring-ink/10"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
      }}
    >
      <svg viewBox="0 0 100 100" className="block size-full" aria-hidden>
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill={`url(#${uid}-bg)`} />
        {paint({ id: uid })}
      </svg>
    </div>
  )
}
