# 架构设计文档

## 系统概述

智能供应链多维表格系统采用前后端一体化的Next.js架构,实现了灵活的多维表格引擎和基于该引擎的供应链业务应用。

## 核心架构

### 数据模型层

```
┌─────────────────────────────────────────┐
│          数据模型 (Prisma)               │
├─────────────────────────────────────────┤
│  Table (表定义)                          │
│    ├── id, name, description            │
│    ├── fields[] (字段定义)               │
│    └── records[] (记录数据)              │
├─────────────────────────────────────────┤
│  Field (字段定义)                        │
│    ├── id, tableId, name                │
│    ├── type (字段类型)                   │
│    ├── config (JSON配置)                 │
│    └── order (排序)                      │
├─────────────────────────────────────────┤
│  Record (记录数据)                       │
│    ├── id, tableId                      │
│    └── data (JSON存储)                   │
└─────────────────────────────────────────┘
```

**设计理念**

- 使用JSON字段存储灵活的配置和数据
- 通过type字段实现字段类型的可扩展性
- Record.data以JSON格式存储所有字段值

### 业务逻辑层

```
┌─────────────────────────────────────────┐
│         Server Actions / API            │
├─────────────────────────────────────────┤
│  table-actions.ts                       │
│    ├── createTable()                    │
│    ├── addField()                       │
│    └── getTableById()                   │
├─────────────────────────────────────────┤
│  record-actions.ts                      │
│    ├── createRecord()                   │
│    ├── updateRecord()                   │
│    └── getTableWithRecords()            │
├─────────────────────────────────────────┤
│  link-actions.ts                        │
│    └── getLinkableRecords()             │
└─────────────────────────────────────────┘
```

### 核心引擎层

```
┌─────────────────────────────────────────┐
│            核心引擎                      │
├─────────────────────────────────────────┤
│  formula-engine.ts (公式计算)            │
│    ├── evaluateFormula()                │
│    ├── parseFieldReferences()           │
│    └── evaluateMathExpression()         │
├─────────────────────────────────────────┤
│  link-resolver.ts (关联解析)             │
│    ├── resolveLinkFields()              │
│    ├── resolveLinkFieldsForRecord()     │
│    └── getLinkableRecords()             │
├─────────────────────────────────────────┤
│  ai-mock.ts (AI功能)                     │
│    ├── generateRiskScore()              │
│    ├── generateOrderSummary()           │
│    └── generateInventoryAlert()         │
└─────────────────────────────────────────┘
```

## 关键技术设计

### 1. 关联字段设计

**存储方案**

```typescript
// 字段配置
Field {
  type: 'link',
  config: {
    linkedTableId: 'target-table-id'
  }
}

// 记录数据
Record {
  data: {
    [linkFieldId]: ['record-id-1', 'record-id-2']
  }
}
```

**查询流程**

1. 查询主表所有记录
2. 提取所有关联字段的引用ID
3. 按linkedTableId分组,批量查询关联表
4. 合并关联数据到主记录
5. 返回完整的关联结果

**优化策略**

- 使用Map缓存关联记录,避免重复查询
- 批量IN查询减少数据库往返
- 只查询需要的字段(可扩展)

**示例代码**

```typescript
async function resolveLinkFields(records, fields) {
  const linkFields = fields.filter((f) => f.type === 'link')
  const linkedRecordsCache = new Map()

  // 批量收集关联ID
  for (const field of linkFields) {
    const ids = records.flatMap((r) => r.data[field.id] || [])
    const linkedRecords = await prisma.record.findMany({
      where: { id: { in: ids } }
    })
    // 缓存到Map
    linkedRecords.forEach((r) => linkedRecordsCache.set(r.id, r))
  }

  // 合并数据
  return records.map((record) => {
    const resolvedData = { ...record.data }
    for (const field of linkFields) {
      const ids = record.data[field.id] || []
      resolvedData[field.id] = ids.map((id) => linkedRecordsCache.get(id))
    }
    return { ...record, data: resolvedData }
  })
}
```

### 2. 公式字段设计

**公式解析流程**

```
输入: "{数量} * {单价}"
  ↓
字段引用解析
  ↓
替换为实际值: "50 * 2500"
  ↓
表达式求值
  ↓
输出: 125000
```

**支持的语法**

- 字段引用: `{字段名}` 或 `{字段ID}`
- 运算符: `+`, `-`, `*`, `/`, `(`, `)`
- 函数:
  - `SUM(a, b, c)` - 求和
  - `MULTIPLY(a, b)` - 乘积
  - `MAX(a, b, c)` - 最大值
  - `MIN(a, b, c)` - 最小值
  - `AVERAGE(a, b)` - 平均值
  - `CEILING(a)` - 向上取整
  - `FLOOR(a)` - 向下取整
  - `ROUND(a, n)` - 四舍五入

**安全措施**

- 白名单验证(只允许数字和特定运算符)
- 禁止公式字段相互引用(避免循环依赖)
- 表达式长度限制
- 错误捕获和友好提示

**计算时机**

- 记录查询时实时计算
- 不存储计算结果(保证数据一致性)
- 可选:添加缓存层优化性能

**示例代码**

```typescript
function evaluateFormula(formula, recordData, fields) {
  // 1. 解析字段引用
  const refs = parseFieldReferences(formula, fields)

  // 2. 替换为实际值
  let expression = formula
  for (const ref of refs) {
    const value = recordData[ref.fieldId] || 0
    expression = expression.replace(ref.placeholder, value)
  }

  // 3. 处理函数
  expression = processFunctions(expression)

  // 4. 安全计算
  return evaluateMathExpression(expression)
}
```

### 3. 多级分组设计

**分组数据结构**

```typescript
interface GroupedData {
  groupValue: string // 分组值
  records: Record[] // 该组的记录
  subGroups?: Map<string, GroupedData> // 子分组
}
```

**分组算法**

```typescript
function groupRecords(records, groupByFields, level) {
  const groups = new Map()
  const fieldId = groupByFields[level]

  // 按当前字段分组
  for (const record of records) {
    const groupKey = record.data[fieldId] || '(空)'
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { groupValue: groupKey, records: [] })
    }
    groups.get(groupKey).records.push(record)
  }

  // 递归处理下一级分组
  if (level + 1 < groupByFields.length) {
    for (const group of groups.values()) {
      group.subGroups = groupRecords(group.records, groupByFields, level + 1)
    }
  }

  return groups
}
```

**聚合计算**

- 在每个分组层级计算统计值
- 支持sum、count、average等聚合函数
- 自动识别数值型字段进行聚合

### 4. AI功能设计

**规则引擎架构**

```
用户输入 → 规则匹配 → 模板选择 → 参数填充 → 结果输出
```

**风险评分规则**

```typescript
const RISK_TEMPLATES = [
  { threshold: 0, score: 95, level: '低风险', reason: '...', suggestion: '...' },
  { threshold: 7, score: 55, level: '中风险', reason: '...', suggestion: '...' },
  { threshold: 15, score: 30, level: '高风险', reason: '...', suggestion: '...' }
]

function generateRiskScore(delayDays) {
  const template = RISK_TEMPLATES.find((t) => delayDays >= t.threshold)
  const variance = Math.random() * 5 - 2 // 添加随机性
  return { score: template.score + variance, ...template }
}
```

**升级路径** 当前使用规则引擎,可以无缝升级为真实AI:

```typescript
// 当前实现
const result = generateRiskScore(delayDays)

// 升级为AI API
const result = await callClaudeAPI({
  prompt: `分析供应商风险,延迟天数: ${delayDays}`,
  model: 'claude-3-5-sonnet'
})
```

## 数据流设计

### 记录查询流程

```
1. 查询表定义和字段
   ↓
2. 查询所有记录(JSON数据)
   ↓
3. 解析JSON为对象
   ↓
4. 计算公式字段
   ↓
5. 解析关联字段
   ↓
6. 返回完整数据
```

### 记录更新流程

```
1. 接收更新数据
   ↓
2. 验证字段类型
   ↓
3. 合并到现有数据
   ↓
4. 序列化为JSON
   ↓
5. 更新数据库
   ↓
6. 触发依赖更新(可选)
```

## 性能优化

### 查询优化

- 批量查询关联记录
- 使用索引(tableId, order)
- 选择性字段加载

### 计算优化

- 公式结果缓存(可选)
- 增量计算
- Web Worker异步计算(未实现)

### 渲染优化

- 虚拟滚动(大数据集)
- 按需加载分组
- React.memo优化组件

## 扩展性设计

### 新增字段类型

1. 在`FieldType`枚举中添加类型
2. 实现字段配置UI
3. 实现输入组件
4. 实现显示组件
5. (可选)添加验证逻辑

### 新增公式函数

在`formula-engine.ts`中添加函数处理:

```typescript
if (processedExpr.includes('NEWFUNCTION')) {
  processedExpr = processedExpr.replace(/NEWFUNCTION\((.*?)\)/, (match, args) => {
    // 实现函数逻辑
    return result
  })
}
```

### 新增AI功能

1. 在`ai-mock.ts`中添加规则引擎
2. 创建API路由
3. 实现前端调用界面

## 安全设计

### 输入验证

- 类型检查(TypeScript + Zod)
- 长度限制
- 格式验证

### SQL注入防护

- 使用Prisma ORM参数化查询
- 避免动态SQL拼接

### XSS防护

- React自动转义
- 危险HTML使用dangerouslySetInnerHTML需审查

### 公式注入防护

- 白名单字符验证
- 禁止eval直接执行
- 使用Function构造器隔离

## 部署架构

```
┌─────────────────────────────────────────┐
│           Vercel (推荐)                  │
│  ┌────────────────────────────────────┐ │
│  │      Next.js App                   │ │
│  │  ├── Frontend (React)              │ │
│  │  ├── API Routes                    │ │
│  │  └── Server Actions                │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│       PostgreSQL / Supabase             │
│  (生产环境推荐,开发环境使用SQLite)        │
└─────────────────────────────────────────┘
```

## 技术债务和改进

### 当前限制

1. SQLite不支持JSON查询优化
2. 公式字段不能相互引用
3. 关联深度限制为1层
4. 大数据集性能待优化

### 改进方向

1. 迁移到PostgreSQL使用JSONB索引
2. 实现公式依赖图和拓扑排序
3. 支持多层关联展开
4. 实现数据分页和虚拟滚动
5. 添加数据缓存层(Redis)
6. 引入真实AI API
7. 实现工作流引擎

## 总结

本系统通过灵活的JSON存储和类型化的字段配置,实现了一个可扩展的多维表格引擎。关联字段和公式字段的设计平衡了灵活性和性能,为供应链等业务场景提供了强大的数据管理能力。
