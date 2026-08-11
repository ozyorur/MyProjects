import type { Receipt } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { sumVatTotals, totalsFromReceipt } from '../../utils/vat'
import { filterReceiptsByRange } from '../../services/analyticsService'

interface VatMonthlyTableProps {
  receipts: Receipt[]
  months: { year: number; month: number; label: string }[]
}

export function VatMonthlyTable({ receipts, months }: VatMonthlyTableProps) {
  const rows = months.map(({ year, month, label }) => {
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10)
    const monthReceipts = filterReceiptsByRange(receipts, { start, end })
    const totals = sumVatTotals(monthReceipts.map(totalsFromReceipt))
    return { label, totals }
  })

  const grandTotal = sumVatTotals(rows.map((r) => r.totals))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
            <th className="px-3 py-2.5 font-medium">Dönem</th>
            <th className="px-3 py-2.5 text-right font-medium">KDV Hariç</th>
            <th className="px-3 py-2.5 text-right font-medium">%1 KDV</th>
            <th className="px-3 py-2.5 text-right font-medium">%10 KDV</th>
            <th className="px-3 py-2.5 text-right font-medium">%20 KDV</th>
            <th className="px-3 py-2.5 text-right font-medium">Toplam KDV</th>
            <th className="px-3 py-2.5 text-right font-medium">KDV Dahil Toplam</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-50 dark:border-slate-800/60">
              <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{row.label}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">{formatCurrency(row.totals.kdvHaric)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400">{formatCurrency(row.totals.kdv1Tutar)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400">{formatCurrency(row.totals.kdv10Tutar)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400">{formatCurrency(row.totals.kdv20Tutar)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">{formatCurrency(row.totals.toplamKdv)}</td>
              <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(row.totals.genelToplam)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100">Toplam</td>
            <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatCurrency(grandTotal.kdvHaric)}</td>
            <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatCurrency(grandTotal.kdv1Tutar)}</td>
            <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatCurrency(grandTotal.kdv10Tutar)}</td>
            <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatCurrency(grandTotal.kdv20Tutar)}</td>
            <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-800 dark:text-slate-100">{formatCurrency(grandTotal.toplamKdv)}</td>
            <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-900 dark:text-white">{formatCurrency(grandTotal.genelToplam)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
