import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  sublabel?: string
  accent?: 'default' | 'brand' | 'emerald' | 'amber' | 'violet' | 'rose'
  icon?: ReactNode
  size?: 'md' | 'sm'
}

const accentClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'text-slate-900 dark:text-white',
  brand: 'text-brand-600 dark:text-brand-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  violet: 'text-violet-600 dark:text-violet-400',
  rose: 'text-rose-600 dark:text-rose-400',
}

export function StatCard({ label, value, sublabel, accent = 'default', icon, size = 'md' }: StatCardProps) {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
        {icon && <span className="text-slate-300 dark:text-slate-600">{icon}</span>}
      </div>
      <div className={`mt-2 font-bold tabular-nums ${size === 'md' ? 'text-2xl md:text-[28px]' : 'text-lg'} ${accentClasses[accent]}`}>
        {value}
      </div>
      {sublabel && <div className="mt-1 text-xs text-slate-400">{sublabel}</div>}
    </div>
  )
}
