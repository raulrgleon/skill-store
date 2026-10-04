import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function Dialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = panel.current
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function items() {
      if (!root) return []
      return [...root.querySelectorAll<HTMLElement>(focusable)].filter((el) => !el.hasAttribute('disabled'))
    }

    items()[0]?.focus()

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const list = items()
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Cerrar" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative max-h-[92svh] w-full overflow-y-auto border border-line bg-surface p-5 shadow-soft sm:rounded-[14px] ${wide ? 'sm:max-w-3xl' : 'sm:max-w-md'}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-[18px] font-medium tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar diálogo" className="rounded-[8px] p-1 text-mute hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
