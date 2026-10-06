import type { Skill } from '../types'
import catalog from './catalog.json'

// Los metadatos viven en catalog.json (lo edita el panel /admin en local).
// El contenido de cada skill vive en catalog/<id>/SKILL.md.
export const skills = catalog as unknown as Skill[]

export { categories } from './categories'

export const agents = ['Cursor', 'Claude', 'ChatGPT', 'Codex', 'Gemini', 'Copilot'] as const
