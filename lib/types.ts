// 类型定义

// 字段类型枚举
export type FieldType = 'text' | 'number' | 'select' | 'multiSelect' | 'link' | 'formula'

// 字段配置接口
export interface FieldConfig {
  // 单选/多选选项
  options?: string[]
  // 关联表ID (link类型)
  linkedTableId?: string
  // 公式表达式 (formula类型)
  formula?: string
}

// 记录数据类型 (fieldId -> value)
export type RecordData = Record<string, any>

// 表格完整数据
export interface TableWithFields {
  id: string
  name: string
  description?: string
  fields: Array<{
    id: string
    name: string
    type: FieldType
    config: FieldConfig
    order: number
  }>
  records: Array<{
    id: string
    data: RecordData
    createdAt: Date
    updatedAt: Date
  }>
}
