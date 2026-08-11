import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { DateRange, PeriodPreset } from '../types'
import { getPreviousYearRange, getRangeForPreset, last12Months, monthLabelTR, monthsInRange } from '../utils/date'
import { formatCurrency } from '../utils/currency'
import {
  compareReceiptSets,
  filterReceiptsByRange,
  groupReceiptsBy,
  monthlyTrend,
} from '../services/analyticsService'
import { exportReceiptsToExcel } from '../services/excelExportService'
import { PeriodSelector } from '../components/dashboard/PeriodSelector'
import { TrendChart } from '../components/dashboard/TrendChart'
import { DistributionPie } from '../components/reports/DistributionPie'
import { RankingList } from '../components/reports/RankingList'
import { VatMonthlyTable } from '../components/reports/VatMonthlyTable'
import { CompanyComparisonTable } from '../components/reports/CompanyComparisonTable'
import { ComparisonBlock } from '../components/dashboard/ComparisonBlock'
import { IconDownload } from '../components/ui/icons'

export function ReportsPage() {
  const receipts = useLiveQuery(() => db.receipts.toArray(), [])

  const [preset, setPreset] = useState<PeriodPreset>('thisYear')
  const [custom, setCustom] = useState<DateRange>(() => getRangeForPreset('thisYear'))

  const [manualA, setManualA] = useState<DateRange>(() => getRangeForPreset('thisMonth'))
  const [manualB, setManualB] = useState<DateRange>(() => getPreviousYearRange(getRangeForPreset('thisMonth')))
  const [manualCompared, setManualCompared] = useState(false)

  const range = useMemo(() => getRangeForPreset(preset, custom), [preset, custom])
  const prevYearRange = useMemo(() => getPreviousYearRange(range), [range])

  const periodReceipts = useMemo(() => (receipts ? filterReceiptsByRange(receipts, range) : []), [receipts, range])
  const prevYearReceipts = useMemo(() => (receipts ? filterReceiptsByRange(receipts, prevYearRange) : []), [receipts, prevYearRange])

  const months = useMemo(() => {
    const inRange = monthsInRange(range)
    return inRange.length > 0 && inRange.length <= 24 ? inRange : last12Months()
  }, [range])

  const trend12 = useMemo(() => last12Months(), [])
  const trendData = useMemo(() => (receipts ? monthlyTrend(receipts, trend12) : []), [receipts, trend12])

  const categoryGroups = useMemo(() => groupReceiptsBy(periodReceipts, (r) => r.kategori), [periodReceipts])
  const companyGroups = useMemo(() => groupReceiptsBy(periodReceipts, (r) => r.firmaAdi), [periodReceipts])
  const customerGroups = useMemo(() => groupReceiptsBy(periodReceipts, (r) => r.musteri || 'Belirtilmemiş'), [periodReceipts])
  const paymentGroups = useMemo(() => groupReceiptsBy(periodReceipts, (r) => r.odemeYontemi), [periodReceipts])

  const vatDistribution = useMemo(() => {
    const t = periodReceipts.reduce(
      (acc, r) => ({ k1: acc.k1 + r.kdv1Tutar, k10: acc.k10 + r.kdv10Tutar, k20: acc.k20 + r.kdv20Tutar }),
      { k1: 0, k10: 0, k20: 0 }
    )
    return [
      { name: '%1 KDV', value: t.k1 },
      { name: '%10 KDV', value: t.k10 },
      { name: '%20 KDV', value: t.k20 },
    ].filter((x) => x.value > 0)
  }, [periodReceipts])

  const yearComparison = useMemo(() => compareReceiptSets(periodReceipts, prevYearReceipts), [periodReceipts, prevYearReceipts])

  const manualReceiptsA = useMemo(() => (receipts ? filterReceiptsByRange(receipts, manualA) : []), [receipts, manualA])
  const manualReceiptsB = useMemo(() => (receipts ? filterReceiptsByRange(receipts, manualB) : []), [receipts, manualB])
  const manualComparison = useMemo(() => compareReceiptSets(manualReceiptsA, manualReceiptsB), [manualReceiptsA, manualReceiptsB])

  const currentLabel = periodLabel(preset, range)
  const previousLabel = periodLabel(preset, prevYearRange)

  if (!receipts) {
    return <div className="py-20 text-center text-sm text-slate-400">Yükleniyor…</div>
  }

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <PeriodSelector preset={preset} custom={custom} onPresetChange={setPreset} onCustomChange={setCustom} />
        <button
          className="btn-primary"
          onClick={() => exportReceiptsToExcel(periodReceipts, `fistakip-rapor-${range.start}_${range.end}.xlsx`)}
          disabled={periodReceipts.length === 0}
        >
          <IconDownload width={17} height={17} />
          Excel'e Aktar
        </button>
      </div>

      <section className="card p-4 md:p-5">
        <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">KDV Raporu (Aylık Detay)</h2>
        <VatMonthlyTable receipts={periodReceipts} months={months} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4 md:p-5">
          <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Son 12 Ay Harcama Trendi</h2>
          <TrendChart data={trendData} />
        </div>
        <div className="card p-4 md:p-5">
          <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">KDV Oranı Dağılımı</h2>
          <DistributionPie data={vatDistribution} />
        </div>
        <div className="card p-4 md:p-5">
          <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Kategori Dağılımı</h2>
          <DistributionPie data={categoryGroups.map((g) => ({ name: g.key, value: g.totals.genelToplam }))} />
        </div>
        <div className="card p-4 md:p-5">
          <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Ödeme Yöntemi Dağılımı</h2>
          <DistributionPie data={paymentGroups.map((g) => ({ name: g.key, value: g.totals.genelToplam }))} />
        </div>
        <div className="card p-4 md:p-5 lg:col-span-2">
          <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Firma Bazında Harcama (İlk 10)</h2>
          <RankingList data={companyGroups} />
        </div>
        <div className="card p-4 md:p-5 lg:col-span-2">
          <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Müşteri Bazında Harcama (İlk 10)</h2>
          <RankingList data={customerGroups} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">
          Dönem Karşılaştırması · {currentLabel} vs {previousLabel}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ComparisonBlock
            currentLabel={currentLabel}
            previousLabel={previousLabel}
            currentValue={yearComparison.current.genelToplam}
            previousValue={yearComparison.previous.genelToplam}
            diff={yearComparison.diff.genelToplam}
            diffPct={yearComparison.diff.genelToplamPct}
          />
          <ComparisonBlock
            currentLabel={`${currentLabel} · KDV`}
            previousLabel={`${previousLabel} · KDV`}
            currentValue={yearComparison.current.toplamKdv}
            previousValue={yearComparison.previous.toplamKdv}
            diff={yearComparison.diff.toplamKdv}
            diffPct={yearComparison.diff.toplamKdvPct}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Fiş Sayısı Farkı" value={String(yearComparison.diff.fisSayisi)} />
          <MiniStat label="Ort. Fiş Farkı" value={formatCurrency(yearComparison.diff.ortalamaFis)} />
          <MiniStat label={`${previousLabel} Fiş`} value={String(yearComparison.previous.fisSayisi)} />
          <MiniStat label={`${currentLabel} Fiş`} value={String(yearComparison.current.fisSayisi)} />
        </div>
        <div className="card mt-4 p-4 md:p-5">
          <h3 className="mb-3 font-bold text-slate-800 dark:text-slate-100">Firma Bazında Karşılaştırma</h3>
          <CompanyComparisonTable
            currentReceipts={periodReceipts}
            previousReceipts={prevYearReceipts}
            currentLabel={currentLabel}
            previousLabel={previousLabel}
          />
        </div>
      </section>

      <section className="card p-4 md:p-5">
        <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Manuel Dönem Karşılaştırması</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Dönem A</label>
            <div className="flex items-center gap-2">
              <input type="date" className="input" value={manualA.start} onChange={(e) => setManualA({ ...manualA, start: e.target.value })} />
              <span className="text-slate-400">-</span>
              <input type="date" className="input" value={manualA.end} onChange={(e) => setManualA({ ...manualA, end: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Dönem B</label>
            <div className="flex items-center gap-2">
              <input type="date" className="input" value={manualB.start} onChange={(e) => setManualB({ ...manualB, start: e.target.value })} />
              <span className="text-slate-400">-</span>
              <input type="date" className="input" value={manualB.end} onChange={(e) => setManualB({ ...manualB, end: e.target.value })} />
            </div>
          </div>
        </div>
        <button className="btn-secondary mt-4" onClick={() => setManualCompared(true)}>
          Karşılaştır
        </button>

        {manualCompared && (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <ComparisonBlock
              currentLabel="Dönem A"
              previousLabel="Dönem B"
              currentValue={manualComparison.current.genelToplam}
              previousValue={manualComparison.previous.genelToplam}
              diff={manualComparison.diff.genelToplam}
              diffPct={manualComparison.diff.genelToplamPct}
            />
            <ComparisonBlock
              currentLabel="Dönem A · KDV"
              previousLabel="Dönem B · KDV"
              currentValue={manualComparison.current.toplamKdv}
              previousValue={manualComparison.previous.toplamKdv}
              diff={manualComparison.diff.toplamKdv}
              diffPct={manualComparison.diff.toplamKdvPct}
            />
          </div>
        )}
      </section>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-3 text-center">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 font-bold text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  )
}

function periodLabel(preset: PeriodPreset, range: DateRange): string {
  if (preset === 'thisMonth' || preset === 'lastMonth') {
    const d = new Date(range.start)
    return monthLabelTR(d.getFullYear(), d.getMonth())
  }
  if (preset === 'thisYear' || preset === 'lastYear') {
    return String(new Date(range.start).getFullYear())
  }
  return `${range.start} / ${range.end}`
}
