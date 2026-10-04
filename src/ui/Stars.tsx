import { Star } from 'lucide-react'

export function Stars({ value }: { value: number }) {
  const filled = Math.round(value)
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={14}
          aria-hidden
          className={index < filled ? 'fill-ink text-ink' : 'text-line'}
        />
      ))}
    </span>
  )
}
