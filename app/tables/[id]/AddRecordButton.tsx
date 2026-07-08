'use client'

import { useState, useEffect } from 'react'
import { createRecord } from '@/app/actions/record-actions'
import { getLinkedRecordOptions } from '@/app/actions/link-actions'
import { useRouter } from 'next/navigation'

interface Field {
  id: string
  name: string
  type: string
  config: any
}

export default function AddRecordButton({ tableId, fields }: { tableId: string; fields: Field[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [linkOptions, setLinkOptions] = useState<Record<string, any[]>>({})
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      loadLinkOptions()
    }
  }, [isOpen])

  const loadLinkOptions = async () => {
    const linkFields = fields.filter((f) => f.type === 'link')
    const options: Record<string, any[]> = {}

    for (const field of linkFields) {
      if (field.config.linkedTableId) {
        const result = await getLinkedRecordOptions(field.config.linkedTableId)
        if (result.success && result.data) {
          options[field.id] = result.data
        }
      }
    }

    setLinkOptions(options)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    const result = await createRecord(tableId, formData)
    setLoading(false)

    if (result.success) {
      setIsOpen(false)
      setFormData({})
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const renderFieldInput = (field: Field) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={`输入${field.name}`}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={`输入${field.name}`}
          />
        )

      case 'select':
        return (
          <select
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">请选择</option>
            {field.config.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      case 'multiSelect':
        return (
          <div className="space-y-2">
            {field.config.options?.map((option: string) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={(formData[field.id] || []).includes(option)}
                  onChange={(e) => {
                    const current = formData[field.id] || []
                    const updated = e.target.checked ? [...current, option] : current.filter((o: string) => o !== option)
                    handleFieldChange(field.id, updated)
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        )

      case 'link':
        const options = linkOptions[field.id] || []
        return (
          <div>
            <select
              multiple
              size={4}
              value={formData[field.id] || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                handleFieldChange(field.id, selected)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {options.map((record: any) => (
                <option key={record.id} value={record.id}>
                  {record.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">按住 Ctrl/Cmd 可多选</p>
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={formData[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={`${field.type}类型暂不支持编辑`}
            disabled
          />
        )
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
      >
        + 添加记录
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">添加记录</h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                {fields
                  .filter((f) => f.type !== 'formula')
                  .map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.name}
                        <span className="text-gray-400 ml-2 text-xs">({field.type})</span>
                      </label>
                      {renderFieldInput(field)}
                    </div>
                  ))}
              </div>

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
