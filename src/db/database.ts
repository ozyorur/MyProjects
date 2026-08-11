import Dexie, { type Table } from 'dexie'
import type { AppSettings, Category, PaymentMethod, Receipt, ReceiptImage } from '../types'
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_METHODS } from './defaults'

export class FisTakipDatabase extends Dexie {
  receipts!: Table<Receipt, string>
  images!: Table<ReceiptImage, string>
  categories!: Table<Category, string>
  paymentMethods!: Table<PaymentMethod, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super('fistakip-db')

    this.version(1).stores({
      receipts: 'id, firmaAdi, tarih, musteri, kategori, odemeYontemi, createdAt, [firmaAdi+tarih]',
      images: 'id, receiptId',
      categories: 'id, name',
      paymentMethods: 'id, name',
      settings: 'id',
    })
  }
}

export const db = new FisTakipDatabase()

let initialized = false

export async function ensureSeedMetadata(): Promise<void> {
  if (initialized) return
  initialized = true

  await db.transaction('rw', db.categories, db.paymentMethods, db.settings, async () => {
    const catCount = await db.categories.count()
    if (catCount === 0) {
      await db.categories.bulkAdd(DEFAULT_CATEGORIES)
    }
    const pmCount = await db.paymentMethods.count()
    if (pmCount === 0) {
      await db.paymentMethods.bulkAdd(DEFAULT_PAYMENT_METHODS)
    }
    const settings = await db.settings.get('app')
    if (!settings) {
      await db.settings.put({ id: 'app', theme: 'system', hasSeedData: false })
    }
  })
}
