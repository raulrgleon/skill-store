const files = import.meta.glob('../../catalog/*/SKILL.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>

const byId = new Map<string, () => Promise<string>>()

for (const [path, load] of Object.entries(files)) {
  const id = path.split('/').at(-2)
  if (id) byId.set(id, load)
}

export type SkillDoc = {
  meta: Record<string, string>
  body: string
}

function parse(raw: string): SkillDoc {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { meta: {}, body: raw.trim() }

  const meta: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([\w-]+):\s*(.*)$/)
    if (pair) meta[pair[1]] = pair[2].replace(/^["']|["']$/g, '')
  }
  return { meta, body: raw.slice(match[0].length).trim() }
}

export function hasSkillDoc(id: string) {
  return byId.has(id)
}

export async function loadSkillDoc(id: string): Promise<SkillDoc | null> {
  const load = byId.get(id)
  if (!load) return null
  return parse(await load())
}
