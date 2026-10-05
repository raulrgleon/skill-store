// Prepara una imagen para subirla: la reduce y comprime en el navegador para que el repositorio
// no crezca con capturas de varios MB. Los GIF (animaciones) pasan tal cual si caben.

export const MAX_IMAGE_BYTES = 2_500_000
export const MAX_GALLERY = 8
const MAX_SIDE = 1600
const MAX_INPUT_BYTES = 25_000_000

export type PreparedImage = {
  data: string // base64 sin prefijo
  preview: string // blob: URL para mostrarla antes de guardar
  w: number
  h: number
}

function toBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.readAsDataURL(blob)
  })
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) throw new Error(`"${file.name}" no es PNG, JPG, WebP ni GIF.`)
  if (file.size > MAX_INPUT_BYTES) throw new Error(`"${file.name}" pesa demasiado (máximo 25 MB).`)

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) throw new Error(`No se pudo abrir "${file.name}".`)

  try {
    if (file.type === 'image/gif') {
      if (file.size > MAX_IMAGE_BYTES) throw new Error(`El GIF "${file.name}" pesa más de 2,5 MB. Reduce su duración o tamaño.`)
      return { data: await toBase64(file), preview: URL.createObjectURL(file), w: bitmap.width, h: bitmap.height }
    }

    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, w, h)

    // WebP si el navegador lo sabe codificar; si no, el navegador devuelve PNG y probamos JPG.
    let blob = await canvasBlob(canvas, 'image/webp', 0.86)
    if (!blob || blob.type !== 'image/webp') blob = await canvasBlob(canvas, 'image/jpeg', 0.86)
    for (let quality = 0.7; blob && blob.size > MAX_IMAGE_BYTES && quality > 0.3; quality -= 0.15) {
      blob = await canvasBlob(canvas, blob.type, quality)
    }
    if (!blob || blob.size > MAX_IMAGE_BYTES) throw new Error(`"${file.name}" sigue siendo demasiado grande tras comprimirla.`)
    return { data: await toBase64(blob), preview: URL.createObjectURL(blob), w, h }
  } finally {
    bitmap.close()
  }
}
