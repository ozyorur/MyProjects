import type { Receipt, VatTotals } from '../types'
import { round2 } from './currency'

export const VAT_RATES = {
  kdv1: 0.01,
  kdv10: 0.1,
  kdv20: 0.2,
} as const

export type VatRateName = keyof typeof VAT_RATES

/**
 * KDV dahil tutardan matrah ve KDV tutarını hesaplar.
 * matrah = kdvDahilTutar / (1 + kdvOrani)
 * kdv = kdvDahilTutar - matrah
 */
export function calcFromInclusive(kdvDahilTutar: number, oran: number): { matrah: number; tutar: number } {
  const matrah = round2(kdvDahilTutar / (1 + oran))
  const tutar = round2(kdvDahilTutar - matrah)
  return { matrah, tutar }
}

/** Matrahtan KDV dahil tutarı hesaplar */
export function calcInclusiveFromMatrah(matrah: number, oran: number): { tutar: number; dahil: number } {
  const tutar = round2(matrah * oran)
  const dahil = round2(matrah + tutar)
  return { tutar, dahil }
}

export interface VatSectionInput {
  matrah: number
  tutar: number
}

export function computeReceiptTotals(input: {
  kdv1: VatSectionInput
  kdv10: VatSectionInput
  kdv20: VatSectionInput
}): VatTotals {
  const kdvHaric = round2(input.kdv1.matrah + input.kdv10.matrah + input.kdv20.matrah)
  const toplamKdv = round2(input.kdv1.tutar + input.kdv10.tutar + input.kdv20.tutar)
  const genelToplam = round2(kdvHaric + toplamKdv)
  return {
    kdv1Matrah: round2(input.kdv1.matrah),
    kdv1Tutar: round2(input.kdv1.tutar),
    kdv10Matrah: round2(input.kdv10.matrah),
    kdv10Tutar: round2(input.kdv10.tutar),
    kdv20Matrah: round2(input.kdv20.matrah),
    kdv20Tutar: round2(input.kdv20.tutar),
    kdvHaric,
    toplamKdv,
    genelToplam,
  }
}

export function totalsFromReceipt(r: Pick<Receipt, 'kdv1Matrah' | 'kdv1Tutar' | 'kdv10Matrah' | 'kdv10Tutar' | 'kdv20Matrah' | 'kdv20Tutar' | 'kdvHaricToplam' | 'toplamKdv' | 'toplamTutar'>): VatTotals {
  return {
    kdv1Matrah: r.kdv1Matrah || 0,
    kdv1Tutar: r.kdv1Tutar || 0,
    kdv10Matrah: r.kdv10Matrah || 0,
    kdv10Tutar: r.kdv10Tutar || 0,
    kdv20Matrah: r.kdv20Matrah || 0,
    kdv20Tutar: r.kdv20Tutar || 0,
    kdvHaric: r.kdvHaricToplam || 0,
    toplamKdv: r.toplamKdv || 0,
    genelToplam: r.toplamTutar || 0,
  }
}

export function sumVatTotals(list: VatTotals[]): VatTotals {
  const zero: VatTotals = {
    kdv1Matrah: 0,
    kdv1Tutar: 0,
    kdv10Matrah: 0,
    kdv10Tutar: 0,
    kdv20Matrah: 0,
    kdv20Tutar: 0,
    kdvHaric: 0,
    toplamKdv: 0,
    genelToplam: 0,
  }
  return list.reduce((acc, t) => ({
    kdv1Matrah: round2(acc.kdv1Matrah + t.kdv1Matrah),
    kdv1Tutar: round2(acc.kdv1Tutar + t.kdv1Tutar),
    kdv10Matrah: round2(acc.kdv10Matrah + t.kdv10Matrah),
    kdv10Tutar: round2(acc.kdv10Tutar + t.kdv10Tutar),
    kdv20Matrah: round2(acc.kdv20Matrah + t.kdv20Matrah),
    kdv20Tutar: round2(acc.kdv20Tutar + t.kdv20Tutar),
    kdvHaric: round2(acc.kdvHaric + t.kdvHaric),
    toplamKdv: round2(acc.toplamKdv + t.toplamKdv),
    genelToplam: round2(acc.genelToplam + t.genelToplam),
  }), zero)
}

/** Fiş için tutarsızlık kontrolü: matrah+KDV toplamları genel toplamla eşleşiyor mu (0.05 tolerans) */
export function validateReceiptConsistency(r: {
  kdv1Matrah: number; kdv1Tutar: number
  kdv10Matrah: number; kdv10Tutar: number
  kdv20Matrah: number; kdv20Tutar: number
  toplamTutar: number
}): { isConsistent: boolean; diff: number; calculatedTotal: number } {
  const calculatedTotal = round2(
    r.kdv1Matrah + r.kdv1Tutar + r.kdv10Matrah + r.kdv10Tutar + r.kdv20Matrah + r.kdv20Tutar
  )
  const diff = round2(calculatedTotal - r.toplamTutar)
  return { isConsistent: Math.abs(diff) <= 0.05, diff, calculatedTotal }
}
