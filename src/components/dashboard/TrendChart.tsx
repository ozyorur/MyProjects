import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '../../utils/currency'
import { useTheme } from '../../hooks/useTheme'

interface TrendChartProps {
  data: { label: string; toplam: number; kdv: number }[]
}

export function TrendChart({ data }: TrendChartProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const gridColor = isDark ? '#1e293b' : '#e2e8f0'
  const textColor = isDark ? '#94a3b8' : '#64748b'

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: textColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}b` : String(v))}
          />
          <Tooltip
            formatter={(value: any, name: any) => [formatCurrency(Number(value)), name === 'toplam' ? 'Toplam' : 'KDV']}
            contentStyle={{
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              background: isDark ? '#0f172a' : '#ffffff',
              color: isDark ? '#e2e8f0' : '#0f172a',
              fontSize: 13,
            }}
          />
          <Bar dataKey="toplam" fill="#3390fb" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
