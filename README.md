# 智能供应链多维表格系统

基于自研多维表格引擎的供应链协同应用,支持动态字段、关联关系、公式计算、AI智能分析和自动化流程。

## 🎯 项目概述

本项目是一个完整的全栈应用,包含两个核心部分:

1. **多维表格引擎** - 类似Airtable/维格表的灵活数据管理系统
2. **供应链应用** - 基于引擎构建的实际业务应用

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd smart-supply-chain

# 2. 安装依赖
npm install

# 3. 初始化数据库
npx prisma migrate dev

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 快速初始化数据

1. 访问首页,点击"快速初始化"按钮
2. 或访问 http://localhost:3000/setup
3. 点击"开始初始化"创建示例业务数据

## 📋 核心功能

### 阶段一:多维表格引擎

#### ✅ 6种字段类型

- **文本** - 单行文本输入
- **数字** - 数值类型,支持小数
- **单选** - 从预设选项中选择一个
- **多选** - 从预设选项中选择多个
- **关联** - 表与表之间的引用关系
- **公式** - 自动计算的字段

#### ✅ 关联字段

- 表间一对多、多对多关系
- 关联记录的级联查询
- 动态展示关联数据

#### ✅ 公式计算

- 支持基础运算: +, -, *, /, (, )
- 支持函数: SUM, MULTIPLY, MAX, MIN, AVERAGE, ROUND, CEILING, FLOOR
- 字段引用语法: `{字段名}`
- 实时计算和显示

#### ✅ 动态表格组件

- 单元格内联编辑
- 支持多种字段类型的编辑器
- 实时数据同步

#### ✅ 多级分组展示

- 支持2-3级嵌套分组
- 分组聚合统计(求和、计数)
- 展开/收起交互
- 按任意字段分组

### 阶段二:供应链应用

#### ✅ 业务数据表

1. **供应商表**
   - 供应商名称、风险等级、联系人、历史延迟天数

2. **商品表**
   - SKU编码、商品名称、安全库存、当前库存

3. **采购订单表**
   - 关联供应商、关联商品、采购数量、单价
   - 总金额(公式: 数量 × 单价)
   - 物流费单价、体积数
   - 总运费(公式: 向上取整体积 × 单价)
   - 计件运费(公式: 总运费 / 数量)
   - 订单状态

#### ✅ AI智能功能

**AI风险评级**

- 基于历史延迟天数自动评分(0-100)
- 风险等级分类(低/中/高)
- 风险因素分析
- 改进建议生成

**智能订单摘要**

- 自然语言订单描述
- 关键亮点提取
- 智能标签分类

#### ✅ 自动化流程

**库存预警**

- 自动检查库存水平
- 低于安全库存时触发预警
- 生成采购建议
- 可视化预警展示

#### ✅ 数据仪表盘

- 采购总金额统计
- 供应商风险分布(饼图)
- 订单状态分布(柱状图)
- 实时库存预警
- 快捷操作入口

## 🏗️ 技术架构

### 技术栈

**前端**

- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- Recharts (数据可视化)
- TanStack Table (表格功能)

**后端**

- Next.js API Routes
- Server Actions
- Prisma ORM
- SQLite (开发环境)

**AI功能**

- 基于规则引擎的Mock实现
- 可轻松替换为真实AI API

### 核心设计

#### 关联字段设计

**存储方案**

```typescript
// Field表 - 字段配置
{
  type: 'link',
  config: { linkedTableId: 'xxx' }
}

// Record表 - 记录数据
{
  data: {
    [fieldId]: ['recordId1', 'recordId2']  // 存储关联记录ID数组
  }
}
```

**查询策略**

1. 查询主表记录
2. 识别Link类型字段,提取所有关联ID
3. 批量查询关联表记录(IN查询)
4. 合并结果返回前端展示

**优势**

- 灵活支持一对一、一对多、多对多
- 避免复杂的中间关联表
- 查询性能可控(批量+索引)

#### 公式字段设计

**计算流程**

```typescript
// 1. 解析公式
formula: '{数量} * {单价}'

// 2. 提取字段引用
refs: [{ placeholder: '{数量}', fieldId: 'xxx' }]

// 3. 替换为实际值
expression: '50 * 2500'

// 4. 执行计算
result: 125000
```

**支持的功能**

- 字段引用: `{字段名}`
- 基础运算: `+`, `-`, `*`, `/`, `(`, `)`
- 函数调用: `SUM()`, `MULTIPLY()`, `CEILING()`, `FLOOR()`, `ROUND()`
- 错误处理: 循环依赖检测、类型校验

**依赖管理**

- 公式字段不能引用其他公式字段(避免循环)
- 字段变更时重新计算依赖公式
- 计算结果实时展示

## 📁 项目结构

```
smart-supply-chain/
├── app/
│   ├── actions/              # Server Actions
│   │   ├── table-actions.ts  # 表格管理
│   │   ├── record-actions.ts # 记录管理
│   │   └── link-actions.ts   # 关联字段
│   ├── api/                  # API Routes
│   │   ├── ai/               # AI功能API
│   │   ├── seed/             # 数据初始化
│   │   ├── test/             # 测试接口
│   │   └── inventory-check/  # 库存检查
│   ├── tables/               # 表格页面
│   │   ├── [id]/            # 表格详情
│   │   └── page.tsx         # 表格列表
│   ├── dashboard/           # 数据仪表盘
│   ├── ai-demo/             # AI功能演示
│   ├── setup/               # 数据初始化页面
│   └── page.tsx             # 首页
├── lib/
│   ├── prisma.ts            # Prisma客户端
│   ├── types.ts             # TypeScript类型
│   ├── formula-engine.ts    # 公式计算引擎
│   ├── link-resolver.ts     # 关联解析器
│   ├── ai-mock.ts           # AI Mock服务
│   └── seed-data.ts         # 示例数据
├── prisma/
│   ├── schema.prisma        # 数据模型
│   └── migrations/          # 数据库迁移
└── package.json
```

## 🎨 核心组件

### GroupableTable

支持多级分组和内联编辑的智能表格组件

**功能**

- 2-3级嵌套分组
- 分组聚合统计
- 单元格内联编辑
- 展开/收起交互

### FormulaEngine

公式计算引擎

**功能**

- 字段引用解析
- 表达式求值
- 函数支持
- 错误处理

### LinkResolver

关联字段解析器

**功能**

- 批量查询优化
- 关联数据展开
- 显示标题生成

## 🧪 使用示例

### 创建表格

```typescript
import { createTable } from '@/app/actions/table-actions'

const result = await createTable({
  name: '我的表格',
  description: '表格描述'
})
```

### 添加字段

```typescript
import { addField } from '@/app/actions/table-actions'

// 文本字段
await addField({
  tableId: 'xxx',
  name: '名称',
  type: 'text'
})

// 公式字段
await addField({
  tableId: 'xxx',
  name: '总金额',
  type: 'formula',
  config: {
    formula: '{数量} * {单价}'
  }
})

// 关联字段
await addField({
  tableId: 'xxx',
  name: '关联供应商',
  type: 'link',
  config: {
    linkedTableId: 'supplier-table-id'
  }
})
```

### 创建记录

```typescript
import { createRecord } from '@/app/actions/record-actions'

await createRecord(tableId, {
  [nameFieldId]: '商品A',
  [priceFieldId]: 100,
  [quantityFieldId]: 50
  // 公式字段会自动计算,无需传值
})
```

## 🔧 开发指南

### 添加新的字段类型

1. 在 `lib/types.ts` 中添加类型定义
2. 在 `AddFieldButton.tsx` 中添加配置UI
3. 在 `AddRecordButton.tsx` 中添加输入组件
4. 在 `RecordTable.tsx` 中添加显示逻辑

### 扩展公式函数

在 `lib/formula-engine.ts` 的 `evaluateExpression` 函数中添加:

```typescript
if (processedExpr.includes('YOURFUNCTION')) {
  const regex = /YOURFUNCTION\s*\(\s*([^)]+)\s*\)/gi
  processedExpr = processedExpr.replace(regex, (match, args) => {
    // 实现你的函数逻辑
    return result.toString()
  })
}
```

### 添加AI功能

1. 在 `lib/ai-mock.ts` 中实现规则逻辑
2. 在 `app/api/ai/` 下创建API路由
3. 在前端调用API并展示结果

## 📊 性能优化

- **批量查询**: 关联字段使用IN查询批量获取
- **索引优化**: tableId字段建立索引
- **计算缓存**: 公式结果可选缓存
- **分页加载**: 记录列表支持分页(可扩展)

## 🔒 安全考虑

- Server Actions用于数据修改
- 输入验证和类型检查
- SQL注入防护(Prisma ORM)
- XSS防护(React自动转义)

## 🚧 已知限制

1. SQLite不支持JSON查询优化(生产环境建议PostgreSQL)
2. 公式字段不能相互引用(避免循环依赖)
3. 关联字段深度限制为1层(性能考虑)
4. 大数据集分组性能待优化

## 🔄 后续规划

- [ ] 真实AI API集成(Claude/GPT)
- [ ] 视图管理(筛选、排序、隐藏列)
- [ ] 权限系统(用户/角色)
- [ ] 数据导入导出(Excel/CSV)
- [ ] 工作流自动化
- [ ] 移动端适配
- [ ] 实时协作
- [ ] 审计日志

## 📝 开发笔记

**时间分配**

- 阶段一(120分钟): 引擎核心 + 基础UI
- 阶段二(120分钟): 业务应用 + AI集成

**技术难点**

1. **关联字段**: 设计灵活的JSON存储方案,平衡查询性能
2. **公式计算**: 实现安全的表达式求值和依赖追踪
3. **分组聚合**: 利用TanStack Table简化复杂状态管理

## 📄 License

MIT

## 👥 贡献

欢迎提交Issue和Pull Request!

## 📧 联系方式

如有问题,请通过Issue联系。
