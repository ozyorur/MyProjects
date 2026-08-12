import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { DateRange, PeriodPreset } from '../types'
import { getRangeForPreset, getPreviousYearRange, last12Months, monthLabelTR } from '../utils/date'
import { formatCurrency } from '../utils/currency'
import {
  compareReceiptSets,
  filterReceiptsByRange,
  groupReceiptsBy,
  monthlyTrend,
  summarizeReceipts,
} from '../services/analyticsService'
import { PeriodSelector } from '../components/dashboard/PeriodSelector'
import { StatCard } from '../components/ui/StatCard'
import { ComparisonBlock } from '../components/dashboard/ComparisonBlock'
import { TrendChart } from '../components/dashboard/TrendChart'
import { PaymentMethodChart } from '../components/dashboard/PaymentMethodChart'
import { BackupReminder } from '../components/dashboard/BackupReminder'
import { IconPlus } from '../components/ui/icons'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const [preset, setPreset] = useState<PeriodPreset>('thisMonth')
  const [custom, setCustom] = useState<DateRange>(() => getRangeForPreset('thisMonth'))
  const [reminderDismissed, setReminderDismissed] = useState(false)

  const receipts = useLiveQuery(() => db.receipts.toArray(), [])
  const settings = useLiveQuery(() => db.settings.get('app'), [])

  const range = useMemo(() => getRangeForPreset(preset, custom), [preset, custom])
  const prevYearRange = useMemo(() => getPreviousYearRange(range), [range])

  const currentReceipts = useMemo(() => (receipts ? filterReceiptsByRange(receipts, range) : []), [receipts, range])
  const prevYearReceipts = useMemo(() => (receipts ? filterReceiptsByRange(receipts, prevYearRange) : []), [receipts, prevYearRange])

  const summary = useMemo(() => summarizeReceipts(currentReceipts), [currentReceipts])
  const comparison = useMemo(() => compareReceiptSets(currentReceipts, prevYearReceipts), [currentReceipts, prevYearReceipts])

  const months = useMemo(() => last12Months(), [])
  const trendData = useMemo(() => (receipts ? monthlyTrend(receipts, months) : []), [receipts, months])

  const paymentGroups = useMemo(() => groupReceiptsBy(currentReceipts, (r) => r.odemeYontemi || 'Diğer'), [currentReceipts])

  const currentLabel = periodLabel(preset, range)
  const previousLabel = periodLabel(preset, prevYearRange, true)

  if (!receipts) {
    return <div className="py-20 text-center text-sm text-slate-400">Yükleniyor…</div>
  }

  return (
    <div className="space-y-6 pb-4">
      {settings && !reminderDismissed && (
        <BackupReminder
          lastBackupAt={settings.lastBackupAt}
          dismissedAt={settings.backupReminderDismissedAt}
          onDismiss={() => setReminderDismissed(true)}
        />
      )}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <PeriodSelector preset={preset} custom={custom} onPresetChange={setPreset} onCustomChange={setCustom} />
        <Link to="/fis-ekle" className="btn-primary hidden md:inline-flex">
          <IconPlus width={18} height={18} />
          Yeni Fiş
        </Link>
      </div>

      {currentReceipts.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">Bu dönemde fiş bulunamadı</div>
          <p className="max-w-sm text-sm text-slate-400">
            Seçili tarih aralığında henüz kayıtlı fiş yok. Yeni bir fiş ekleyerek başlayabilirsiniz.
          </p>
          <Link to="/fis-ekle" className="btn-primary mt-2">
            <IconPlus width={18} height={18} />
            İlk Fişi Ekle
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <StatCard label="Toplam Harcama" value={formatCurrency(summary.genelToplam)} accent="brand" />
            <StatCard label="KDV Hariç Toplam" value={formatCurrency(summary.kdvHaric)} />
            <StatCard label="Toplam KDV" value={formatCurrency(summary.toplamKdv)} accent="violet" />
            <StatCard label="Fiş Sayısı" value={summary.fisSayisi.toLocaleString('tr-TR')} accent="emerald" />
            <StatCard label="%1 KDV" value={formatCurrency(summary.kdv1Tutar)} size="sm" />
            <StatCard label="%10 KDV" value={formatCurrency(summary.kdv10Tutar)} size="sm" />
            <StatCard label="%20 KDV" value={formatCurrency(summary.kdv20Tutar)} size="sm" />
            <StatCard label="Ortalama Fiş Tutarı" value={formatCurrency(summary.ortalamaFis)} size="sm" accent="amber" />
          </div>

          <section>
            <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Geçen Yıl Aynı Dönem Karşılaştırması</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ComparisonBlock
                currentLabel={currentLabel}
                previousLabel={previousLabel}
                currentValue={comparison.current.genelToplam}
                previousValue={comparison.previous.genelToplam}
                diff={comparison.diff.genelToplam}
                diffPct={comparison.diff.genelToplamPct}
              />
              <ComparisonBlock
                currentLabel={`${currentLabel} · KDV`}
                previousLabel={`${previousLabel} · KDV`}
                currentValue={comparison.current.toplamKdv}
                previousValue={comparison.previous.toplamKdv}
                diff={comparison.diff.toplamKdv}
                diffPct={comparison.diff.toplamKdvPct}
              />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MiniDiff label="%1 KDV Farkı" value={comparison.diff.kdv1Tutar} />
              <MiniDiff label="%10 KDV Farkı" value={comparison.diff.kdv10Tutar} />
              <MiniDiff label="%20 KDV Farkı" value={comparison.diff.kdv20Tutar} />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card p-4 md:p-5 lg:col-span-2">
              <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Son 12 Ay Harcama Trendi</h2>
              <TrendChart data={trendData} />
            </div>
            <div className="card p-4 md:p-5">
              <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Ödeme Yöntemi Dağılımı</h2>
              <PaymentMethodChart data={paymentGroups} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MiniDiff({ label, value }: { label: string; value: number }) {
  const positive = value > 0
  const neutral = value === 0
  return (
    <div className="card flex items-center justify-between px-4 py-3">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`text-sm font-semibold ${
          neutral ? 'text-slate-400' : positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        {positive ? '+' : ''}
        {formatCurrency(value)}
      </span>
    </div>
  )
}

function periodLabel(preset: PeriodPreset, range: DateRange, isPrevYear = false): string {
  if (preset === 'thisMonth' || preset === 'lastMonth') {
    const d = new Date(range.start)
    return monthLabelTR(d.getFullYear(), d.getMonth())
  }
  if (preset === 'thisYear' || preset === 'lastYear') {
    return String(new Date(range.start).getFullYear())
  }
  return isPrevYear ? `${range.start} - ${range.end} (geçen yıl)` : `${range.start} - ${range.end}`
}
