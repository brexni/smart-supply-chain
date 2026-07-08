'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInitialize = async () => {
    if (!confirm('确定要初始化供应链业务数据吗?')) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || '初始化失败')
      }
    } catch (err) {
      setError('网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('警告: 这将删除所有数据! 确定要继续吗?')) return
    if (!confirm('再次确认: 所有表格和记录都将被删除,此操作不可恢复!')) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        alert('数据已清除,页面将刷新')
        router.refresh()
      } else {
        setError(data.error || '清除失败')
      }
    } catch (err) {
      setError('网络请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">数据初始化</h1>
          <p className="text-gray-600 mb-8">快速初始化供应链业务示例数据</p>

          <div className="bg-white rounded-lg shadow p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">将创建以下业务表:</h2>

            <div className="space-y-4 mb-8">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-900">1. 供应商表</h3>
                <p className="text-sm text-gray-600 mt-1">包含字段: 供应商名称、风险等级、联系人、历史延迟天数</p>
                <p className="text-sm text-gray-500 mt-1">示例数据: 4 家供应商</p>
              </div>

              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-gray-900">2. 商品表</h3>
                <p className="text-sm text-gray-600 mt-1">包含字段: SKU编码、商品名称、安全库存、当前库存</p>
                <p className="text-sm text-gray-500 mt-1">示例数据: 4 种商品</p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-900">3. 采购订单表</h3>
                <p className="text-sm text-gray-600 mt-1">
                  包含字段: 关联供应商、关联商品、采购数量、单价、总金额(公式)、
                  物流费单价、体积数、总运费(公式)、计件运费(公式)、订单状态
                </p>
                <p className="text-sm text-gray-500 mt-1">示例数据: 4 条采购订单</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleInitialize}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
              >
                {loading ? '初始化中...' : '🚀 开始初始化'}
              </button>

              <button
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-3 border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400"
              >
                清除所有数据
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">初始化失败</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-green-900 mb-4">✅ 初始化成功!</h3>

              <div className="space-y-2 text-sm text-green-800 mb-6">
                <p>• 供应商表: {result.data.counts.suppliers} 条记录</p>
                <p>• 商品表: {result.data.counts.products} 条记录</p>
                <p>• 采购订单表: {result.data.counts.orders} 条记录</p>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/tables"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  查看所有表格
                </Link>
                <Link
                  href={`/tables/${result.data.orderTableId}`}
                  className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
                >
                  查看采购订单表
                </Link>
                <Link
                  href="/dashboard"
                  className="bg-white text-gray-700 px-6 py-2 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition"
                >
                  查看仪表盘
                </Link>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ 注意事项</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• 如果业务表已存在,初始化将失败</li>
              <li>• 可以使用"清除所有数据"按钮重置系统</li>
              <li>• 初始化后可以在表格页面查看和编辑数据</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 underline">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
