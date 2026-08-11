import { db } from '../db/database'
import type { Receipt, ReceiptInput } from '../types'
import { generateId } from '../utils/id'
import { receiptDuplicateKey } from '../utils/normalize'

export async function getAllReceipts(): Promise<Receipt[]> {
  return db.receipts.orderBy('tarih').reverse().toArray()
}

export async function getReceiptById(id: string): Promise<Receipt | undefined> {
  return db.receipts.get(id)
}

export async function findPotentialDuplicate(input: Pick<Receipt, 'firmaAdi' | 'tarih' | 'musteri' | 'odemeYontemi'>, excludeId?: string): Promise<Receipt | undefined> {
  const key = receiptDuplicateKey(input)
  const candidates = await db.receipts.where('tarih').equals(input.tarih).toArray()
  return candidates.find((c) => c.id !== excludeId && receiptDuplicateKey(c) === key)
}

export async function createReceipt(input: ReceiptInput): Promise<Receipt> {
  const now = new Date().toISOString()
  const receipt: Receipt = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  await db.receipts.add(receipt)
  return receipt
}

export async function updateReceipt(id: string, input: ReceiptInput): Promise<Receipt> {
  const existing = await db.receipts.get(id)
  if (!existing) throw new Error('Fiş bulunamadı')
  const updated: Receipt = {
    ...existing,
    ...input,
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  }
  await db.receipts.put(updated)
  return updated
}

export async function deleteReceipt(id: string): Promise<void> {
  await db.transaction('rw', db.receipts, db.images, async () => {
    await db.receipts.delete(id)
    await db.images.where('receiptId').equals(id).delete()
  })
}

export async function countReceipts(): Promise<number> {
  return db.receipts.count()
}

export async function getDistinctCompanies(): Promise<string[]> {
  const all = await db.receipts.toArray()
  const set = new Set<string>()
  all.forEach((r) => r.firmaAdi && set.add(r.firmaAdi))
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))
}

export async function getDistinctCustomers(): Promise<string[]> {
  const all = await db.receipts.toArray()
  const set = new Set<string>()
  all.forEach((r) => r.musteri && set.add(r.musteri))
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'))
}
