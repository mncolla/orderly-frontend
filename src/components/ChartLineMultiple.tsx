import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { OverviewDailyData } from "@/types/overview"

interface ChartLineMultipleProps {
  data: OverviewDailyData[]
  period?: { start: string; end: string }
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#22c55e",
  },
  orders: {
    label: "Orders",
    color: "#3b82f6",
  },
} as const

export function ChartLineMultiple({ data, period }: ChartLineMultipleProps) {
  // Format data for chart
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    revenue: item.revenue,
    orders: item.orders,
  }))

  const formatPeriod = () => {
    if (!period) return ""
    const start = new Date(period.start).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    const end = new Date(period.end).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    return `${start} - ${end}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Revenue &amp; Orders</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{formatPeriod()}</p>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs text-gray-500 dark:text-gray-400"
            />
            <YAxis
              yAxisId="revenue"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs text-gray-500 dark:text-gray-400"
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs text-gray-500 dark:text-gray-400"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {payload[0]?.payload.date}
                      </p>
                      {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: {entry.name === 'revenue' ? `$${entry.value?.toLocaleString()}` : entry.value}
                        </p>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Line
              yAxisId="revenue"
              dataKey="revenue"
              type="monotone"
              stroke={chartConfig.revenue.color}
              strokeWidth={2}
              dot={false}
              name="Revenue"
            />
            <Line
              yAxisId="orders"
              dataKey="orders"
              type="monotone"
              stroke={chartConfig.orders.color}
              strokeWidth={2}
              dot={false}
              name="Orders"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
