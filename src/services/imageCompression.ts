const MAX_DIMENSION = 1900
const JPEG_QUALITY = 0.82

/** Görseli client-side küçültür ve JPEG'e sıkıştırır. Okunabilirlik için uzun kenar ~1900px sınırlanır. */
export async function compressImage(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const { width, height } = bitmap
    const longEdge = Math.max(width, height)
    const scale = longEdge > MAX_DIMENSION ? MAX_DIMENSION / longEdge : 1
    const targetW = Math.round(width * scale)
    const targetH = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return file instanceof Blob ? file : new Blob([file])

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
    )
    return blob ?? (file instanceof Blob ? file : new Blob([file]))
  } finally {
    bitmap.close()
  }
}

export async function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
