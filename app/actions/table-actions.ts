'use server'

import { prisma } from '@/lib/prisma'
import { FieldType, FieldConfig } from '@/lib/types'
import { revalidatePath } from 'next/cache'

/**
 * 创建新表
 */
export async function createTable(data: { name: string; description?: string }) {
  try {
    const table = await prisma.table.create({
      data: {
        name: data.name,
        description: data.description
      }
    })

    revalidatePath('/tables')
    return { success: true, data: table }
  } catch (error) {
    console.error('创建表失败:', error)
    return { success: false, error: '创建表失败' }
  }
}

/**
 * 获取所有表
 */
export async function getTables() {
  try {
    const tables = await prisma.table.findMany({
      include: {
        fields: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { records: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: tables }
  } catch (error) {
    console.error('获取表列表失败:', error)
    return { success: false, error: '获取表列表失败' }
  }
}

/**
 * 获取单个表的详细信息
 */
export async function getTableById(tableId: string) {
  try {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!table) {
      return { success: false, error: '表不存在' }
    }

    // 解析JSON字段
    const tableWithParsedConfig = {
      ...table,
      fields: table.fields.map((field) => ({
        ...field,
        config: JSON.parse(field.config) as FieldConfig
      }))
    }

    return { success: true, data: tableWithParsedConfig }
  } catch (error) {
    console.error('获取表信息失败:', error)
    return { success: false, error: '获取表信息失败' }
  }
}

/**
 * 删除表
 */
export async function deleteTable(tableId: string) {
  try {
    await prisma.table.delete({
      where: { id: tableId }
    })

    revalidatePath('/tables')
    return { success: true }
  } catch (error) {
    console.error('删除表失败:', error)
    return { success: false, error: '删除表失败' }
  }
}

/**
 * 为表添加字段
 */
export async function addField(data: { tableId: string; name: string; type: FieldType; config?: FieldConfig }) {
  try {
    // 获取当前表的最大order值
    const maxOrderField = await prisma.field.findFirst({
      where: { tableId: data.tableId },
      orderBy: { order: 'desc' }
    })

    const newOrder = (maxOrderField?.order ?? 0) + 1

    const field = await prisma.field.create({
      data: {
        tableId: data.tableId,
        name: data.name,
        type: data.type,
        config: JSON.stringify(data.config || {}),
        order: newOrder
      }
    })

    revalidatePath(`/tables/${data.tableId}`)
    return { success: true, data: field }
  } catch (error) {
    console.error('添加字段失败:', error)
    return { success: false, error: '添加字段失败' }
  }
}

/**
 * 更新字段
 */
export async function updateField(
  fieldId: string,
  data: {
    name?: string
    type?: FieldType
    config?: FieldConfig
  }
) {
  try {
    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.config !== undefined) updateData.config = JSON.stringify(data.config)

    const field = await prisma.field.update({
      where: { id: fieldId },
      data: updateData
    })

    revalidatePath(`/tables/${field.tableId}`)
    return { success: true, data: field }
  } catch (error) {
    console.error('更新字段失败:', error)
    return { success: false, error: '更新字段失败' }
  }
}

/**
 * 删除字段
 */
export async function deleteField(fieldId: string) {
  try {
    const field = await prisma.field.findUnique({
      where: { id: fieldId }
    })

    if (!field) {
      return { success: false, error: '字段不存在' }
    }

    await prisma.field.delete({
      where: { id: fieldId }
    })

    revalidatePath(`/tables/${field.tableId}`)
    return { success: true }
  } catch (error) {
    console.error('删除字段失败:', error)
    return { success: false, error: '删除字段失败' }
  }
}

/**
 * 获取表的所有字段
 */
export async function getFieldsByTableId(tableId: string) {
  try {
    const fields = await prisma.field.findMany({
      where: { tableId },
      orderBy: { order: 'asc' }
    })

    const fieldsWithParsedConfig = fields.map((field) => ({
      ...field,
      config: JSON.parse(field.config) as FieldConfig
    }))

    return { success: true, data: fieldsWithParsedConfig }
  } catch (error) {
    console.error('获取字段列表失败:', error)
    return { success: false, error: '获取字段列表失败' }
  }
}
