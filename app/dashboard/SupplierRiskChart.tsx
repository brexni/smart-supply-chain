'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const COLORS = {
  低风险: '#10b981',
  中风险: '#f59e0b',
  高风险: '#ef4444'
}

export default function SupplierRiskChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">供应商风险分布</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">暂无数据</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">供应商风险分布</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        {chartData.map((item) => (
          <div key={item.name} className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold" style={{ color: COLORS[item.name as keyof typeof COLORS] }}>
              {item.value}
            </div>
            <div className="text-sm text-gray-600">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
