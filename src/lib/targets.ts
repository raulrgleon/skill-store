import type { Skill } from '../types'
import type { InstallTarget } from './api'
import { TARGET_LABEL } from './api'

export const FOLDER_TARGETS: InstallTarget[] = ['cursor', 'claude', 'codex']

export function installableTargets(skill: Skill) {
  return FOLDER_TARGETS.map((id) => {
    const agent = TARGET_LABEL[id] as keyof Skill['compatibility']
    const level = skill.compatibility[agent] ?? 'none'
    return { id, label: TARGET_LABEL[id], level }
  }).filter((item) => item.level !== 'none')
}

export function defaultTargets(skill: Skill) {
  const options = installableTargets(skill)
  const full = options.filter((item) => item.level === 'full').map((item) => item.id)
  return full.length > 0 ? full : options.map((item) => item.id)
}

export function formatTargets(targets: InstallTarget[] | undefined) {
  if (!targets || targets.length === 0) return ''
  return targets.map((target) => TARGET_LABEL[target]).join(', ')
}
