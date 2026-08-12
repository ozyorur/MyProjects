import type { DateRange, PeriodPreset } from '../../types'
import { periodPresetLabels } from '../../utils/date'

interface PeriodSelectorProps {
  preset: PeriodPreset
  custom: DateRange
  onPresetChange: (preset: PeriodPreset) => void
  onCustomChange: (range: DateRange) => void
}

const presets: PeriodPreset[] = ['thisMonth', 'lastMonth', 'thisYear', 'lastYear', 'custom']

export function PeriodSelector({ preset, custom, onPresetChange, onCustomChange }: PeriodSelectorProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onPresetChange(p)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              preset === p
                ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-brand-300'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {periodPresetLabels[p]}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input !py-2 text-sm"
            value={custom.start}
            onChange={(e) => onCustomChange({ ...custom, start: e.target.value })}
          />
          <span className="text-slate-400">-</span>
          <input
            type="date"
            className="input !py-2 text-sm"
            value={custom.end}
            onChange={(e) => onCustomChange({ ...custom, end: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
