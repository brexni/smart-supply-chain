'use server'

import { prisma } from '@/lib/prisma'
import { RecordData } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { resolveLinkFields } from '@/lib/link-resolver'
import { evaluateFormulasForRecords } from '@/lib/formula-engine'

/**
 * 创建记录
 */
export async function createRecord(tableId: string, data: RecordData) {
  try {
    const record = await prisma.record.create({
      data: {
        tableId,
        data: JSON.stringify(data)
      }
    })

    revalidatePath(`/tables/${tableId}`)
    return { success: true, data: record }
  } catch (error) {
    console.error('创建记录失败:', error)
    return { success: false, error: '创建记录失败' }
  }
}

/**
 * 批量创建记录
 */
export async function createRecords(tableId: string, records: RecordData[]) {
  try {
    const created = await prisma.record.createMany({
      data: records.map((data) => ({
        tableId,
        data: JSON.stringify(data)
      }))
    })

    revalidatePath(`/tables/${tableId}`)
    return { success: true, count: created.count }
  } catch (error) {
    console.error('批量创建记录失败:', error)
    return { success: false, error: '批量创建记录失败' }
  }
}

/**
 * 获取表的所有记录
 */
export async function getRecords(tableId: string) {
  try {
    const records = await prisma.record.findMany({
      where: { tableId },
      orderBy: { createdAt: 'desc' }
    })

    // 解析JSON数据
    const recordsWithParsedData = records.map((record) => ({
      ...record,
      data: JSON.parse(record.data) as RecordData
    }))

    // 获取字段定义
    const fields = await prisma.field.findMany({
      where: { tableId },
      orderBy: { order: 'asc' }
    })

    const fieldsWithConfig = fields.map((f) => ({
      ...f,
      config: JSON.parse(f.config)
    }))

    // 计算公式字段
    const recordsWithFormulas = evaluateFormulasForRecords(recordsWithParsedData, fieldsWithConfig)

    // 解析关联字段
    const resolvedRecords = await resolveLinkFields(recordsWithFormulas, fieldsWithConfig)

    return { success: true, data: resolvedRecords }
  } catch (error) {
    console.error('获取记录失败:', error)
    return { success: false, error: '获取记录失败' }
  }
}

/**
 * 获取单条记录
 */
export async function getRecordById(recordId: string) {
  try {
    const record = await prisma.record.findUnique({
      where: { id: recordId },
      include: {
        table: {
          include: {
            fields: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!record) {
      return { success: false, error: '记录不存在' }
    }

    // 解析JSON数据
    const recordWithParsedData = {
      ...record,
      data: JSON.parse(record.data) as RecordData,
      table: {
        ...record.table,
        fields: record.table.fields.map((field) => ({
          ...field,
          config: JSON.parse(field.config)
        }))
      }
    }

    return { success: true, data: recordWithParsedData }
  } catch (error) {
    console.error('获取记录失败:', error)
    return { success: false, error: '获取记录失败' }
  }
}

/**
 * 更新记录
 */
export async function updateRecord(recordId: string, data: RecordData) {
  try {
    // 先获取原记录以合并数据
    const existingRecord = await prisma.record.findUnique({
      where: { id: recordId }
    })

    if (!existingRecord) {
      return { success: false, error: '记录不存在' }
    }

    const existingData = JSON.parse(existingRecord.data) as RecordData
    const mergedData = { ...existingData, ...data }

    const record = await prisma.record.update({
      where: { id: recordId },
      data: {
        data: JSON.stringify(mergedData)
      }
    })

    revalidatePath(`/tables/${existingRecord.tableId}`)
    return { success: true, data: record }
  } catch (error) {
    console.error('更新记录失败:', error)
    return { success: false, error: '更新记录失败' }
  }
}

/**
 * 更新记录中的单个字段值
 */
export async function updateRecordField(recordId: string, fieldId: string, value: any) {
  try {
    const existingRecord = await prisma.record.findUnique({
      where: { id: recordId }
    })

    if (!existingRecord) {
      return { success: false, error: '记录不存在' }
    }

    const data = JSON.parse(existingRecord.data) as RecordData
    data[fieldId] = value

    const record = await prisma.record.update({
      where: { id: recordId },
      data: {
        data: JSON.stringify(data)
      }
    })

    revalidatePath(`/tables/${existingRecord.tableId}`)
    return { success: true, data: record }
  } catch (error) {
    console.error('更新字段失败:', error)
    return { success: false, error: '更新字段失败' }
  }
}

/**
 * 删除记录
 */
export async function deleteRecord(recordId: string) {
  try {
    const record = await prisma.record.findUnique({
      where: { id: recordId }
    })

    if (!record) {
      return { success: false, error: '记录不存在' }
    }

    await prisma.record.delete({
      where: { id: recordId }
    })

    revalidatePath(`/tables/${record.tableId}`)
    return { success: true }
  } catch (error) {
    console.error('删除记录失败:', error)
    return { success: false, error: '删除记录失败' }
  }
}

/**
 * 批量删除记录
 */
export async function deleteRecords(recordIds: string[]) {
  try {
    await prisma.record.deleteMany({
      where: {
        id: { in: recordIds }
      }
    })

    return { success: true }
  } catch (error) {
    console.error('批量删除记录失败:', error)
    return { success: false, error: '批量删除记录失败' }
  }
}

/**
 * 获取表的记录及其字段定义 (用于表格展示)
 */
export async function getTableWithRecords(tableId: string) {
  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        },
        records: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!table) {
      return { success: false, error: '表不存在' }
    }

    // 解析JSON数据
    const fieldsWithConfig = table.fields.map((field) => ({
      ...field,
      config: JSON.parse(field.config)
    }))

    const recordsWithParsedData = table.records.map((record) => ({
      ...record,
      data: JSON.parse(record.data) as RecordData
    }))

    // 计算公式字段
    const recordsWithFormulas = evaluateFormulasForRecords(recordsWithParsedData, fieldsWithConfig)

    // 解析关联字段
    const resolvedRecords = await resolveLinkFields(recordsWithFormulas, fieldsWithConfig)

    const tableWithParsedData = {
      ...table,
      fields: fieldsWithConfig,
      records: resolvedRecords
    }

    return { success: true, data: tableWithParsedData }
  } catch (error) {
    console.error('获取表数据失败:', error)
    return { success: false, error: '获取表数据失败' }
  }
}

/**
 * 搜索记录 (简单文本搜索)
 */
export async function searchRecords(tableId: string, searchTerm: string) {
  try {
    const records = await prisma.record.findMany({
      where: {
        tableId,
        // SQLite的LIKE搜索
        data: {
          contains: searchTerm
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const recordsWithParsedData = records.map((record) => ({
      ...record,
      data: JSON.parse(record.data) as RecordData
    }))

    return { success: true, data: recordsWithParsedData }
  } catch (error) {
    console.error('搜索记录失败:', error)
    return { success: false, error: '搜索记录失败' }
  }
}
