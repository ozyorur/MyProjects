import { db } from '../db/database'
import { generateId } from '../utils/id'

export async function saveReceiptImage(receiptId: string, blob: Blob): Promise<string> {
  const id = generateId()
  await db.images.add({
    id,
    receiptId,
    blob,
    mimeType: blob.type || 'image/jpeg',
    createdAt: new Date().toISOString(),
  })
  return id
}

export async function replaceReceiptImage(imageId: string | undefined, receiptId: string, blob: Blob): Promise<string> {
  if (imageId) {
    await db.images.delete(imageId)
  }
  return saveReceiptImage(receiptId, blob)
}

export async function getImageBlob(imageId: string | undefined): Promise<Blob | undefined> {
  if (!imageId) return undefined
  const rec = await db.images.get(imageId)
  return rec?.blob
}

export async function getImageObjectUrl(imageId: string | undefined): Promise<string | undefined> {
  const blob = await getImageBlob(imageId)
  if (!blob) return undefined
  return URL.createObjectURL(blob)
}

export async function deleteImage(imageId: string): Promise<void> {
  await db.images.delete(imageId)
}
