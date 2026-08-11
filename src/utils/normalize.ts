import type { Receipt } from '../types'

/** Baştaki/sondaki boşlukları kaldırır, küçük harfe çevirir, çift boşlukları temizler */
export function normalizeText(value: string | undefined | null): string {
  if (!value) return ''
  return value.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ')
}

/**
 * Duplicate/overwrite karşılaştırması için unique key:
 * normalize(firmaAdi) + tarih + normalize(musteri) + normalize(odemeYontemi)
 */
export function receiptDuplicateKey(r: Pick<Receipt, 'firmaAdi' | 'tarih' | 'musteri' | 'odemeYontemi'>): string {
  return [
    normalizeText(r.firmaAdi),
    (r.tarih || '').trim(),
    normalizeText(r.musteri),
    normalizeText(r.odemeYontemi),
  ].join('|')
}
