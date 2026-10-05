import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { GalleryImage } from '../types'

export function mediaUrl(id: string, file: string) {
  return `/media/${encodeURIComponent(id)}/${file}`
}

function Viewer({ id, items, start, onClose }: { id: string; items: GalleryImage[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start)
  const last = items.length - 1
  const go = useCallback((step: number) => setIndex((current) => Math.min(last, Math.max(0, current + step))), [last])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft') go(-1)
      else if (event.key === 'ArrowRight') go(1)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [go, onClose])

  const item = items[index]

  return (
    <div role="dialog" aria-modal="true" aria-label="Imágenes de la skill" className="fixed inset-0 z-50 flex flex-col bg-black/85 p-4 sm:p-8">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 cursor-zoom-out" onClick={onClose} />
      <div className="relative z-10 flex justify-end">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Cerrar visor"
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X size={18} />
        </button>
      </div>

      <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Anterior"
          disabled={index === 0}
          onClick={() => go(-1)}
          className="pointer-events-auto hidden rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-30 sm:block"
        >
          <ChevronLeft size={20} />
        </button>
        <img
          key={item.file}
          src={mediaUrl(id, item.file)}
          alt={item.caption || `Imagen ${index + 1} de ${items.length}`}
          className="pointer-events-auto max-h-full max-w-full rounded-[10px] object-contain shadow-2xl"
        />
        <button
          type="button"
          aria-label="Siguiente"
          disabled={index === last}
          onClick={() => go(1)}
          className="pointer-events-auto hidden rounded-full bg-white/10 p-2 text-white hover:bg-white/20 disabled:opacity-30 sm:block"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-center gap-4 text-[14px] text-white">
        <button type="button" aria-label="Anterior" disabled={index === 0} onClick={() => go(-1)} className="p-1 disabled:opacity-30 sm:hidden">
          <ChevronLeft size={20} />
        </button>
        <p className="max-w-[60ch] text-center">
          {item.caption ? <span>{item.caption} · </span> : null}
          <span className="text-white/60">
            {index + 1} / {items.length}
          </span>
        </p>
        <button type="button" aria-label="Siguiente" disabled={index === last} onClick={() => go(1)} className="p-1 disabled:opacity-30 sm:hidden">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

export function Gallery({ id, items }: { id: string; items: GalleryImage[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const close = useCallback(() => setOpen(null), [])

  return (
    <section aria-label="Imágenes de la skill" className="mt-8">
      <ul className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:thin]">
        {items.map((item, index) => (
          <li key={item.file} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={`Ver imagen ${index + 1}${item.caption ? `: ${item.caption}` : ''}`}
              className="block cursor-zoom-in overflow-hidden rounded-[12px] border border-line bg-surface-2"
            >
              <img
                src={mediaUrl(id, item.file)}
                alt={item.caption}
                width={item.w}
                height={item.h}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                style={{ aspectRatio: item.w && item.h ? `${item.w} / ${item.h}` : '16 / 10' }}
                className="block h-[220px] w-auto max-w-[78vw] object-cover transition-transform duration-300 hover:scale-[1.02] sm:h-[260px]"
              />
            </button>
            {item.caption ? <p className="mt-2 max-w-[360px] text-[13px] leading-snug text-mute">{item.caption}</p> : null}
          </li>
        ))}
      </ul>
      {open !== null ? <Viewer id={id} items={items} start={open} onClose={close} /> : null}
    </section>
  )
}
