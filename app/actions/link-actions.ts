'use server'

import { getLinkableRecords } from '@/lib/link-resolver'
import { getTables } from './table-actions'

/**
 * 获取可用于关联的表列表
 */
export async function getAvailableTables() {
  return await getTables()
}

/**
 * 获取指定表的可关联记录
 */
export async function getLinkedRecordOptions(tableId: string) {
  try {
    const records = await getLinkableRecords(tableId)
    return { success: true, data: records }
  } catch (error) {
    console.error('获取关联记录选项失败:', error)
    return { success: false, error: '获取关联记录选项失败' }
  }
}
