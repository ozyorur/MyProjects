import { db } from '../db/database'
import type { AppSettings, Category, PaymentMethod } from '../types'
import { generateId } from '../utils/id'
import { normalizeText } from '../utils/normalize'

export async function getCategories(): Promise<Category[]> {
  return (await db.categories.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'tr'))
}

export async function addCategory(name: string): Promise<Category> {
  const trimmed = name.trim()
  const existing = (await db.categories.toArray()).find((c) => normalizeText(c.name) === normalizeText(trimmed))
  if (existing) return existing
  const cat: Category = { id: generateId(), name: trimmed }
  await db.categories.add(cat)
  return cat
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return (await db.paymentMethods.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'tr'))
}

export async function addPaymentMethod(name: string): Promise<PaymentMethod> {
  const trimmed = name.trim()
  const existing = (await db.paymentMethods.toArray()).find((p) => normalizeText(p.name) === normalizeText(trimmed))
  if (existing) return existing
  const pm: PaymentMethod = { id: generateId(), name: trimmed }
  await db.paymentMethods.add(pm)
  return pm
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('app')
  if (settings) return settings
  const fresh: AppSettings = { id: 'app', theme: 'system', hasSeedData: false }
  await db.settings.put(fresh)
  return fresh
}

export async function updateSettings(patch: Partial<Omit<AppSettings, 'id'>>): Promise<AppSettings> {
  const current = await getSettings()
  const updated: AppSettings = { ...current, ...patch, id: 'app' }
  await db.settings.put(updated)
  return updated
}

export async function markBackupTaken(): Promise<void> {
  await updateSettings({ lastBackupAt: new Date().toISOString(), backupReminderDismissedAt: undefined })
}
