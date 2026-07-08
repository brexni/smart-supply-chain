import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateInventoryAlert, generatePurchaseRecommendation } from '@/lib/ai-mock'

/**
 * 库存预警检查API
 * 自动检查库存并生成采购建议
 */
export async function GET() {
  try {
    // 查找商品表
    const productTable = await prisma.table.findFirst({
      where: { name: '商品表' },
      include: {
        fields: { orderBy: { order: 'asc' } },
        records: true
      }
    })

    if (!productTable) {
      return NextResponse.json(
        {
          success: false,
          error: '未找到商品表'
        },
        { status: 404 }
      )
    }

    // 解析字段
    const fields = productTable.fields.map((f) => ({
      ...f,
      config: JSON.parse(f.config)
    }))

    const skuField = fields.find((f) => f.name.includes('SKU') || f.name.includes('编码'))
    const nameField = fields.find((f) => f.name.includes('名称'))
    const safetyStockField = fields.find((f) => f.name.includes('安全库存'))
    const currentStockField = fields.find((f) => f.name.includes('当前库存'))

    if (!safetyStockField || !currentStockField) {
      return NextResponse.json(
        {
          success: false,
          error: '商品表缺少必要字段(安全库存/当前库存)'
        },
        { status: 400 }
      )
    }

    // 检查每个商品的库存
    const alerts = []
    const recommendations = []

    for (const record of productTable.records) {
      const data = JSON.parse(record.data)
      const currentStock = data[currentStockField.id] || 0
      const safetyStock = data[safetyStockField.id] || 0
      const productName = nameField ? data[nameField.id] : '未知商品'
      const sku = skuField ? data[skuField.id] : ''

      // 如果低于安全库存,生成预警
      if (currentStock < safetyStock) {
        const alert = generateInventoryAlert({
          name: productName,
          currentStock,
          safetyStock,
          sku
        })

        const recommendation = generatePurchaseRecommendation({
          productName,
          currentStock,
          safetyStock,
          avgConsumption: 10,
          leadTime: 7
        })

        alerts.push({
          recordId: record.id,
          productName,
          sku,
          currentStock,
          safetyStock,
          deficit: safetyStock - currentStock,
          ...alert
        })

        recommendations.push({
          recordId: record.id,
          productName,
          ...recommendation
        })
      }
    }

    // 如果有预警,可以自动创建采购申请(可选)
    // 这里只返回预警信息,不自动创建订单

    return NextResponse.json({
      success: true,
      data: {
        checkedCount: productTable.records.length,
        alertCount: alerts.length,
        alerts,
        recommendations,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('库存检查失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '库存检查失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * 自动创建采购订单
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, quantity, supplierId } = body

    // 查找采购订单表
    const orderTable = await prisma.table.findFirst({
      where: { name: '采购订单表' },
      include: {
        fields: { orderBy: { order: 'asc' } }
      }
    })

    if (!orderTable) {
      return NextResponse.json(
        {
          success: false,
          error: '未找到采购订单表'
        },
        { status: 404 }
      )
    }

    // 解析字段
    const fields = orderTable.fields.map((f) => ({
      ...f,
      config: JSON.parse(f.config)
    }))

    const supplierLinkField = fields.find((f) => f.name.includes('供应商') && f.type === 'link')
    const productLinkField = fields.find((f) => f.name.includes('商品') && f.type === 'link')
    const quantityField = fields.find((f) => f.name.includes('数量') && f.type === 'number')
    const statusField = fields.find((f) => f.name.includes('状态') && f.type === 'select')

    if (!supplierLinkField || !productLinkField || !quantityField) {
      return NextResponse.json(
        {
          success: false,
          error: '采购订单表结构不完整'
        },
        { status: 400 }
      )
    }

    // 创建采购订单记录
    const orderData: any = {}
    orderData[supplierLinkField.id] = supplierId ? [supplierId] : []
    orderData[productLinkField.id] = [productId]
    orderData[quantityField.id] = quantity
    if (statusField) {
      orderData[statusField.id] = '待审批'
    }

    const order = await prisma.record.create({
      data: {
        tableId: orderTable.id,
        data: JSON.stringify(orderData)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        message: '采购订单创建成功'
      }
    })
  } catch (error) {
    console.error('创建采购订单失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '创建采购订单失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
