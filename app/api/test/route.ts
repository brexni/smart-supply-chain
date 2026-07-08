import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 测试API - 验证数据库连接和基本操作
 */
export async function GET() {
  try {
    // 测试数据库连接
    const tableCount = await prisma.table.count()

    return NextResponse.json({
      success: true,
      message: '数据库连接成功',
      data: {
        tableCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('数据库连接失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '数据库连接失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
