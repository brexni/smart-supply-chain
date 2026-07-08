import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// 添加缓存头
const CACHE_TIME = 10 // 10秒缓存

export async function GET() {
  try {
    // 使用 Prisma ORM 优化查询
    const tables = await prisma.table.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        fields: {
          select: {
            id: true,
            name: true,
            type: true,
            order: true
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { records: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 格式化数据
    const formattedTables = tables.map((table) => ({
      id: table.id,
      name: table.name,
      description: table.description,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
      fields: table.fields,
      _count: {
        records: table._count.records
      }
    }))

    return NextResponse.json(formattedTables, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TIME}, stale-while-revalidate=${CACHE_TIME * 2}`
      }
    })
  } catch (error) {
    console.error('获取表格列表失败:', error)
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
  }
}
