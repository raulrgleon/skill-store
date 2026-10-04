import type { Skill } from '../types'
import catalog from './catalog.json'

// Los metadatos viven en catalog.json (lo edita el panel /admin en local).
// El contenido de cada skill vive en catalog/<id>/SKILL.md.
export const skills = catalog as unknown as Skill[]

export const categories = [
  { id: 'Ingeniería', label: 'Ingeniería', color: '#30D158' },
  { id: 'Diseño', label: 'Diseño', color: '#FF375F' },
  { id: 'Marketing', label: 'Marketing', color: '#0A84FF' },
  { id: 'Ventas', label: 'Ventas', color: '#FF9F0A' },
  { id: 'Legal', label: 'Legal', color: '#8E8E93' },
  { id: 'Finanzas', label: 'Finanzas', color: '#30D158' },
  { id: 'Soporte', label: 'Soporte', color: '#64D2FF' },
  { id: 'Productividad', label: 'Productividad', color: '#BF5AF2' },
  { id: 'Documentos', label: 'Documentos', color: '#FF375F' },
  { id: 'Equipos', label: 'Equipos', color: '#5E5CE6' },
]

export const agents = ['Cursor', 'Claude', 'ChatGPT', 'Codex', 'Gemini', 'Copilot'] as const
