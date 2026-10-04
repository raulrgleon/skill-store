export function formatCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')} M`
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')} mil`
  return String(value)
}

export function starRow(rating: number) {
  const filled = Math.round(rating)
  return Array.from({ length: 5 }, (_, i) => i < filled)
}

export function todayLabel() {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
