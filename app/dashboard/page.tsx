'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import StatsCards from './StatsCards'
import SupplierRiskChart from './SupplierRiskChart'
import OrderStatusChart from './OrderStatusChart'
import InventoryAlerts from './InventoryAlerts'

type DashboardData = {
  stats: {
    totalAmount: number
    supplierCount: number
    productCount: number
    orderCount: number
    lowStockCount: number
  }
  charts: {
    ordersByStatus: Record<string, number>
    ordersByRisk: Record<string, number>
  }
  orderTableId?: string
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('加载仪表盘数据失败:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">加载数据失败</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">数据仪表盘</h1>
              <p className="text-gray-600 mt-2">供应链业务数据概览和分析</p>
            </div>
            <Link
              href="/tables"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              查看所有表格
            </Link>
          </div>
        </div>

        {/* 统计卡片 */}
        <StatsCards
          totalAmount={data.stats.totalAmount}
          supplierCount={data.stats.supplierCount}
          productCount={data.stats.productCount}
          orderCount={data.stats.orderCount}
          lowStockCount={data.stats.lowStockCount}
        />

        {/* 图表区域 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <SupplierRiskChart data={data.charts.ordersByRisk} />
          <OrderStatusChart data={data.charts.ordersByStatus} />
        </div>

        {/* 库存预警 */}
        <InventoryAlerts />

        {/* 快捷操作 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">快捷操作</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/ai-demo"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
            >
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold text-gray-900 mb-1">AI功能演示</h3>
              <p className="text-sm text-gray-600">体验智能风险评级和订单摘要生成</p>
            </Link>

            <Link
              href="/setup"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
            >
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold text-gray-900 mb-1">数据初始化</h3>
              <p className="text-sm text-gray-600">初始化或重置供应链示例数据</p>
            </Link>

            {data.orderTableId && (
              <Link
                href={`/tables/${data.orderTableId}`}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
              >
                <div className="text-2xl mb-2">📋</div>
                <h3 className="font-semibold text-gray-900 mb-1">采购订单</h3>
                <p className="text-sm text-gray-600">查看和管理采购订单详情</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
