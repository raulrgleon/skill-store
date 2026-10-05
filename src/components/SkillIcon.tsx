import { useId } from 'react'
import { artwork, shine } from '../icons/artwork'
import { symbolIcons } from '../icons/symbols'
import { isSymbolName } from '../icons/symbolNames'
import type { Skill } from '../types'

type SkillIconProps = {
  skill: Skill
  size?: number
}

export function SkillIcon({ skill, size = 62 }: SkillIconProps) {
  const uid = useId().replace(/:/g, '')
  const radius = Math.round(size * 0.2237)
  const Symbol = isSymbolName(skill.icon.symbol) ? symbolIcons[skill.icon.symbol] : null
  // Un símbolo elegido en el panel manda sobre el dibujo a medida de la skill.
  const paint = Symbol ? null : artwork[skill.id]
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
        {paint ? paint({ id: uid }) : shine(uid)}
        {!paint && !Symbol ? <circle cx="50" cy="50" r="18" fill="#fff" opacity="0.9" /> : null}
      </svg>
      {Symbol ? (
        <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]">
          <Symbol size={Math.round(size * 0.5)} strokeWidth={2} aria-hidden />
        </span>
      ) : null}
    </div>
  )
}
