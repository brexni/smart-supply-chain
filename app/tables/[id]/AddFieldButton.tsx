'use client'

import { useState, useEffect } from 'react'
import { addField } from '@/app/actions/table-actions'
import { getAvailableTables } from '@/app/actions/link-actions'
import { FieldType } from '@/lib/types'
import { useRouter } from 'next/navigation'

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: 'text', label: '文本', description: '单行文本输入' },
  { value: 'number', label: '数字', description: '数值类型' },
  { value: 'select', label: '单选', description: '从选项中选择一个' },
  { value: 'multiSelect', label: '多选', description: '从选项中选择多个' },
  { value: 'link', label: '关联', description: '关联到其他表的记录' },
  { value: 'formula', label: '公式', description: '自动计算的字段' }
]

export default function AddFieldButton({ tableId }: { tableId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<FieldType>('text')
  const [options, setOptions] = useState('')
  const [linkedTableId, setLinkedTableId] = useState('')
  const [formula, setFormula] = useState('')
  const [availableTables, setAvailableTables] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && type === 'link') {
      loadAvailableTables()
    }
  }, [isOpen, type])

  const loadAvailableTables = async () => {
    const result = await getAvailableTables()
    if (result.success && result.data) {
      // 排除当前表
      setAvailableTables(result.data.filter((t: any) => t.id !== tableId))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)

    // 准备配置
    const config: any = {}
    if (type === 'select' || type === 'multiSelect') {
      config.options = options.split('\n').filter((o) => o.trim())
    } else if (type === 'link') {
      if (!linkedTableId) {
        alert('请选择要关联的表')
        setLoading(false)
        return
      }
      config.linkedTableId = linkedTableId
    } else if (type === 'formula') {
      if (!formula.trim()) {
        alert('请输入公式')
        setLoading(false)
        return
      }
      config.formula = formula.trim()
    }

    const result = await addField({
      tableId,
      name,
      type,
      config
    })

    setLoading(false)

    if (result.success) {
      setIsOpen(false)
      setName('')
      setType('text')
      setOptions('')
      setLinkedTableId('')
      setFormula('')
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-white text-gray-700 px-4 py-2 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition"
      >
        + 添加字段
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">添加字段</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">字段名称 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例如: 供应商名称"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">字段类型 *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as FieldType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label} - {ft.description}
                    </option>
                  ))}
                </select>
              </div>

              {(type === 'select' || type === 'multiSelect') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">选项 (每行一个)</label>
                  <textarea
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="选项1&#10;选项2&#10;选项3"
                    rows={4}
                  />
                </div>
              )}

              {type === 'link' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">关联到的表 *</label>
                  <select
                    value={linkedTableId}
                    onChange={(e) => setLinkedTableId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">请选择表</option>
                    {availableTables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">此字段将引用所选表中的记录</p>
                </div>
              )}

              {type === 'formula' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">公式 *</label>
                  <textarea
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    placeholder="例如: {数量} * {单价}"
                    rows={3}
                    required
                  />
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p>• 使用 {'{字段名}'} 引用其他字段</p>
                    <p>• 支持运算: +, -, *, /, (, )</p>
                    <p>• 支持函数: SUM, MULTIPLY, MAX, MIN, AVERAGE, ROUND, CEILING, FLOOR</p>
                    <p>
                      • 示例: SUM({'{字段1}'}, {'{字段2}'})
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? '添加中...' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
