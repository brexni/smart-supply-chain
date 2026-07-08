// Mock AI 功能 - 基于规则引擎的智能分析

/**
 * AI风险评级模板
 */
const RISK_TEMPLATES = [
  {
    threshold: 0,
    maxThreshold: 3,
    score: 95,
    level: '低风险',
    reason: '历史表现优秀,零延迟或极少延迟记录',
    suggestion: '优质供应商,可优先合作',
    color: 'green'
  },
  {
    threshold: 3,
    maxThreshold: 7,
    score: 75,
    level: '低风险',
    reason: '偶有小幅延迟,整体表现稳定',
    suggestion: '表现良好,可继续合作',
    color: 'green'
  },
  {
    threshold: 7,
    maxThreshold: 12,
    score: 55,
    level: '中风险',
    reason: '延迟频繁,需要加强监控',
    suggestion: '建议与供应商沟通改进措施',
    color: 'yellow'
  },
  {
    threshold: 12,
    maxThreshold: 20,
    score: 30,
    level: '高风险',
    reason: '严重延迟问题,供货不稳定',
    suggestion: '建议寻找备选供应商',
    color: 'orange'
  },
  {
    threshold: 20,
    maxThreshold: 999,
    score: 10,
    level: '高风险',
    reason: '延迟情况极其严重,严重影响供应链',
    suggestion: '强烈建议更换供应商',
    color: 'red'
  }
]

/**
 * 订单摘要模板
 */
const SUMMARY_TEMPLATES = [
  '向{supplier}采购{quantity}{unit}{product},预计总额¥{amount},物流费¥{shipping}',
  '订单详情: {product} × {quantity}{unit},供应商: {supplier},采购金额¥{amount}',
  '{supplier}供应的{product}({quantity}{unit}),总金额¥{amount},含运费¥{shipping}',
  '采购订单: 从{supplier}购买{product} {quantity}{unit},合计¥{totalWithShipping}',
  '{product}采购 | 供应商: {supplier} | 数量: {quantity}{unit} | 金额: ¥{amount}'
]

/**
 * 风险因素分析关键词
 */
const RISK_FACTORS = {
  high: ['延迟严重', '经常缺货', '质量问题', '沟通不畅', '价格波动大'],
  medium: ['偶尔延迟', '响应较慢', '文档不全', '需要催促'],
  low: ['准时交货', '质量稳定', '沟通顺畅', '响应及时', '服务优质']
}

/**
 * 生成AI风险评分
 * @param delayDays 历史延迟天数
 * @param supplierName 供应商名称(可选)
 */
export function generateRiskScore(
  delayDays: number,
  supplierName?: string
): {
  score: number
  level: string
  reason: string
  suggestion: string
  color: string
  factors: string[]
  confidence: number
} {
  // 找到匹配的风险等级
  const template =
    RISK_TEMPLATES.find((t) => delayDays >= t.threshold && delayDays < t.maxThreshold) ||
    RISK_TEMPLATES[RISK_TEMPLATES.length - 1]

  // 添加随机扰动使其更自然 (±2分)
  const randomVariance = Math.floor(Math.random() * 5) - 2
  const finalScore = Math.max(0, Math.min(100, template.score + randomVariance))

  // 根据延迟天数生成风险因素
  const factors: string[] = []
  if (delayDays === 0) {
    factors.push(...RISK_FACTORS.low.slice(0, 2))
  } else if (delayDays < 7) {
    factors.push(RISK_FACTORS.low[0])
    factors.push(RISK_FACTORS.medium[0])
  } else if (delayDays < 15) {
    factors.push(...RISK_FACTORS.medium.slice(0, 2))
    factors.push(RISK_FACTORS.high[0])
  } else {
    factors.push(...RISK_FACTORS.high.slice(0, 3))
  }

  // 计算置信度 (基于数据完整性)
  const confidence = supplierName ? 0.92 : 0.85

  return {
    score: finalScore,
    level: template.level,
    reason: template.reason,
    suggestion: template.suggestion,
    color: template.color,
    factors,
    confidence
  }
}

/**
 * 批量生成供应商风险评分
 */
export function generateBatchRiskScores(
  suppliers: Array<{
    id: string
    name: string
    delayDays: number
  }>
): Map<string, ReturnType<typeof generateRiskScore>> {
  const scores = new Map()

  for (const supplier of suppliers) {
    scores.set(supplier.id, generateRiskScore(supplier.delayDays, supplier.name))
  }

  return scores
}

/**
 * 生成智能订单摘要
 */
export function generateOrderSummary(order: {
  supplier: string
  product: string
  quantity: number
  amount: number
  shipping?: number
  unit?: string
}): {
  summary: string
  highlights: string[]
  tags: string[]
} {
  // 随机选择一个模板
  const template = SUMMARY_TEMPLATES[Math.floor(Math.random() * SUMMARY_TEMPLATES.length)]

  const unit = order.unit || '件'
  const shipping = order.shipping || 0
  const totalWithShipping = order.amount + shipping

  // 替换模板变量
  const summary = template
    .replace('{supplier}', order.supplier)
    .replace('{product}', order.product)
    .replace('{quantity}', order.quantity.toString())
    .replace('{unit}', unit)
    .replace('{amount}', order.amount.toFixed(2))
    .replace('{shipping}', shipping.toFixed(2))
    .replace('{totalWithShipping}', totalWithShipping.toFixed(2))

  // 生成关键亮点
  const highlights: string[] = []

  if (order.amount > 100000) {
    highlights.push('💰 大额采购订单')
  }

  if (order.quantity > 300) {
    highlights.push('📦 批量采购')
  }

  if (shipping > 0 && shipping / order.amount < 0.05) {
    highlights.push('🚚 物流费用优惠')
  }

  if (order.amount / order.quantity < 50) {
    highlights.push('💎 单价实惠')
  }

  // 生成标签
  const tags: string[] = []

  if (order.amount > 50000) {
    tags.push('重点订单')
  }

  if (order.quantity > 200) {
    tags.push('大批量')
  }

  // 根据商品名称添加标签
  if (order.product.includes('原料') || order.product.includes('材料')) {
    tags.push('原材料')
  }

  if (order.product.includes('电子') || order.product.includes('芯片')) {
    tags.push('电子元件')
  }

  return {
    summary,
    highlights: highlights.length > 0 ? highlights : ['常规采购订单'],
    tags: tags.length > 0 ? tags : ['标准订单']
  }
}

/**
 * 生成库存预警摘要
 */
export function generateInventoryAlert(product: { name: string; currentStock: number; safetyStock: number; sku?: string }): {
  alertLevel: 'danger' | 'warning' | 'safe'
  message: string
  action: string
  priority: number
} {
  const deficit = product.safetyStock - product.currentStock
  const percentage = (product.currentStock / product.safetyStock) * 100

  if (percentage <= 40) {
    return {
      alertLevel: 'danger',
      message: `⚠️ ${product.name} 库存严重不足! 当前库存${product.currentStock},低于安全库存${deficit}件`,
      action: '建议立即下单补货',
      priority: 1
    }
  } else if (percentage <= 70) {
    return {
      alertLevel: 'warning',
      message: `⚡ ${product.name} 库存偏低,当前库存${product.currentStock},接近安全库存下限`,
      action: '建议尽快安排补货',
      priority: 2
    }
  } else {
    return {
      alertLevel: 'safe',
      message: `✅ ${product.name} 库存充足,当前库存${product.currentStock}`,
      action: '持续监控即可',
      priority: 3
    }
  }
}

/**
 * 生成智能采购建议
 */
export function generatePurchaseRecommendation(params: {
  productName: string
  currentStock: number
  safetyStock: number
  avgConsumption?: number
  leadTime?: number
}): {
  recommendedQuantity: number
  reasoning: string
  urgency: 'high' | 'medium' | 'low'
  estimatedCost?: number
} {
  const deficit = Math.max(0, params.safetyStock - params.currentStock)
  const avgConsumption = params.avgConsumption || 10
  const leadTime = params.leadTime || 7

  // 计算推荐数量: 缺口 + 提前期消耗 + 缓冲
  const leadTimeConsumption = avgConsumption * leadTime
  const buffer = Math.ceil(params.safetyStock * 0.2) // 20%缓冲
  const recommendedQuantity = deficit + leadTimeConsumption + buffer

  // 生成理由
  let reasoning = `基于当前库存${params.currentStock}件,安全库存${params.safetyStock}件,`
  reasoning += `预计${leadTime}天交货期内消耗${leadTimeConsumption}件,`
  reasoning += `建议采购${recommendedQuantity}件以保障供应。`

  // 判断紧急程度
  let urgency: 'high' | 'medium' | 'low'
  if (params.currentStock < params.safetyStock * 0.5) {
    urgency = 'high'
  } else if (params.currentStock < params.safetyStock * 0.8) {
    urgency = 'medium'
  } else {
    urgency = 'low'
  }

  return {
    recommendedQuantity,
    reasoning,
    urgency
  }
}

/**
 * 分析供应商表现趋势
 */
export function analyzeSupplierTrend(
  history: Array<{
    date: Date
    delayDays: number
    orderCount: number
  }>
): {
  trend: 'improving' | 'stable' | 'declining'
  analysis: string
  recommendation: string
} {
  if (history.length < 2) {
    return {
      trend: 'stable',
      analysis: '历史数据不足,无法分析趋势',
      recommendation: '继续收集数据'
    }
  }

  // 计算平均延迟的变化
  const recentAvg = history.slice(-3).reduce((sum, h) => sum + h.delayDays, 0) / Math.min(3, history.length)
  const overallAvg = history.reduce((sum, h) => sum + h.delayDays, 0) / history.length

  if (recentAvg < overallAvg * 0.7) {
    return {
      trend: 'improving',
      analysis: '近期表现明显改善,延迟天数减少',
      recommendation: '可考虑增加合作份额'
    }
  } else if (recentAvg > overallAvg * 1.3) {
    return {
      trend: 'declining',
      analysis: '近期表现下滑,延迟天数增加',
      recommendation: '需要与供应商沟通,了解原因'
    }
  } else {
    return {
      trend: 'stable',
      analysis: '表现稳定,延迟天数波动较小',
      recommendation: '保持当前合作模式'
    }
  }
}
