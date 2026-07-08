'use client'

import React, { useState, useMemo } from 'react'
import { updateRecordField, deleteRecord } from '@/app/actions/record-actions'
import { useRouter } from 'next/navigation'

interface Field {
  id: string
  name: string
  type: string
  config: any
}

interface TableRecord {
  id: string
  data: Record<string, any>
}

interface Table {
  id: string
  name: string
}

interface GroupedData {
  groupValue: string
  records: TableRecord[]
  subGroups?: Map<string, GroupedData>
}

export default function GroupableTable({ table, fields, records }: { table: Table; fields: Field[]; records: TableRecord[] }) {
  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldId: string } | null>(null)
  const [editValue, setEditValue] = useState<any>('')
  const [groupByFields, setGroupByFields] = useState<string[]>([])
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const router = useRouter()

  // 可分组的字段类型
  const groupableFields = fields.filter((f) => ['text', 'select', 'number'].includes(f.type))

  // 数据分组逻辑
  const groupedData = useMemo(() => {
    if (groupByFields.length === 0) {
      return null
    }

    return groupRecords(records, groupByFields, fields, 0)
  }, [records, groupByFields, fields])

  const handleCellClick = (recordId: string, fieldId: string, currentValue: any, fieldType: string) => {
    if (fieldType === 'formula' || fieldType === 'link') return

    setEditingCell({ recordId, fieldId })
    setEditValue(currentValue || '')
  }

  const handleCellBlur = async () => {
    if (!editingCell) return

    await updateRecordField(editingCell.recordId, editingCell.fieldId, editValue)
    setEditingCell(null)
    router.refresh()
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm('确定要删除这条记录吗?')) return

    await deleteRecord(recordId)
    router.refresh()
  }

  const toggleGroupCollapse = (groupKey: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupKey)) {
      newCollapsed.delete(groupKey)
    } else {
      newCollapsed.add(groupKey)
    }
    setCollapsedGroups(newCollapsed)
  }

  const handleGroupByChange = (fieldId: string, level: number) => {
    const newGroupBy = [...groupByFields]
    if (fieldId === '') {
      // 移除该级别及之后的分组
      newGroupBy.splice(level)
    } else {
      newGroupBy[level] = fieldId
      // 移除之后的分组
      newGroupBy.splice(level + 1)
    }
    setGroupByFields(newGroupBy)
    setCollapsedGroups(new Set()) // 重置折叠状态
  }

  const renderCellValue = (record: TableRecord, field: Field) => {
    const value = record.data[field.id]
    const isEditing = editingCell?.recordId === record.id && editingCell?.fieldId === field.id

    if (isEditing) {
      if (field.type === 'select') {
        return (
          <select
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleCellBlur}
            className="w-full px-2 py-1 border border-indigo-500 rounded"
          >
            <option value="">请选择</option>
            {field.config.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      }

      return (
        <input
          autoFocus
          type={field.type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
          onBlur={handleCellBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCellBlur()
            if (e.key === 'Escape') setEditingCell(null)
          }}
          className="w-full px-2 py-1 border border-indigo-500 rounded"
        />
      )
    }

    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">-</span>
    }

    if (field.type === 'link' && Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400">-</span>
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((linkedRecord: any, i) => (
            <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              {linkedRecord.title || linkedRecord.id}
            </span>
          ))}
        </div>
      )
    }

    if (field.type === 'formula') {
      if (typeof value === 'string' && value.startsWith('#ERROR')) {
        return <span className="text-red-600 text-xs">{value}</span>
      }
      if (typeof value === 'number') {
        return <span className="font-medium text-indigo-600">{value.toFixed(2)}</span>
      }
      return <span className="font-medium text-indigo-600">{value}</span>
    }

    if (field.type === 'multiSelect' && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span key={i} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
              {v}
            </span>
          ))}
        </div>
      )
    }

    if (field.type === 'select') {
      return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{value}</span>
    }

    return <span>{value}</span>
  }

  const renderGroupedRows = (group: GroupedData, level: number, parentKey: string = '') => {
    const groupKey = `${parentKey}-${group.groupValue}`
    const isCollapsed = collapsedGroups.has(groupKey)

    // 计算聚合统计
    const stats = calculateGroupStats(group.records, fields)

    return (
      <React.Fragment key={groupKey}>
        {/* 分组标题行 */}
        <tr className="bg-gray-100 font-semibold">
          <td
            colSpan={fields.length + 1}
            className="px-6 py-3 cursor-pointer hover:bg-gray-200"
            onClick={() => toggleGroupCollapse(groupKey)}
          >
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
              <span className="text-gray-500">{isCollapsed ? '▶' : '▼'}</span>
              <span>{group.groupValue || '(空)'}</span>
              <span className="text-sm text-gray-600">({group.records.length} 条记录)</span>
              {stats.totalAmount !== null && (
                <span className="text-sm text-indigo-600 ml-4">总计: {stats.totalAmount.toFixed(2)}</span>
              )}
            </div>
          </td>
        </tr>

        {/* 展开时显示记录或子分组 */}
        {!isCollapsed &&
          (group.subGroups
            ? Array.from(group.subGroups.values()).map((subGroup) => renderGroupedRows(subGroup, level + 1, groupKey))
            : group.records.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  {fields.map((field) => (
                    <td
                      key={field.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      style={{ paddingLeft: field.id === fields[0].id ? `${(level + 1) * 20 + 24}px` : undefined }}
                      onClick={() => handleCellClick(record.id, field.id, record.data[field.id], field.type)}
                    >
                      {renderCellValue(record, field)}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-800">
                      删除
                    </button>
                  </td>
                </tr>
              )))}
      </React.Fragment>
    )
  }

  return (
    <div className="space-y-4">
      {/* 分组控制器 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-gray-700">分组:</span>

          {[0, 1, 2].map((level) => (
            <div key={level} className="flex items-center gap-2">
              {level > 0 && <span className="text-gray-400">→</span>}
              <select
                value={groupByFields[level] || ''}
                onChange={(e) => handleGroupByChange(e.target.value, level)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                disabled={level > 0 && !groupByFields[level - 1]}
              >
                <option value="">{level === 0 ? '不分组' : `第${level + 1}级`}</option>
                {groupableFields
                  .filter((f) => !groupByFields.includes(f.id) || groupByFields[level] === f.id)
                  .map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name}
                    </option>
                  ))}
              </select>
            </div>
          ))}

          {groupByFields.length > 0 && (
            <button
              onClick={() => {
                setGroupByFields([])
                setCollapsedGroups(new Set())
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              清除分组
            </button>
          )}
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {fields.map((field) => (
                  <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field.name}
                    <span className="text-gray-400 ml-1 normal-case">({field.type})</span>
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 1} className="px-6 py-12 text-center text-gray-500">
                    暂无数据,点击右上角"添加记录"按钮开始添加
                  </td>
                </tr>
              ) : groupedData ? (
                Array.from(groupedData.values()).map((group) => renderGroupedRows(group, 0))
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    {fields.map((field) => (
                      <td
                        key={field.id}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                        onClick={() => handleCellClick(record.id, field.id, record.data[field.id], field.type)}
                      >
                        {renderCellValue(record, field)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-800">
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// 辅助函数: 递归分组数据
function groupRecords(records: TableRecord[], groupByFields: string[], fields: Field[], level: number): Map<string, GroupedData> {
  const groups = new Map<string, GroupedData>()

  if (level >= groupByFields.length) {
    return groups
  }

  const fieldId = groupByFields[level]

  for (const record of records) {
    const value = record.data[fieldId]
    const groupKey = value?.toString() || '(空)'

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        groupValue: groupKey,
        records: []
      })
    }

    groups.get(groupKey)!.records.push(record)
  }

  // 如果有下一级分组,递归处理
  if (level + 1 < groupByFields.length) {
    for (const group of groups.values()) {
      group.subGroups = groupRecords(group.records, groupByFields, fields, level + 1)
    }
  }

  return groups
}

// 辅助函数: 计算分组统计
function calculateGroupStats(records: TableRecord[], fields: Field[]) {
  const numberFields = fields.filter((f) => f.type === 'number' || f.type === 'formula')

  let totalAmount = null

  // 尝试找到"总金额"、"金额"等字段
  const amountField = numberFields.find((f) => f.name.includes('金额') || f.name.includes('总额') || f.name.includes('amount'))

  if (amountField) {
    totalAmount = records.reduce((sum, r) => {
      const val = r.data[amountField.id]
      return sum + (typeof val === 'number' ? val : 0)
    }, 0)
  }

  return { totalAmount }
}
