# AI Prompt 设计说明

本文档说明智能供应链系统中AI功能的Prompt设计思路和实现方案。

## 概述

本项目采用**基于规则引擎的Mock实现**,通过预设模板和业务规则生成智能分析结果。这种方案在考题限定时间内快速实现AI功能演示,同时保留了升级为真实大模型API的接口。

## AI功能设计

### 1. AI风险评级

**业务场景** 根据供应商的历史延迟天数,自动评估风险等级并提供建议。

**Mock实现策略**

```typescript
// 规则模板
const RISK_TEMPLATES = [
  { threshold: 0, score: 95, level: '低风险', reason: '历史表现优秀', suggestion: '优先合作' },
  { threshold: 7, score: 55, level: '中风险', reason: '延迟频繁', suggestion: '加强监控' },
  { threshold: 15, score: 30, level: '高风险', reason: '严重延迟', suggestion: '更换供应商' }
]

// 匹配规则并添加随机扰动
function generateRiskScore(delayDays) {
  const template = findMatchingTemplate(delayDays)
  const variance = Math.random() * 5 - 2 // ±2分随机性
  return { score: template.score + variance, ...template }
}
```

**升级为真实AI的Prompt设计**

```typescript
// 当需要使用Claude API时,可以这样设计Prompt
const prompt = `
你是一个供应链风险分析专家。请根据以下信息评估供应商风险:

供应商信息:
- 名称: ${supplierName}
- 历史延迟天数: ${delayDays}天
- 行业: ${industry}

请提供:
1. 风险评分 (0-100分,100分最好)
2. 风险等级 (低风险/中风险/高风险)
3. 风险分析原因 (2-3句话)
4. 改进建议 (具体可执行)
5. 关键风险因素 (3-5个关键词)

请以JSON格式返回:
{
  "score": 85,
  "level": "低风险",
  "reason": "...",
  "suggestion": "...",
  "factors": ["准时交货", "质量稳定"]
}
`

const result = await callClaudeAPI({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.7
})
```

**Prompt设计要点**

1. **角色定义**: 明确AI扮演的专家角色
2. **上下文提供**: 给出完整的业务数据
3. **任务拆解**: 分点说明需要什么输出
4. **格式约束**: 指定返回JSON格式便于解析
5. **温度控制**: 0.7保证输出既稳定又有一定创造性

### 2. 智能订单摘要

**业务场景** 将采购订单数据转换为自然语言描述,便于快速理解。

**Mock实现策略**

```typescript
const SUMMARY_TEMPLATES = [
  '向{supplier}采购{quantity}{unit}{product},预计总额¥{amount}',
  '订单: {product} × {quantity},供应商: {supplier},金额: ¥{amount}',
  '{supplier}供应的{product}({quantity}{unit}),采购金额¥{amount}'
]

function generateOrderSummary(order) {
  // 随机选择模板
  const template = SUMMARY_TEMPLATES[Math.floor(Math.random() * SUMMARY_TEMPLATES.length)]

  // 替换变量
  return template
    .replace('{supplier}', order.supplier)
    .replace('{product}', order.product)
    .replace('{quantity}', order.quantity)
    .replace('{amount}', order.amount.toFixed(2))

  // 分析关键亮点
  const highlights = analyzeHighlights(order)
  const tags = generateTags(order)

  return { summary, highlights, tags }
}
```

**升级为真实AI的Prompt设计**

```typescript
const prompt = `
请为以下采购订单生成智能摘要:

订单信息:
- 供应商: ${order.supplier}
- 商品: ${order.product}
- 数量: ${order.quantity} ${order.unit}
- 单价: ¥${order.unitPrice}
- 总金额: ¥${order.totalAmount}
- 运费: ¥${order.shipping}
- 订单状态: ${order.status}

请提供:
1. 一句话摘要 (30字以内,口语化)
2. 关键亮点 (2-3个,如"大额采购"、"单价优惠"等)
3. 订单标签 (2-4个分类标签)

返回JSON格式:
{
  "summary": "向华东供应链采购50吨钢材,总额12.5万元",
  "highlights": ["大额采购", "物流费优惠"],
  "tags": ["重点订单", "原材料"]
}
`
```

**Prompt设计要点**

1. **简洁性**: 要求一句话摘要,避免冗长
2. **可读性**: 使用口语化表达
3. **结构化**: 提取亮点和标签便于UI展示
4. **业务理解**: AI需要理解"大额"、"优惠"等业务概念

### 3. 库存预警

**业务场景** 检测低库存并生成采购建议。

**Mock实现策略**

```typescript
function generateInventoryAlert(product) {
  const deficit = product.safetyStock - product.currentStock
  const percentage = (product.currentStock / product.safetyStock) * 100

  if (percentage <= 40) {
    return {
      alertLevel: 'danger',
      message: `⚠️ ${product.name} 库存严重不足!`,
      action: '建议立即下单补货',
      priority: 1
    }
  } else if (percentage <= 70) {
    return {
      alertLevel: 'warning',
      message: `⚡ ${product.name} 库存偏低`,
      action: '建议尽快安排补货',
      priority: 2
    }
  }
  // ...
}

function generatePurchaseRecommendation(params) {
  // 计算推荐采购数量
  const recommendedQuantity = params.deficit + params.leadTimeConsumption + params.buffer

  return {
    recommendedQuantity,
    reasoning: `基于当前库存${params.currentStock}件...`,
    urgency: 'high'
  }
}
```

**升级为真实AI的Prompt设计**

```typescript
const prompt = `
作为供应链分析专家,请分析以下库存情况:

商品信息:
- 名称: ${product.name}
- 当前库存: ${product.currentStock}
- 安全库存: ${product.safetyStock}
- 平均日消耗: ${product.avgConsumption}
- 供应商交货期: ${product.leadTime}天
- 历史缺货次数: ${product.stockoutCount}

请提供:
1. 预警等级 (安全/警告/危险)
2. 预警消息 (简短清晰)
3. 建议采购数量 (考虑交货期和缓冲)
4. 推理说明 (解释采购量计算逻辑)
5. 紧急程度 (低/中/高)

返回JSON格式:
{
  "alertLevel": "danger",
  "message": "库存严重不足,当前仅剩80件",
  "recommendedQuantity": 150,
  "reasoning": "基于7天交货期预计消耗70件,加上20件缓冲...",
  "urgency": "high"
}
`
```

## Prompt工程最佳实践

### 1. 角色设定

```
好的示例: "你是一个有10年经验的供应链风险分析专家"
差的示例: "请分析风险"
```

明确的角色定位让AI更好地理解任务context。

### 2. 输入结构化

```
好的示例:
供应商信息:
- 名称: xxx
- 延迟天数: xxx

差的示例:
供应商xxx延迟了xxx天
```

结构化输入提高解析准确性。

### 3. 输出格式约束

```
好的示例: "请以JSON格式返回,包含score、level、reason字段"
差的示例: "给我分析结果"
```

明确格式便于程序解析。

### 4. Few-shot示例

对于复杂任务,提供示例:

```
示例1:
输入: 延迟5天
输出: {"score": 75, "level": "低风险"}

示例2:
输入: 延迟15天
输出: {"score": 30, "level": "高风险"}

现在请分析: 延迟10天
```

### 5. 温度参数选择

- **确定性任务**(如数据提取): temperature = 0
- **创造性任务**(如文案生成): temperature = 0.7-0.9
- **平衡任务**(如分析报告): temperature = 0.5-0.7

## 从Mock到真实AI的迁移

### 接口设计

保持统一的函数签名:

```typescript
// Mock版本
function generateRiskScore(delayDays: number): RiskScore {
  // 规则引擎实现
}

// AI版本
async function generateRiskScore(delayDays: number): Promise<RiskScore> {
  const prompt = buildPrompt(delayDays)
  const response = await callClaudeAPI(prompt)
  return parseResponse(response)
}
```

### 配置开关

使用环境变量控制:

```typescript
const USE_REAL_AI = process.env.USE_REAL_AI === 'true'

export function generateRiskScore(delayDays: number) {
  if (USE_REAL_AI) {
    return generateRiskScoreAI(delayDays)
  } else {
    return generateRiskScoreMock(delayDays)
  }
}
```

### 成本控制

- 为高频调用保留Mock版本
- 仅对关键业务使用AI
- 实现结果缓存减少API调用

## AI功能评估

### Mock版本优势

✅ 响应速度快(毫秒级) ✅ 成本为零 ✅ 结果可控可测试 ✅ 无需网络依赖

### Mock版本劣势

❌ 缺乏真正的智能理解 ❌ 规则需要人工维护 ❌ 无法处理复杂场景 ❌ 缺乏上下文学习能力

### 真实AI优势

✅ 智能理解业务语义 ✅ 适应复杂多变场景 ✅ 持续学习优化 ✅ 自然语言生成质量高

### 真实AI劣势

❌ API调用成本❌ 响应延迟(秒级) ❌ 依赖网络稳定性❌ 输出不确定性

## 总结

本项目的AI功能设计遵循"先Mock再真实"的原则,在有限时间内完成功能演示,同时预留了升级路径。规则引擎Mock可以快速迭代和测试,真实AI则提供更强的智能分析能力。两者结合使用是生产环境的最佳实践。

## 参考资源

- Claude API文档: https://docs.anthropic.com/
- Prompt工程指南: https://www.promptingguide.ai/
- OpenAI最佳实践: https://platform.openai.com/docs/guides/prompt-engineering
