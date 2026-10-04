export type Agent = 'Cursor' | 'Claude' | 'ChatGPT' | 'Codex' | 'Gemini' | 'Copilot'

export type Compatibility = 'full' | 'partial' | 'none'

export type StoreTab = 'hoy' | 'explorar' | 'equipos' | 'biblioteca'

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
  icon: { from: string; to: string; glyph: string }
  story?: {
    image: string
    kicker: string
    title: string
    subtitle: string
  }
  screenshots: { title: string; body: string; from: string; to: string }[]
  reviews: { user: string; rating: number; text: string; date: string }[]
}
