const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** ₺12.450,75 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return currencyFormatter.format(0)
  return currencyFormatter.format(value)
}

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return numberFormatter.format(0)
  return numberFormatter.format(value)
}

/** 2 ondalık basamağa güvenli yuvarlama (float artefaktlarını önler) */
export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** "1.234,56" veya "1234.56" gibi kullanıcı girdisini number'a çevirir */
export function parseLocaleNumber(input: string): number {
  if (!input) return 0
  let s = input.trim()
  if (s === '') return 0
  // Türkçe format: nokta binlik ayraç, virgül ondalık
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    s = s.replace(',', '.')
  }
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}
