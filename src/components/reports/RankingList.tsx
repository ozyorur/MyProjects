import { formatCurrency } from '../../utils/currency'
import type { GroupedTotal } from '../../services/analyticsService'

export function RankingList({ data, limit = 10 }: { data: GroupedTotal[]; limit?: number }) {
  const top = data.slice(0, limit)
  const max = top[0]?.totals.genelToplam || 1

  if (top.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-400">Veri yok</div>
  }

  return (
    <div className="space-y-3">
      {top.map((item) => (
        <div key={item.key}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.key}</span>
            <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
              {formatCurrency(item.totals.genelToplam)} <span className="text-slate-300 dark:text-slate-600">· {item.fisSayisi} fiş</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500"
              style={{ width: `${Math.max(3, (item.totals.genelToplam / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
