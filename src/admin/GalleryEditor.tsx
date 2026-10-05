import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from 'lucide-react'
import { mediaUrl } from '../components/Gallery'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { MAX_GALLERY, prepareImage } from './images'

// Una imagen de la galería en el formulario: ya guardada (file = nombre en /media) o nueva (data).
export type GalleryItem = {
  key: string
  file: string
  caption: string
  w?: number
  h?: number
  preview?: string
  data?: string
}

let counter = 0

export function newKey() {
  counter += 1
  return `n${Date.now().toString(36)}${counter}`
}

export function GalleryEditor({
  skillId,
  items,
  onChange,
}: {
  skillId: string
  items: GalleryItem[]
  onChange: (items: GalleryItem[]) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [over, setOver] = useState(false)

  async function add(files: FileList | File[]) {
    const list = [...files]
    if (list.length === 0) return
    setProblem(null)
    setBusy(true)
    const next = [...items]
    try {
      for (const file of list) {
        if (next.length >= MAX_GALLERY) {
          setProblem(`Máximo ${MAX_GALLERY} imágenes por skill.`)
          break
        }
        try {
          const image = await prepareImage(file)
          const key = newKey()
          next.push({ key, file: `nueva-${key}`, caption: '', w: image.w, h: image.h, preview: image.preview, data: image.data })
        } catch (error) {
          setProblem(error instanceof Error ? error.message : 'No se pudo procesar la imagen.')
        }
      }
      onChange(next)
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  function move(index: number, step: number) {
    const target = index + step
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {items.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <li key={item.key} className="overflow-hidden rounded-[12px] border border-line bg-surface">
              <div className="grid aspect-[16/10] place-items-center bg-surface-2">
                <img
                  src={item.preview ?? mediaUrl(skillId, item.file)}
                  alt={item.caption || `Imagen ${index + 1}`}
                  className="size-full object-contain"
                />
              </div>
              <div className="space-y-2 p-3">
                <Input
                  aria-label={`Pie de la imagen ${index + 1}`}
                  placeholder="Pie de imagen (opcional)"
                  maxLength={140}
                  value={item.caption}
                  onChange={(event) => onChange(items.map((entry) => (entry.key === item.key ? { ...entry, caption: event.target.value } : entry)))}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-mute">
                    {index === 0 ? 'Principal · ' : ''}
                    {item.data ? 'Nueva' : 'Guardada'}
                  </span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" aria-label="Mover antes" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowLeft size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" aria-label="Mover después" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                      <ArrowRight size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" aria-label="Quitar imagen" onClick={() => onChange(items.filter((entry) => entry.key !== item.key))}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setOver(false)
          void add(event.dataTransfer.files)
        }}
        className={`rounded-[12px] border border-dashed px-4 py-6 text-center ${over ? 'border-accent bg-surface-2' : 'border-line'}`}
      >
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="sr-only"
          aria-label="Subir imágenes"
          onChange={(event) => event.target.files && void add(event.target.files)}
        />
        <Button variant="secondary" size="sm" disabled={busy || items.length >= MAX_GALLERY} onClick={() => input.current?.click()}>
          <ImagePlus size={14} aria-hidden /> {busy ? 'Procesando…' : 'Subir imágenes'}
        </Button>
        <p className="mt-2 text-[12px] text-mute">
          o arrástralas aquí · PNG, JPG, WebP o GIF · hasta {MAX_GALLERY} · se reducen solas a 1600 px
        </p>
      </div>
      {problem ? (
        <p role="alert" className="text-[13px] text-danger">
          {problem}
        </p>
      ) : null}
    </div>
  )
}
