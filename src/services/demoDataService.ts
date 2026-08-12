import { db } from '../db/database'
import type { Receipt } from '../types'
import { generateId } from '../utils/id'
import { round2 } from '../utils/currency'
import { calcFromInclusive, computeReceiptTotals } from '../utils/vat'
import { updateSettings } from './metaRepository'

interface DemoTemplate {
  firmaAdi: string
  kategori: string
  odemeYontemi: string
  musteri?: string
  rates: { rate: number; dahil: number }[]
}

const templates: DemoTemplate[] = [
  { firmaAdi: 'Shell Türkiye', kategori: 'Akaryakıt', odemeYontemi: 'Kredi Kartı', rates: [{ rate: 0.2, dahil: 1850 }] },
  { firmaAdi: 'Migros', kategori: 'Market', odemeYontemi: 'Banka Kartı', rates: [{ rate: 0.01, dahil: 120 }, { rate: 0.1, dahil: 340 }, { rate: 0.2, dahil: 210 }] },
  { firmaAdi: 'Ofis Plus Kırtasiye', kategori: 'Ofis', odemeYontemi: 'Nakit', rates: [{ rate: 0.2, dahil: 640 }] },
  { firmaAdi: 'Anadolu Restoran', kategori: 'Yemek', odemeYontemi: 'Kredi Kartı', musteri: 'ABC Ltd. Şti.', rates: [{ rate: 0.1, dahil: 890 }] },
  { firmaAdi: 'Petrol Ofisi', kategori: 'Akaryakıt', odemeYontemi: 'Şirket Kartı', rates: [{ rate: 0.2, dahil: 2100 }] },
  { firmaAdi: 'Hilton Otel', kategori: 'Konaklama', odemeYontemi: 'Havale / EFT', musteri: 'XYZ Danışmanlık', rates: [{ rate: 0.1, dahil: 4500 }] },
  { firmaAdi: 'Taksi Duraği', kategori: 'Ulaşım', odemeYontemi: 'Nakit', rates: [{ rate: 0.01, dahil: 180 }] },
  { firmaAdi: 'Oto Bakım Servisi', kategori: 'Araç', odemeYontemi: 'Kredi Kartı', rates: [{ rate: 0.2, dahil: 3200 }] },
  { firmaAdi: 'Temizlik Dünyası', kategori: 'Temizlik', odemeYontemi: 'Banka Kartı', rates: [{ rate: 0.2, dahil: 450 }] },
  { firmaAdi: 'Yapı Market', kategori: 'Malzeme', odemeYontemi: 'Kredi Kartı', rates: [{ rate: 0.2, dahil: 1275 }, { rate: 0.1, dahil: 300 }] },
  { firmaAdi: 'Teknik Servis A.Ş.', kategori: 'Hizmet', odemeYontemi: 'Havale / EFT', musteri: 'ABC Ltd. Şti.', rates: [{ rate: 0.2, dahil: 5400 }] },
  { firmaAdi: 'BİM', kategori: 'Market', odemeYontemi: 'Nakit', rates: [{ rate: 0.01, dahil: 65 }, { rate: 0.2, dahil: 95 }] },
]

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export async function loadDemoData(): Promise<number> {
  const now = new Date()
  const receipts: Receipt[] = []

  for (let monthOffset = 13; monthOffset >= 0; monthOffset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const countThisMonth = 3 + Math.floor(Math.random() * 4)

    for (let i = 0; i < countThisMonth; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)]
      const day = 1 + Math.floor(Math.random() * daysInMonth)
      const jitter = 0.85 + Math.random() * 0.3

      const vatSections = { kdv1: { matrah: 0, tutar: 0 }, kdv10: { matrah: 0, tutar: 0 }, kdv20: { matrah: 0, tutar: 0 } }
      for (const r of template.rates) {
        const dahil = round2(r.dahil * jitter)
        const { matrah, tutar } = calcFromInclusive(dahil, r.rate)
        if (r.rate === 0.01) vatSections.kdv1 = { matrah, tutar }
        if (r.rate === 0.1) vatSections.kdv10 = { matrah, tutar }
        if (r.rate === 0.2) vatSections.kdv20 = { matrah, tutar }
      }
      const totals = computeReceiptTotals(vatSections)

      const nowIso = new Date(year, month, day, 9 + Math.floor(Math.random() * 9)).toISOString()
      receipts.push({
        id: generateId(),
        firmaAdi: template.firmaAdi,
        musteri: template.musteri,
        tarih: `${year}-${pad(month + 1)}-${pad(day)}`,
        saat: `${pad(9 + Math.floor(Math.random() * 9))}:${pad(Math.floor(Math.random() * 60))}`,
        kategori: template.kategori,
        odemeYontemi: template.odemeYontemi,
        kdv1Matrah: vatSections.kdv1.matrah,
        kdv1Tutar: vatSections.kdv1.tutar,
        kdv10Matrah: vatSections.kdv10.matrah,
        kdv10Tutar: vatSections.kdv10.tutar,
        kdv20Matrah: vatSections.kdv20.matrah,
        kdv20Tutar: vatSections.kdv20.tutar,
        kdvHaricToplam: totals.kdvHaric,
        toplamKdv: totals.toplamKdv,
        toplamTutar: totals.genelToplam,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
    }
  }

  await db.receipts.bulkAdd(receipts)
  await updateSettings({ hasSeedData: true })
  return receipts.length
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.receipts, db.images, async () => {
    await db.receipts.clear()
    await db.images.clear()
  })
}
