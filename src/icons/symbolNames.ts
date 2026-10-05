// Lista de símbolos que se pueden elegir como icono de una skill.
// Va aparte de symbols.tsx para que el servidor del panel valide sin cargar React.
export const SYMBOL_NAMES = [
  'sparkles',
  'search',
  'code',
  'terminal',
  'bug',
  'git-branch',
  'database',
  'cpu',
  'rocket',
  'zap',
  'wand',
  'brain',
  'lightbulb',
  'target',
  'compass',
  'palette',
  'pen-tool',
  'image',
  'video',
  'music',
  'file-text',
  'book',
  'clipboard',
  'languages',
  'message',
  'mail',
  'megaphone',
  'chart',
  'dollar',
  'briefcase',
  'scale',
  'shield',
  'lock',
  'users',
  'calendar',
  'globe',
  'layers',
  'flask',
  'wrench',
  'heart',
] as const

export type SymbolName = (typeof SYMBOL_NAMES)[number]

export function isSymbolName(value: unknown): value is SymbolName {
  return typeof value === 'string' && (SYMBOL_NAMES as readonly string[]).includes(value)
}
