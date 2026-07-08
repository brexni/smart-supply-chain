import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { evaluateFormulasForRecords } from '@/lib/formula-engine'
import StatsCards from './StatsCards'
import SupplierRiskChart from './SupplierRiskChart'
import OrderStatusChart from './OrderStatusChart'
import InventoryAlerts from './InventoryAlerts'

// 设置为动态渲染
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // 获取所有表
  const tables = await prisma.table.findMany({
    include: {
      fields: { orderBy: { order: 'asc' } },
      records: true
    }
  })

  // 查找业务表
  const supplierTable = tables.find((t) => t.name === '供应商表')
  const productTable = tables.find((t) => t.name === '商品表')
  const orderTable = tables.find((t) => t.name === '采购订单表')

  // 处理采购订单数据
  let totalAmount = 0
  let ordersByStatus: Record<string, number> = {}
  let ordersByRisk: Record<string, number> = { 低风险: 0, 中风险: 0, 高风险: 0 }

  if (orderTable) {
    const fields = orderTable.fields.map((f) => ({
      ...f,
      config: JSON.parse(f.config)
    }))

    const records = orderTable.records.map((r) => ({
      ...r,
      data: JSON.parse(r.data)
    }))

    // 计算公式字段
    const recordsWithFormulas = evaluateFormulasForRecords(records, fields)

    const amountField = fields.find((f) => f.name.includes('总金额'))
    const statusField = fields.find((f) => f.name.includes('状态'))

    for (const record of recordsWithFormulas) {
      // 统计总金额
      if (amountField && record.data[amountField.id]) {
        totalAmount += Number(record.data[amountField.id]) || 0
      }

      // 统计订单状态
      if (statusField) {
        const status = record.data[statusField.id] || '未知'
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1
      }
    }
  }

  // 处理供应商风险分布
  if (supplierTable) {
    const fields = supplierTable.fields.map((f) => ({
      ...f,
      config: JSON.parse(f.config)
    }))

    const riskField = fields.find((f) => f.name.includes('风险'))

    if (riskField) {
      for (const record of supplierTable.records) {
        const data = JSON.parse(record.data)
        const risk = data[riskField.id] || '未知'
        if (ordersByRisk.hasOwnProperty(risk)) {
          ordersByRisk[risk]++
        }
      }
    }
  }

  // 检查库存预警
  let lowStockCount = 0
  if (productTable) {
    const fields = productTable.fields.map((f) => ({
      ...f,
      config: JSON.parse(f.config)
    }))

    const safetyStockField = fields.find((f) => f.name.includes('安全库存'))
    const currentStockField = fields.find((f) => f.name.includes('当前库存'))

    if (safetyStockField && currentStockField) {
      for (const record of productTable.records) {
        const data = JSON.parse(record.data)
        const current = data[currentStockField.id] || 0
        const safety = data[safetyStockField.id] || 0
        if (current < safety) {
          lowStockCount++
        }
      }
    }
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
          totalAmount={totalAmount}
          supplierCount={supplierTable?.records.length || 0}
          productCount={productTable?.records.length || 0}
          orderCount={orderTable?.records.length || 0}
          lowStockCount={lowStockCount}
        />

        {/* 图表区域 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <SupplierRiskChart data={ordersByRisk} />
          <OrderStatusChart data={ordersByStatus} />
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

            {orderTable && (
              <Link
                href={`/tables/${orderTable.id}`}
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
