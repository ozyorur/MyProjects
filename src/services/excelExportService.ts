import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import type { Receipt } from '../types'
import { formatDateTR } from '../utils/date'

export function exportReceiptsToExcel(receipts: Receipt[], filename = 'fistakip-raporu.xlsx'): void {
  const rows = receipts.map((r) => ({
    Tarih: formatDateTR(r.tarih),
    Saat: r.saat ?? '',
    Firma: r.firmaAdi,
    'Vergi No': r.vergiNo ?? '',
    Müşteri: r.musteri ?? '',
    'Fiş No': r.fisNo ?? '',
    'Belge No': r.belgeNo ?? '',
    Kategori: r.kategori,
    'Ödeme Yöntemi': r.odemeYontemi,
    Açıklama: r.aciklama ?? '',
    '%1 Matrah': r.kdv1Matrah,
    '%1 KDV': r.kdv1Tutar,
    '%10 Matrah': r.kdv10Matrah,
    '%10 KDV': r.kdv10Tutar,
    '%20 Matrah': r.kdv20Matrah,
    '%20 KDV': r.kdv20Tutar,
    'KDV Hariç': r.kdvHaricToplam,
    'Toplam KDV': r.toplamKdv,
    'Genel Toplam': r.toplamTutar,
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 11 }, { wch: 7 }, { wch: 24 }, { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 11 }, { wch: 9 }, { wch: 11 }, { wch: 9 },
    { wch: 11 }, { wch: 9 }, { wch: 12 }, { wch: 12 }, { wch: 13 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fişler')

  const arrayBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' })
  saveAs(blob, filename)
}
