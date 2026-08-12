import { formatCurrency } from '../../utils/currency'
import { IconArrowDown, IconArrowUp } from '../ui/icons'

interface ComparisonBlockProps {
  currentLabel: string
  previousLabel: string
  currentValue: number
  previousValue: number
  diff: number
  diffPct: number | null
}

export function ComparisonBlock({ currentLabel, previousLabel, currentValue, previousValue, diff, diffPct }: ComparisonBlockProps) {
  const positive = diff > 0
  const neutral = diff === 0

  return (
    <div className="card p-4 md:p-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{currentLabel}</div>
          <div className="mt-1.5 text-xl font-bold text-slate-900 md:text-2xl dark:text-white">{formatCurrency(currentValue)}</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{previousLabel}</div>
          <div className="mt-1.5 text-xl font-bold text-slate-500 md:text-2xl dark:text-slate-400">{formatCurrency(previousValue)}</div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
            neutral
              ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              : positive
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
          }`}
        >
          {!neutral && (positive ? <IconArrowUp width={14} height={14} /> : <IconArrowDown width={14} height={14} />)}
          {positive ? '+' : ''}
          {formatCurrency(diff)}
        </span>
        {diffPct !== null && (
          <span className="text-sm font-medium text-slate-400">
            ({diffPct > 0 ? '+' : ''}
            {diffPct.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%)
          </span>
        )}
      </div>
    </div>
  )
}
