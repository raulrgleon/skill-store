export type Agent = 'Cursor' | 'Claude' | 'ChatGPT' | 'Codex' | 'Gemini' | 'Copilot'

export type Compatibility = 'full' | 'partial' | 'none'

export type StoreTab = 'hoy' | 'explorar' | 'equipos' | 'biblioteca'

export type GalleryImage = { file: string; caption: string; w?: number; h?: number }

// De dónde se importó una skill de terceros (skills.sh + repositorio de GitHub).
export type SkillSource = {
  repo: string
  skill: string
  url: string
  installs?: number
  license?: string
  importedAt?: string
}

export type Skill = {
  id: string
  name: string
  subtitle: string
  author: string
  category: string
  rating: number
  ratingsCount: number
  price: string
  verified: boolean
  private?: boolean
  agents: Agent[]
  compatibility: Partial<Record<Agent, Compatibility>>
  description: string
  whatsNew: string
  version: string
  size: string
  age: string
  icon: { from: string; to: string; glyph: string; symbol?: string }
  story?: {
    image: string
    kicker: string
    title: string
    subtitle: string
  }
  screenshots: { title: string; body: string; from: string; to: string }[]
  // Imágenes reales: se sirven desde /media/<id>/<file>.
  gallery?: GalleryImage[]
  source?: SkillSource
  reviews: { user: string; rating: number; text: string; date: string }[]
}
