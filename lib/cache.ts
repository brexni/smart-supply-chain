// 简单的内存缓存层
import { unstable_cache } from 'next/cache'

/**
 * 缓存包装器,用于缓存数据库查询结果
 * @param fn 要缓存的函数
 * @param keys 缓存键
 * @param revalidate 重新验证时间(秒)
 */
export function cacheWrapper<T>(fn: () => Promise<T>, keys: string[], revalidate: number = 10) {
  return unstable_cache(fn, keys, {
    revalidate,
    tags: keys
  })
}

/**
 * 缓存表格数据
 */
export const cacheTableData = <T>(fn: () => Promise<T>, tableId?: string) => {
  const keys = tableId ? ['tables', tableId] : ['tables']
  return cacheWrapper(fn, keys, 10)
}

/**
 * 缓存仪表盘数据
 */
export const cacheDashboardData = <T>(fn: () => Promise<T>) => {
  return cacheWrapper(fn, ['dashboard'], 10)
}
