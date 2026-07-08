'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* 左侧：Logo + 返回首页 */}
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-indigo-600 hover:text-indigo-700 transition">
            🚚 智能供应链
          </Link>
          {!isHome && (
            <Link href="/" className="text-sm text-gray-500 hover:text-indigo-600 transition flex items-center gap-1">
              ← 返回首页
            </Link>
          )}
        </div>

        {/* 右侧：快捷导航 */}
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/tables"
            className={`px-3 py-1.5 rounded-md transition ${
              pathname.startsWith('/tables')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
            }`}
          >
            表格管理
          </Link>
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-md transition ${
              pathname.startsWith('/dashboard')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
            }`}
          >
            仪表盘
          </Link>
          <Link
            href="/ai-demo"
            className={`px-3 py-1.5 rounded-md transition ${
              pathname.startsWith('/ai-demo')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
            }`}
          >
            AI演示
          </Link>
          <Link
            href="/setup"
            className={`px-3 py-1.5 rounded-md transition ${
              pathname.startsWith('/setup')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
            }`}
          >
            初始化
          </Link>
        </div>
      </div>
    </nav>
  )
}
