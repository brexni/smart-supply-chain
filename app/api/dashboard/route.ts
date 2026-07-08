import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const CACHE_TIME = 10

export async function GET() {
  try {
    // 使用 Prisma ORM 并行查询,避免 SQL 语法问题
    const [supplierTable, productTable, orderTable] = await Promise.all([
      prisma.table.findFirst({
        where: { name: '供应商表' },
        select: {
          id: true,
          name: true,
          fields: {
            select: {
              id: true,
              name: true,
              type: true,
              config: true
            },
            orderBy: { order: 'asc' }
          },
          records: {
            select: {
              id: true,
              data: true
            }
          }
        }
      }),
      prisma.table.findFirst({
        where: { name: '商品表' },
        select: {
          id: true,
          name: true,
          fields: {
            select: {
              id: true,
              name: true,
              type: true,
              config: true
            },
            orderBy: { order: 'asc' }
          },
          records: {
            select: {
              id: true,
              data: true
            }
          }
        }
      }),
      prisma.table.findFirst({
        where: { name: '采购订单表' },
        select: {
          id: true,
          name: true,
          fields: {
            select: {
              id: true,
              name: true,
              type: true,
              config: true
            },
            orderBy: { order: 'asc' }
          },
          records: {
            select: {
              id: true,
              data: true
            }
          }
        }
      })
    ])

    // 处理采购订单数据
    let totalAmount = 0
    const ordersByStatus: Record<string, number> = {}
    const ordersByRisk: Record<string, number> = { 低风险: 0, 中风险: 0, 高风险: 0 }

    if (orderTable) {
      const fields = orderTable.fields.map((f) => ({
        ...f,
        config: typeof f.config === 'string' ? JSON.parse(f.config) : f.config
      }))

      const amountField = fields.find((f) => f.name.includes('总金额'))
      const statusField = fields.find((f) => f.name.includes('状态'))

      for (const record of orderTable.records) {
        const data = typeof record.data === 'string' ? JSON.parse(record.data) : record.data

        if (amountField && data[amountField.id]) {
          totalAmount += Number(data[amountField.id]) || 0
        }

        if (statusField) {
          const status = data[statusField.id] || '未知'
          ordersByStatus[status] = (ordersByStatus[status] || 0) + 1
        }
      }
    }

    // 处理供应商风险分布
    if (supplierTable) {
      const fields = supplierTable.fields.map((f) => ({
        ...f,
        config: typeof f.config === 'string' ? JSON.parse(f.config) : f.config
      }))

      const riskField = fields.find((f) => f.name.includes('风险'))

      if (riskField) {
        for (const record of supplierTable.records) {
          const data = typeof record.data === 'string' ? JSON.parse(record.data) : record.data
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
        config: typeof f.config === 'string' ? JSON.parse(f.config) : f.config
      }))

      const safetyStockField = fields.find((f) => f.name.includes('安全库存'))
      const currentStockField = fields.find((f) => f.name.includes('当前库存'))

      if (safetyStockField && currentStockField) {
        for (const record of productTable.records) {
          const data = typeof record.data === 'string' ? JSON.parse(record.data) : record.data
          const current = data[currentStockField.id] || 0
          const safety = data[safetyStockField.id] || 0
          if (current < safety) {
            lowStockCount++
          }
        }
      }
    }

    return NextResponse.json(
      {
        stats: {
          totalAmount,
          supplierCount: supplierTable?.records.length || 0,
          productCount: productTable?.records.length || 0,
          orderCount: orderTable?.records.length || 0,
          lowStockCount
        },
        charts: {
          ordersByStatus,
          ordersByRisk
        },
        orderTableId: orderTable?.id
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_TIME}, stale-while-revalidate=${CACHE_TIME * 2}`
        }
      }
    )
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
  }
}
