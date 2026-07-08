import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">智能供应链多维表格系统</h1>
          <p className="text-xl text-gray-600 mb-12">基于自研多维表格引擎的供应链协同应用</p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-semibold mb-3">多维表格引擎</h3>
              <ul className="text-left text-gray-600 space-y-2 mb-6">
                <li>✓ 6种字段类型</li>
                <li>✓ 关联字段</li>
                <li>✓ 公式计算</li>
                <li>✓ 多级分组</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-2xl font-semibold mb-3">供应链应用</h3>
              <ul className="text-left text-gray-600 space-y-2 mb-6">
                <li>✓ 供应商管理</li>
                <li>✓ 库存预警</li>
                <li>✓ AI风险评级</li>
                <li>✓ 智能摘要</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/tables"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              进入系统
            </Link>
            <Link
              href="/setup"
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              快速初始化
            </Link>
            <Link
              href="/dashboard"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
            >
              数据仪表盘
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
