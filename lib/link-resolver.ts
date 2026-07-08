// 关联字段解析器
import { prisma } from './prisma'
import { RecordData, FieldConfig } from './types'

interface Field {
  id: string
  name: string
  type: string
  config: FieldConfig
}

interface RecordWithData {
  id: string
  data: RecordData
  [key: string]: any
}

/**
 * 解析单个记录的关联字段
 */
export async function resolveLinkFieldsForRecord(record: RecordWithData, fields: Field[]): Promise<RecordWithData> {
  const linkFields = fields.filter((f) => f.type === 'link')

  if (linkFields.length === 0) {
    return record
  }

  const resolvedData = { ...record.data }

  for (const field of linkFields) {
    const linkedTableId = field.config.linkedTableId
    if (!linkedTableId) continue

    const linkedRecordIds = record.data[field.id]
    if (!linkedRecordIds || (Array.isArray(linkedRecordIds) && linkedRecordIds.length === 0)) {
      resolvedData[field.id] = []
      continue
    }

    // 确保是数组格式
    const ids = Array.isArray(linkedRecordIds) ? linkedRecordIds : [linkedRecordIds]

    try {
      // 查询关联的记录
      const linkedRecords = await prisma.record.findMany({
        where: {
          id: { in: ids },
          tableId: linkedTableId
        },
        include: {
          table: {
            include: {
              fields: true
            }
          }
        }
      })

      // 解析关联记录的数据
      const resolvedLinkedRecords = linkedRecords.map((lr) => {
        const data = JSON.parse(lr.data as string) as RecordData
        const fields = lr.table.fields.map((f) => ({
          ...f,
          config: JSON.parse(f.config as string)
        }))

        // 获取显示标题 (优先使用第一个text字段,否则用ID)
        const titleField = fields.find((f) => f.type === 'text')
        const displayTitle = titleField ? data[titleField.id] : lr.id

        return {
          id: lr.id,
          title: displayTitle || `记录 ${lr.id.slice(0, 8)}`,
          data
        }
      })

      resolvedData[field.id] = resolvedLinkedRecords
    } catch (error) {
      console.error(`解析关联字段失败 (${field.name}):`, error)
      resolvedData[field.id] = []
    }
  }

  return {
    ...record,
    data: resolvedData
  }
}

/**
 * 批量解析多个记录的关联字段
 */
export async function resolveLinkFields(records: RecordWithData[], fields: Field[]): Promise<RecordWithData[]> {
  const linkFields = fields.filter((f) => f.type === 'link')

  if (linkFields.length === 0) {
    return records
  }

  // 收集所有需要查询的关联记录ID
  const linkFieldMap = new Map<string, Set<string>>() // fieldId -> Set of recordIds

  for (const field of linkFields) {
    const linkedTableId = field.config.linkedTableId
    if (!linkedTableId) continue

    const recordIds = new Set<string>()

    for (const record of records) {
      const linkedIds = record.data[field.id]
      if (linkedIds) {
        const ids = Array.isArray(linkedIds) ? linkedIds : [linkedIds]
        ids.forEach((id) => recordIds.add(id))
      }
    }

    if (recordIds.size > 0) {
      linkFieldMap.set(field.id, recordIds)
    }
  }

  // 批量查询所有关联记录
  const linkedRecordsCache = new Map<string, any>() // recordId -> record data

  for (const [fieldId, recordIds] of linkFieldMap) {
    const field = linkFields.find((f) => f.id === fieldId)
    if (!field) continue

    const linkedTableId = field.config.linkedTableId
    if (!linkedTableId) continue

    try {
      const linkedRecords = await prisma.record.findMany({
        where: {
          id: { in: Array.from(recordIds) },
          tableId: linkedTableId
        },
        include: {
          table: {
            include: {
              fields: true
            }
          }
        }
      })

      // 缓存解析后的数据
      for (const lr of linkedRecords) {
        const data = JSON.parse(lr.data as string) as RecordData
        const fields = lr.table.fields.map((f) => ({
          ...f,
          config: JSON.parse(f.config as string)
        }))

        const titleField = fields.find((f) => f.type === 'text')
        const displayTitle = titleField ? data[titleField.id] : lr.id

        linkedRecordsCache.set(lr.id, {
          id: lr.id,
          title: displayTitle || `记录 ${lr.id.slice(0, 8)}`,
          data,
          tableId: lr.tableId,
          tableName: lr.table.name
        })
      }
    } catch (error) {
      console.error(`批量查询关联记录失败 (字段: ${field.name}):`, error)
    }
  }

  // 为每条记录解析关联数据
  return records.map((record) => {
    const resolvedData = { ...record.data }

    for (const field of linkFields) {
      const linkedIds = record.data[field.id]
      if (!linkedIds) {
        resolvedData[field.id] = []
        continue
      }

      const ids = Array.isArray(linkedIds) ? linkedIds : [linkedIds]
      const resolvedLinks = ids.map((id) => linkedRecordsCache.get(id)).filter(Boolean)

      resolvedData[field.id] = resolvedLinks
    }

    return {
      ...record,
      data: resolvedData
    }
  })
}

/**
 * 获取表的可关联记录列表 (用于选择器)
 */
export async function getLinkableRecords(tableId: string) {
  try {
    const records = await prisma.record.findMany({
      where: { tableId },
      include: {
        table: {
          include: {
            fields: {
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      take: 100 // 限制数量
    })

    return records.map((record) => {
      const data = JSON.parse(record.data as string) as RecordData
      const fields = record.table.fields.map((f) => ({
        ...f,
        config: JSON.parse(f.config as string)
      }))

      // 获取显示标题
      const titleField = fields.find((f) => f.type === 'text')
      const displayTitle = titleField ? data[titleField.id] : record.id

      return {
        id: record.id,
        title: displayTitle || `记录 ${record.id.slice(0, 8)}`,
        data
      }
    })
  } catch (error) {
    console.error('获取可关联记录失败:', error)
    return []
  }
}
