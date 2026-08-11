// Merkezi tip tanımları

export type VatRateKey = 'kdv1' | 'kdv10' | 'kdv20'

export interface VatBreakdown {
  matrah: number // KDV hariç tutar
  tutar: number // KDV tutarı
}

export type FieldConfidence = 'high' | 'low' | 'manual'

export interface OcrFieldMeta {
  [field: string]: FieldConfidence | undefined
}

export interface Receipt {
  id: string
  firmaAdi: string
  vergiNo?: string
  musteri?: string
  fisNo?: string
  belgeNo?: string
  tarih: string // ISO date (YYYY-MM-DD)
  saat?: string // HH:mm
  aciklama?: string
  kategori: string
  odemeYontemi: string

  kdv1Matrah: number
  kdv1Tutar: number
  kdv10Matrah: number
  kdv10Tutar: number
  kdv20Matrah: number
  kdv20Tutar: number

  kdvHaricToplam: number
  toplamKdv: number
  toplamTutar: number

  fisFotografi?: string // blob id referansı (images store)
  notlar?: string
  etiketler?: string[]

  ocrMeta?: OcrFieldMeta
  ocrRawText?: string

  createdAt: string
  updatedAt: string
}

export type ReceiptInput = Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>

export interface ReceiptImage {
  id: string
  receiptId: string
  blob: Blob
  mimeType: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  isDefault?: boolean
}

export interface PaymentMethod {
  id: string
  name: string
  isDefault?: boolean
}

export interface AppSettings {
  id: string // 'app'
  theme: 'light' | 'dark' | 'system'
  lastBackupAt?: string
  backupReminderDismissedAt?: string
  hasSeedData?: boolean
}

export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom'

export interface DateRange {
  start: string // ISO date
  end: string // ISO date
}

export interface VatTotals {
  kdv1Matrah: number
  kdv1Tutar: number
  kdv10Matrah: number
  kdv10Tutar: number
  kdv20Matrah: number
  kdv20Tutar: number
  kdvHaric: number
  toplamKdv: number
  genelToplam: number
}

export interface PeriodSummary extends VatTotals {
  fisSayisi: number
  ortalamaFis: number
}

export interface BackupData {
  version: number
  exportedAt: string
  appName: 'FisTakip'
  receipts: Receipt[]
  categories: Category[]
  paymentMethods: PaymentMethod[]
  settings: Omit<AppSettings, 'id'>
}

export interface RestoreSummary {
  toplamKayit: number
  yeniEklenen: number
  uzerineYazilan: number
  hatali: number
}
