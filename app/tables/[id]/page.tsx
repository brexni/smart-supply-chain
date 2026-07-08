'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AddFieldButton from './AddFieldButton'
import AddRecordButton from './AddRecordButton'
import GroupableTable from './GroupableTable'

type TableData = {
  id: string
  name: string
  description?: string | null
  fields: any[]
  records: any[]
}

export default function TableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [tableId, setTableId] = useState<string | null>(null)
  const [table, setTable] = useState<TableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      setTableId(id)
      fetch(`/api/tables/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Not found')
          return res.json()
        })
        .then((data) => {
          setTable(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error('加载表格失败:', err)
          setError(true)
          setLoading(false)
        })
    })
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !table) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-6">
          <Link href="/tables" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
            ← 返回表格列表
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{table.name}</h1>
              {table.description && <p className="text-gray-600 mt-2">{table.description}</p>}
              <div className="flex gap-4 mt-3 text-sm text-gray-500">
                <span>{table.fields.length} 个字段</span>
                <span>{table.records.length} 条记录</span>
              </div>
            </div>

            <div className="flex gap-3">
              <AddFieldButton tableId={table.id} />
              <AddRecordButton tableId={table.id} fields={table.fields} />
            </div>
          </div>
        </div>

        {/* 表格区域 */}
        {table.fields.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有字段</h3>
            <p className="text-gray-600 mb-6">点击右上角"添加字段"按钮开始设计表格结构</p>
          </div>
        ) : (
          <GroupableTable table={table} fields={table.fields} records={table.records} />
        )}
      </div>
    </div>
  )
}
