import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
  isValid,
  eachMonthOfInterval,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import type { DateRange, PeriodPreset } from '../types'

export const isoToday = (): string => format(new Date(), 'yyyy-MM-dd')

export const toISODate = (d: Date): string => format(d, 'yyyy-MM-dd')

/** 11.08.2026 */
export function formatDateTR(iso: string | undefined): string {
  if (!iso) return '-'
  try {
    const d = parseISO(iso)
    if (!isValid(d)) return '-'
    return format(d, 'dd.MM.yyyy', { locale: tr })
  } catch {
    return '-'
  }
}

export function formatDateLongTR(iso: string | undefined): string {
  if (!iso) return '-'
  try {
    const d = parseISO(iso)
    if (!isValid(d)) return '-'
    return format(d, 'd MMMM yyyy', { locale: tr })
  } catch {
    return '-'
  }
}

export function formatDateTimeTR(iso: string | undefined): string {
  if (!iso) return '-'
  try {
    const d = parseISO(iso)
    if (!isValid(d)) return '-'
    return format(d, 'd MMMM yyyy HH:mm', { locale: tr })
  } catch {
    return '-'
  }
}

export function monthLabelTR(year: number, month: number): string {
  return format(new Date(year, month, 1), 'MMMM yyyy', { locale: tr })
}

export function getRangeForPreset(preset: PeriodPreset, custom?: DateRange): DateRange {
  const now = new Date()
  switch (preset) {
    case 'thisMonth':
      return { start: toISODate(startOfMonth(now)), end: toISODate(endOfMonth(now)) }
    case 'lastMonth': {
      const lm = subMonths(now, 1)
      return { start: toISODate(startOfMonth(lm)), end: toISODate(endOfMonth(lm)) }
    }
    case 'thisYear':
      return { start: toISODate(startOfYear(now)), end: toISODate(endOfYear(now)) }
    case 'lastYear': {
      const ly = subYears(now, 1)
      return { start: toISODate(startOfYear(ly)), end: toISODate(endOfYear(ly)) }
    }
    case 'custom':
      return custom ?? { start: toISODate(startOfMonth(now)), end: toISODate(endOfMonth(now)) }
  }
}

/** Verilen aralığın bir önceki yıl karşılığı (aynı gün/ay farkıyla) */
export function getPreviousYearRange(range: DateRange): DateRange {
  const start = subYears(parseISO(range.start), 1)
  const end = subYears(parseISO(range.end), 1)
  return { start: toISODate(start), end: toISODate(end) }
}

export function getPreviousPeriodRange(range: DateRange): DateRange {
  const start = parseISO(range.start)
  const end = parseISO(range.end)
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
  const prevEnd = new Date(start.getTime() - 86400000)
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000)
  return { start: toISODate(prevStart), end: toISODate(prevEnd) }
}

export const periodPresetLabels: Record<PeriodPreset, string> = {
  thisMonth: 'Bu Ay',
  lastMonth: 'Geçen Ay',
  thisYear: 'Bu Yıl',
  lastYear: 'Geçen Yıl',
  custom: 'Özel Tarih Aralığı',
}

export function daysBetween(isoA: string, isoB: string): number {
  const a = parseISO(isoA)
  const b = parseISO(isoB)
  return Math.abs(Math.round((b.getTime() - a.getTime()) / 86400000))
}

export function monthsInRange(range: DateRange): { year: number; month: number; label: string }[] {
  const start = parseISO(range.start)
  const end = parseISO(range.end)
  if (!isValid(start) || !isValid(end) || start > end) return []
  return eachMonthOfInterval({ start, end }).map((d) => ({
    year: d.getFullYear(),
    month: d.getMonth(),
    label: format(d, 'MMM yy', { locale: tr }),
  }))
}

export function last12Months(): { year: number; month: number; label: string }[] {
  const result: { year: number; month: number; label: string }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(now, i)
    result.push({ year: d.getFullYear(), month: d.getMonth(), label: format(d, 'MMM yy', { locale: tr }) })
  }
  return result
}
