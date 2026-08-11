import type { DateRange, PeriodSummary, Receipt, VatTotals } from '../types'
import { round2 } from '../utils/currency'
import { sumVatTotals, totalsFromReceipt } from '../utils/vat'

export function filterReceiptsByRange(receipts: Receipt[], range: DateRange): Receipt[] {
  return receipts.filter((r) => r.tarih >= range.start && r.tarih <= range.end)
}

export function summarizeReceipts(receipts: Receipt[]): PeriodSummary {
  const totals = sumVatTotals(receipts.map(totalsFromReceipt))
  const fisSayisi = receipts.length
  const ortalamaFis = fisSayisi > 0 ? round2(totals.genelToplam / fisSayisi) : 0
  return { ...totals, fisSayisi, ortalamaFis }
}

export interface ComparisonResult {
  current: PeriodSummary
  previous: PeriodSummary
  diff: {
    genelToplam: number
    genelToplamPct: number | null
    toplamKdv: number
    toplamKdvPct: number | null
    kdv1Tutar: number
    kdv10Tutar: number
    kdv20Tutar: number
    fisSayisi: number
    fisSayisiPct: number | null
    ortalamaFis: number
  }
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return round2(((current - previous) / previous) * 100)
}

export function compareReceiptSets(currentReceipts: Receipt[], previousReceipts: Receipt[]): ComparisonResult {
  const current = summarizeReceipts(currentReceipts)
  const previous = summarizeReceipts(previousReceipts)
  return {
    current,
    previous,
    diff: {
      genelToplam: round2(current.genelToplam - previous.genelToplam),
      genelToplamPct: pctChange(current.genelToplam, previous.genelToplam),
      toplamKdv: round2(current.toplamKdv - previous.toplamKdv),
      toplamKdvPct: pctChange(current.toplamKdv, previous.toplamKdv),
      kdv1Tutar: round2(current.kdv1Tutar - previous.kdv1Tutar),
      kdv10Tutar: round2(current.kdv10Tutar - previous.kdv10Tutar),
      kdv20Tutar: round2(current.kdv20Tutar - previous.kdv20Tutar),
      fisSayisi: current.fisSayisi - previous.fisSayisi,
      fisSayisiPct: pctChange(current.fisSayisi, previous.fisSayisi),
      ortalamaFis: round2(current.ortalamaFis - previous.ortalamaFis),
    },
  }
}

export interface GroupedTotal {
  key: string
  totals: VatTotals
  fisSayisi: number
}

export function groupReceiptsBy(receipts: Receipt[], keyFn: (r: Receipt) => string): GroupedTotal[] {
  const map = new Map<string, Receipt[]>()
  for (const r of receipts) {
    const key = keyFn(r) || 'Diğer'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  return Array.from(map.entries())
    .map(([key, list]) => ({ key, totals: sumVatTotals(list.map(totalsFromReceipt)), fisSayisi: list.length }))
    .sort((a, b) => b.totals.genelToplam - a.totals.genelToplam)
}

export function monthlyTrend(receipts: Receipt[], months: { year: number; month: number; label: string }[]): { label: string; toplam: number; kdv: number }[] {
  return months.map(({ year, month, label }) => {
    const monthReceipts = receipts.filter((r) => {
      const d = new Date(r.tarih)
      return d.getFullYear() === year && d.getMonth() === month
    })
    const totals = sumVatTotals(monthReceipts.map(totalsFromReceipt))
    return { label, toplam: totals.genelToplam, kdv: totals.toplamKdv }
  })
}
