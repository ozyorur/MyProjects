import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { db } from '../db/database'
import type { BackupData, Receipt, RestoreSummary } from '../types'
import { generateId } from '../utils/id'
import { receiptDuplicateKey } from '../utils/normalize'
import { markBackupTaken, getSettings, addCategory, addPaymentMethod } from './metaRepository'

const BACKUP_VERSION = 1

function extensionForMime(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('pdf')) return 'pdf'
  return 'jpg'
}

export async function createBackupBlob(): Promise<Blob> {
  const [receipts, categories, paymentMethods, images, settings] = await Promise.all([
    db.receipts.toArray(),
    db.categories.toArray(),
    db.paymentMethods.toArray(),
    db.images.toArray(),
    getSettings(),
  ])

  const backupData: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'FisTakip',
    receipts,
    categories,
    paymentMethods,
    settings: { theme: settings.theme, lastBackupAt: settings.lastBackupAt, hasSeedData: settings.hasSeedData },
  }

  const zip = new JSZip()
  zip.file('data.json', JSON.stringify(backupData, null, 2))
  const imagesFolder = zip.folder('images')
  const usedImageIds = new Set(receipts.map((r) => r.fisFotografi).filter(Boolean) as string[])

  if (imagesFolder) {
    for (const img of images) {
      if (!usedImageIds.has(img.id)) continue
      const ext = extensionForMime(img.mimeType)
      imagesFolder.file(`${img.id}.${ext}`, img.blob)
    }
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

export function backupFilename(prefix = 'fistakip-backup'): string {
  const today = new Date().toISOString().slice(0, 10)
  return `${prefix}-${today}.zip`
}

export async function downloadBackup(): Promise<void> {
  const blob = await createBackupBlob()
  saveAs(blob, backupFilename())
  await markBackupTaken()
}

export interface ParsedBackup {
  data: BackupData
  images: Map<string, Blob>
}

export async function parseBackupZip(file: File | Blob): Promise<ParsedBackup> {
  const zip = await JSZip.loadAsync(file)
  const dataFile = zip.file('data.json')
  if (!dataFile) throw new Error('Geçersiz yedek dosyası: data.json bulunamadı.')

  const dataText = await dataFile.async('text')
  let data: BackupData
  try {
    data = JSON.parse(dataText)
  } catch {
    throw new Error('Yedek dosyası okunamadı (bozuk JSON).')
  }
  if (!Array.isArray(data.receipts)) {
    throw new Error('Yedek dosyası formatı tanınmadı.')
  }

  const images = new Map<string, Blob>()
  const imageEntries = zip.file(/^images\//)
  for (const entry of imageEntries) {
    if (entry.dir) continue
    const blob = await entry.async('blob')
    const name = entry.name.replace(/^images\//, '')
    const imageId = name.substring(0, name.lastIndexOf('.')) || name
    images.set(imageId, blob)
  }

  return { data, images }
}

export interface BackupSummary {
  fisSayisi: number
  firmaSayisi: number
  tarihAraligi: { start: string; end: string } | null
}

export function summarizeParsedBackup(parsed: ParsedBackup): BackupSummary {
  const receipts = parsed.data.receipts
  const firmaSet = new Set(receipts.map((r) => r.firmaAdi))
  const dates = receipts.map((r) => r.tarih).filter(Boolean).sort()
  return {
    fisSayisi: receipts.length,
    firmaSayisi: firmaSet.size,
    tarihAraligi: dates.length > 0 ? { start: dates[0], end: dates[dates.length - 1] } : null,
  }
}

export async function restoreFromBackup(
  parsed: ParsedBackup,
  options: { createSafetyBackup: boolean }
): Promise<RestoreSummary> {
  if (options.createSafetyBackup) {
    const blob = await createBackupBlob()
    saveAs(blob, backupFilename('fistakip-backup-oncesi-geri-yukleme'))
  }

  let yeniEklenen = 0
  let uzerineYazilan = 0
  let hatali = 0

  await db.transaction('rw', db.receipts, db.images, db.categories, db.paymentMethods, async () => {
    for (const cat of parsed.data.categories ?? []) {
      await addCategory(cat.name)
    }
    for (const pm of parsed.data.paymentMethods ?? []) {
      await addPaymentMethod(pm.name)
    }

    const existingReceipts = await db.receipts.toArray()
    const byKey = new Map<string, Receipt>(existingReceipts.map((r) => [receiptDuplicateKey(r), r]))

    for (const incoming of parsed.data.receipts) {
      try {
        const key = receiptDuplicateKey(incoming)
        const match = byKey.get(key)
        const now = new Date().toISOString()

        let newImageId: string | undefined
        if (incoming.fisFotografi && parsed.images.has(incoming.fisFotografi)) {
          const blob = parsed.images.get(incoming.fisFotografi)!
          if (match?.fisFotografi) {
            await db.images.delete(match.fisFotografi).catch(() => undefined)
          }
          newImageId = generateId()
          await db.images.add({
            id: newImageId,
            receiptId: match?.id ?? incoming.id,
            blob,
            mimeType: blob.type || 'image/jpeg',
            createdAt: now,
          })
        }

        if (match) {
          const updated: Receipt = {
            ...incoming,
            id: match.id,
            fisFotografi: newImageId ?? match.fisFotografi,
            createdAt: match.createdAt,
            updatedAt: now,
          }
          await db.receipts.put(updated)
          byKey.set(key, updated)
          uzerineYazilan++
        } else {
          const newId = generateId()
          const created: Receipt = {
            ...incoming,
            id: newId,
            fisFotografi: newImageId,
            createdAt: incoming.createdAt || now,
            updatedAt: now,
          }
          await db.receipts.add(created)
          byKey.set(key, created)
          yeniEklenen++
        }
      } catch (err) {
        console.error('Restore kaydı başarısız:', err)
        hatali++
      }
    }
  })

  return {
    toplamKayit: parsed.data.receipts.length,
    yeniEklenen,
    uzerineYazilan,
    hatali,
  }
}
