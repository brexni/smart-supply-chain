import Link from 'next/link'
import { getTables } from '@/app/actions/table-actions'
import CreateTableButton from './CreateTableButton'

// 设置为动态渲染
export const dynamic = 'force-dynamic'

export default async function TablesPage() {
  const result = await getTables()
  const tables = result.success && result.data ? result.data : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">表格管理</h1>
            <p className="text-gray-600 mt-2">管理和查看所有多维表格</p>
          </div>
          <CreateTableButton />
        </div>

        {tables.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有表格</h3>
            <p className="text-gray-600 mb-6">点击右上角按钮创建第一个表格</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <Link
                key={table.id}
                href={`/tables/${table.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{table.name}</h3>
                {table.description && <p className="text-gray-600 text-sm mb-4">{table.description}</p>}
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>{table.fields.length} 个字段</span>
                  <span>{table._count.records} 条记录</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
