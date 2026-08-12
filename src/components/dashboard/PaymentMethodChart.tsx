import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/currency'
import type { GroupedTotal } from '../../services/analyticsService'

const COLORS = ['#3390fb', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#64748b']

export function PaymentMethodChart({ data }: { data: GroupedTotal[] }) {
  const chartData = data.map((d) => ({ name: d.key, value: d.totals.genelToplam }))

  if (chartData.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-400">Bu dönemde veri yok</div>
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-slate-500 dark:text-slate-400">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
