import type { Skill } from '../types'
import { SkillIcon } from './SkillIcon'

type StoryCardProps = {
  skill: Skill
  large?: boolean
  onOpen: () => void
}

export function StoryCard({ skill, large, onOpen }: StoryCardProps) {
  const story = skill.story
  if (!story) return null

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative block w-full overflow-hidden rounded-[22px] text-left ${
        large ? 'min-h-[420px] sm:min-h-[520px]' : 'min-h-[340px]'
      }`}
    >
      <img
        src={story.image}
        alt=""
        className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.04]"
      />
      <div className="story-scrim absolute inset-0" />
      <div className="relative flex h-full min-h-[340px] flex-col justify-between p-6 sm:p-8">
        <p className="text-[12px] font-bold uppercase text-white/80" style={{ letterSpacing: '1.4px' }}>
          {story.kicker}
        </p>
        <div>
          <h2 className="max-w-[16ch] text-[34px] leading-[1.05] font-bold tracking-tight sm:text-[44px]">
            {story.title}
          </h2>
          <p className="mt-2 max-w-[34ch] text-[16px] text-white/78">{story.subtitle}</p>
          <div className="mt-5 flex items-center gap-3">
            <SkillIcon skill={skill} size={44} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">{skill.name}</p>
              <p className="truncate text-[12px] text-white/60">{skill.subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
