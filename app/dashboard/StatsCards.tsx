'use client'

export default function StatsCards({
  totalAmount,
  supplierCount,
  productCount,
  orderCount,
  lowStockCount
}: {
  totalAmount: number
  supplierCount: number
  productCount: number
  orderCount: number
  lowStockCount: number
}) {
  const stats = [
    {
      label: '采购总金额',
      value: `¥${totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
      icon: '💰',
      color: 'blue'
    },
    {
      label: '供应商数量',
      value: supplierCount,
      icon: '🏢',
      color: 'green'
    },
    {
      label: '商品种类',
      value: productCount,
      icon: '📦',
      color: 'purple'
    },
    {
      label: '采购订单',
      value: orderCount,
      icon: '📋',
      color: 'indigo'
    },
    {
      label: '库存预警',
      value: lowStockCount,
      icon: '⚠️',
      color: lowStockCount > 0 ? 'red' : 'gray'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{stat.icon}</span>
            <span className={`text-xs font-medium px-2 py-1 rounded bg-${stat.color}-100 text-${stat.color}-800`}>
              {stat.label}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
        </div>
      ))}
    </div>
  )
}
