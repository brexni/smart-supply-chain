'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AIDemoPage() {
  const [riskInput, setRiskInput] = useState({ delayDays: 5, supplierName: '示例供应商' })
  const [riskResult, setRiskResult] = useState<any>(null)
  const [riskLoading, setRiskLoading] = useState(false)

  const [summaryInput, setSummaryInput] = useState({
    supplier: '华东供应链有限公司',
    product: '钢材-Q235',
    quantity: 50,
    amount: 125000,
    shipping: 400,
    unit: '吨'
  })
  const [summaryResult, setSummaryResult] = useState<any>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const handleRiskScore = async () => {
    setRiskLoading(true)
    try {
      const response = await fetch('/api/ai/risk-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(riskInput)
      })
      const data = await response.json()
      if (data.success) {
        setRiskResult(data.data)
      }
    } catch (error) {
      console.error('请求失败:', error)
    } finally {
      setRiskLoading(false)
    }
  }

  const handleOrderSummary = async () => {
    setSummaryLoading(true)
    try {
      const response = await fetch('/api/ai/order-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(summaryInput)
      })
      const data = await response.json()
      if (data.success) {
        setSummaryResult(data.data)
      }
    } catch (error) {
      console.error('请求失败:', error)
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700">
            ← 返回首页
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI功能演示</h1>
        <p className="text-gray-600 mb-8">基于规则引擎的智能风险评级和订单摘要生成</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* AI风险评级 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 AI风险评级</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">供应商名称</label>
                <input
                  type="text"
                  value={riskInput.supplierName}
                  onChange={(e) => setRiskInput({ ...riskInput, supplierName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="输入供应商名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">历史延迟天数</label>
                <input
                  type="number"
                  value={riskInput.delayDays}
                  onChange={(e) => setRiskInput({ ...riskInput, delayDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="输入延迟天数"
                />
              </div>

              <button
                onClick={handleRiskScore}
                disabled={riskLoading}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
              >
                {riskLoading ? '分析中...' : '生成风险评分'}
              </button>
            </div>

            {riskResult && (
              <div className="border-t pt-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">风险评分</span>
                    <span
                      className={`text-3xl font-bold ${
                        riskResult.score >= 70 ? 'text-green-600' : riskResult.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}
                    >
                      {riskResult.score}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        riskResult.score >= 70 ? 'bg-green-600' : riskResult.score >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${riskResult.score}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">风险等级:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded ${
                        riskResult.color === 'green'
                          ? 'bg-green-100 text-green-800'
                          : riskResult.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {riskResult.level}
                    </span>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">分析原因:</span>
                    <p className="text-gray-600 mt-1">{riskResult.reason}</p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">建议措施:</span>
                    <p className="text-gray-600 mt-1">{riskResult.suggestion}</p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">风险因素:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {riskResult.factors.map((factor: string, i: number) => (
                        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-gray-700">置信度:</span>
                    <span className="ml-2 text-gray-600">{(riskResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI订单摘要 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 AI订单摘要</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">供应商</label>
                <input
                  type="text"
                  value={summaryInput.supplier}
                  onChange={(e) => setSummaryInput({ ...summaryInput, supplier: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">商品名称</label>
                <input
                  type="text"
                  value={summaryInput.product}
                  onChange={(e) => setSummaryInput({ ...summaryInput, product: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">数量</label>
                  <input
                    type="number"
                    value={summaryInput.quantity}
                    onChange={(e) => setSummaryInput({ ...summaryInput, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">单位</label>
                  <input
                    type="text"
                    value={summaryInput.unit}
                    onChange={(e) => setSummaryInput({ ...summaryInput, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">采购金额</label>
                  <input
                    type="number"
                    value={summaryInput.amount}
                    onChange={(e) => setSummaryInput({ ...summaryInput, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">运费</label>
                  <input
                    type="number"
                    value={summaryInput.shipping}
                    onChange={(e) => setSummaryInput({ ...summaryInput, shipping: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <button
                onClick={handleOrderSummary}
                disabled={summaryLoading}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400"
              >
                {summaryLoading ? '生成中...' : '生成订单摘要'}
              </button>
            </div>

            {summaryResult && (
              <div className="border-t pt-4">
                <div className="mb-4">
                  <span className="font-medium text-gray-700 block mb-2">智能摘要:</span>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">{summaryResult.summary}</p>
                </div>

                <div className="mb-4">
                  <span className="font-medium text-gray-700 block mb-2">关键亮点:</span>
                  <div className="space-y-1">
                    {summaryResult.highlights.map((highlight: string, i: number) => (
                      <div key={i} className="text-sm text-gray-700">
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700 block mb-2">标签:</span>
                  <div className="flex flex-wrap gap-2">
                    {summaryResult.tags.map((tag: string, i: number) => (
                      <span key={i} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 技术说明</h3>
          <p className="text-sm text-blue-800">
            这些AI功能使用基于规则引擎的Mock实现,通过预设模板和业务规则生成智能分析结果。
            在实际生产环境中,可以替换为真实的大模型API(如Claude、GPT等)以获得更智能的分析能力。
          </p>
        </div>
      </div>
    </div>
  )
}
