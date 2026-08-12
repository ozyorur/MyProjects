import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/currency'

const COLORS = ['#3390fb', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#64748b', '#ec4899', '#0ea5e9', '#84cc16']

export function DistributionPie({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-slate-400">Veri yok</div>
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={82} paddingAngle={2}>
            {data.map((_, i) => (
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
