import type { Receipt } from '../../types'
import { formatCurrency } from '../../utils/currency'
import { groupReceiptsBy } from '../../services/analyticsService'

interface CompanyComparisonTableProps {
  currentReceipts: Receipt[]
  previousReceipts: Receipt[]
  currentLabel: string
  previousLabel: string
}

export function CompanyComparisonTable({ currentReceipts, previousReceipts, currentLabel, previousLabel }: CompanyComparisonTableProps) {
  const currentGroups = groupReceiptsBy(currentReceipts, (r) => r.firmaAdi)
  const previousGroups = groupReceiptsBy(previousReceipts, (r) => r.firmaAdi)

  const companies = Array.from(new Set([...currentGroups.map((g) => g.key), ...previousGroups.map((g) => g.key)])).sort((a, b) =>
    a.localeCompare(b, 'tr')
  )

  const rows = companies
    .map((company) => {
      const cur = currentGroups.find((g) => g.key === company)?.totals.genelToplam ?? 0
      const prev = previousGroups.find((g) => g.key === company)?.totals.genelToplam ?? 0
      const diff = cur - prev
      const pct = prev === 0 ? (cur === 0 ? 0 : null) : (diff / prev) * 100
      return { company, cur, prev, diff, pct }
    })
    .sort((a, b) => b.cur - a.cur)

  if (rows.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-400">Karşılaştırılacak veri yok</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
            <th className="px-3 py-2.5 font-medium">Firma</th>
            <th className="px-3 py-2.5 text-right font-medium">{previousLabel}</th>
            <th className="px-3 py-2.5 text-right font-medium">{currentLabel}</th>
            <th className="px-3 py-2.5 text-right font-medium">Fark</th>
            <th className="px-3 py-2.5 text-right font-medium">Değişim %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.company} className="border-b border-slate-50 dark:border-slate-800/60">
              <td className="px-3 py-2.5 font-medium text-slate-700 dark:text-slate-200">{row.company}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400">{formatCurrency(row.prev)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-200">{formatCurrency(row.cur)}</td>
              <td
                className={`px-3 py-2.5 text-right font-medium tabular-nums ${
                  row.diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.diff < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'
                }`}
              >
                {row.diff > 0 ? '+' : ''}
                {formatCurrency(row.diff)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-slate-500 dark:text-slate-400">
                {row.pct === null ? '-' : `${row.pct > 0 ? '+' : ''}${row.pct.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
