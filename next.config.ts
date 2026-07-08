import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 启用实验性功能以提升性能
  experimental: {
    // 优化服务端组件
    optimizePackageImports: ['@prisma/client']
  }
}

export default nextConfig
