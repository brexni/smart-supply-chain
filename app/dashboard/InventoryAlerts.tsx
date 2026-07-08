'use client'

import { useEffect, useState } from 'react'

export default function InventoryAlerts() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  const loadAlerts = async () => {
    setChecking(true)
    try {
      const response = await fetch('/api/inventory-check')
      const result = await response.json()
      if (result.success) {
        setAlerts(result.data.alerts || [])
      }
    } catch (error) {
      console.error('加载预警失败:', error)
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">库存预警</h2>
        <div className="text-center text-gray-500 py-8">加载中...</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">库存预警</h2>
        <button
          onClick={loadAlerts}
          disabled={checking}
          className="text-sm text-indigo-600 hover:text-indigo-700 underline disabled:text-gray-400"
        >
          {checking ? '检查中...' : '🔄 重新检查'}
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-gray-600">所有商品库存充足,无需预警</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                alert.alertLevel === 'danger'
                  ? 'bg-red-50 border-red-500'
                  : alert.alertLevel === 'warning'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-green-50 border-green-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {alert.productName}
                    {alert.sku && <span className="text-sm text-gray-500 ml-2">({alert.sku})</span>}
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.priority === 1
                      ? 'bg-red-200 text-red-900'
                      : alert.priority === 2
                        ? 'bg-yellow-200 text-yellow-900'
                        : 'bg-green-200 text-green-900'
                  }`}
                >
                  优先级 {alert.priority}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">当前库存:</span> {alert.currentStock} |{' '}
                  <span className="font-medium">安全库存:</span> {alert.safetyStock} |{' '}
                  <span className="font-medium text-red-600">缺口:</span> {alert.deficit}
                </div>
                <div className="text-indigo-600 font-medium">{alert.action}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
