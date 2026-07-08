'use client'

import { useState } from 'react'
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

export default function RecordTable({ table, fields, records }: { table: Table; fields: Field[]; records: TableRecord[] }) {
  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldId: string } | null>(null)
  const [editValue, setEditValue] = useState<any>('')
  const router = useRouter()

  const handleCellClick = (recordId: string, fieldId: string, currentValue: any, fieldType: string) => {
    // 公式字段和关联字段不可编辑
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

    // 显示值
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">-</span>
    }

    // 关联字段显示
    if (field.type === 'link' && Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400">-</span>
      }
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

    // 公式字段显示
    if (field.type === 'formula') {
      // 检查是否是错误
      if (typeof value === 'string' && value.startsWith('#ERROR')) {
        return <span className="text-red-600 text-xs">{value}</span>
      }

      // 格式化数字
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

  return (
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
  )
}
