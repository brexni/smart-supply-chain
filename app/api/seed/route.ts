import { NextResponse } from 'next/server'
import { seedSupplyChainData } from '@/lib/seed-data'
import { prisma } from '@/lib/prisma'

/**
 * 初始化供应链业务数据
 */
export async function POST() {
  try {
    // 检查是否已经初始化过
    const existingTables = await prisma.table.findMany({
      where: {
        name: {
          in: ['供应商表', '商品表', '采购订单表']
        }
      }
    })

    if (existingTables.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: '业务数据已存在,请先删除现有表',
          existingTables: existingTables.map((t) => t.name)
        },
        { status: 400 }
      )
    }

    // 执行数据初始化
    const result = await seedSupplyChainData()

    return NextResponse.json({
      success: true,
      message: '供应链业务数据初始化成功',
      data: {
        supplierTableId: result.supplierTable.id,
        productTableId: result.productTable.id,
        orderTableId: result.orderTable.id,
        counts: {
          suppliers: result.supplierRecords.length,
          products: result.productRecords.length,
          orders: result.orderRecords.length
        }
      }
    })
  } catch (error) {
    console.error('初始化失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '初始化失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * 清除所有数据 (用于重新初始化)
 */
export async function DELETE() {
  try {
    await prisma.record.deleteMany({})
    await prisma.field.deleteMany({})
    await prisma.table.deleteMany({})

    return NextResponse.json({
      success: true,
      message: '所有数据已清除'
    })
  } catch (error) {
    console.error('清除数据失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '清除数据失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
