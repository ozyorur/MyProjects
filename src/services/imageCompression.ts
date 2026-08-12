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

const OCR_MAX_DIMENSION = 2200

/**
 * OCR doğruluğunu artırmak için: gri tonlama + kontrast germe uygular ve PNG (kayıpsız)
 * olarak döndürür. Fiş fotoğrafları genelde düşük kontrastlı termal kağıt + gürültülü arka
 * plan içerdiğinden bu adım Tesseract'ın metni ayırt etmesini belirgin şekilde kolaylaştırır.
 * Orijinal (sıkıştırılmamış) dosyadan çalışır; saklanan JPEG'in çift sıkıştırma artefaktlarını taşımaz.
 */
export async function preprocessForOcr(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const { width, height } = bitmap
    const longEdge = Math.max(width, height)
    const scale = longEdge > OCR_MAX_DIMENSION ? OCR_MAX_DIMENSION / longEdge : 1
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

    const imageData = ctx.getImageData(0, 0, targetW, targetH)
    const data = imageData.data
    const grayValues = new Uint8ClampedArray(data.length / 4)

    let min = 255
    let max = 0
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      grayValues[p] = g
      if (g < min) min = g
      if (g > max) max = g
    }

    const range = Math.max(1, max - min)
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const stretched = ((grayValues[p] - min) / range) * 255
      const contrasted = Math.min(255, Math.max(0, (stretched - 128) * 1.35 + 128))
      data[i] = data[i + 1] = data[i + 2] = contrasted
    }
    ctx.putImageData(imageData, 0, 0)

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
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
