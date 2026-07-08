import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { evaluateFormulasForRecords } from '@/lib/formula-engine'
import { resolveLinkFields } from '@/lib/link-resolver'

export const dynamic = 'force-dynamic'

const CACHE_TIME = 10

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    // 使用分步查询避免 DISTINCT 和 ORDER BY 冲突
    const table = await prisma.table.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!table) {
      return NextResponse.json({ error: '表格不存在' }, { status: 404 })
    }

    // 并行查询字段和记录
    const [fields, records] = await Promise.all([
      prisma.field.findMany({
        where: { tableId: id },
        select: {
          id: true,
          name: true,
          type: true,
          config: true,
          order: true
        },
        orderBy: { order: 'asc' }
      }),
      prisma.record.findMany({
        where: { tableId: id },
        select: {
          id: true,
          data: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    // 解析 JSON 配置和数据
    const fieldsWithConfig = fields.map((f: any) => ({
      ...f,
      config: typeof f.config === 'string' ? JSON.parse(f.config) : f.config
    }))

    const recordsWithParsedData = records.map((r: any) => ({
      ...r,
      data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data
    }))

    // 计算公式字段
    const recordsWithFormulas = evaluateFormulasForRecords(recordsWithParsedData, fieldsWithConfig)

    // 解析关联字段
    const resolvedRecords = await resolveLinkFields(recordsWithFormulas, fieldsWithConfig)

    const formattedTable = {
      id: table.id,
      name: table.name,
      description: table.description,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
      fields: fieldsWithConfig,
      records: resolvedRecords
    }

    return NextResponse.json(formattedTable, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_TIME}, stale-while-revalidate=${CACHE_TIME * 2}`
      }
    })
  } catch (error) {
    console.error('获取表格失败:', error)
    return NextResponse.json({ error: '获取数据失败' }, { status: 500 })
  }
}
