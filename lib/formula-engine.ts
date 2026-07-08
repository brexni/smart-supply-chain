// 公式计算引擎
import * as formulajs from '@formulajs/formulajs'
import { RecordData, FieldConfig } from './types'

interface Field {
  id: string
  name: string
  type: string
  config: FieldConfig
}

/**
 * 解析公式中的字段引用
 * 支持格式: {字段名} 或 {字段ID}
 */
function parseFieldReferences(
  formula: string,
  fields: Field[]
): {
  fieldRefs: Array<{ placeholder: string; fieldId: string; fieldName: string }>
  error?: string
} {
  const fieldRefs: Array<{
    placeholder: string
    fieldId: string
    fieldName: string
  }> = []

  // 匹配 {字段名} 格式
  const regex = /\{([^}]+)\}/g
  let match

  while ((match = regex.exec(formula)) !== null) {
    const placeholder = match[0]
    const reference = match[1]

    // 尝试按字段名查找
    let field = fields.find((f) => f.name === reference)

    // 如果找不到,尝试按字段ID查找
    if (!field) {
      field = fields.find((f) => f.id === reference)
    }

    if (!field) {
      return {
        fieldRefs: [],
        error: `字段 "${reference}" 不存在`
      }
    }

    fieldRefs.push({
      placeholder,
      fieldId: field.id,
      fieldName: field.name
    })
  }

  return { fieldRefs }
}

/**
 * 构建公式字段的依赖图，并对公式字段进行拓扑排序
 * 如果存在循环依赖，返回 error
 */
function topologicalSortFormulaFields(formulaFields: Field[], allFields: Field[]): { sorted: Field[]; error?: string } {
  // 构建字段名 → 字段的快速索引
  const fieldsByName = new Map<string, Field>()
  const fieldsById = new Map<string, Field>()
  for (const f of allFields) {
    fieldsByName.set(f.name, f)
    fieldsById.set(f.id, f)
  }

  // 构建依赖图: key 依赖 values 中的公式字段
  const formulaFieldIds = new Set(formulaFields.map((f) => f.id))
  const deps = new Map<string, string[]>() // fieldId → 它依赖的公式字段 ID 列表

  for (const ff of formulaFields) {
    deps.set(ff.id, [])
    const formula = ff.config?.formula
    if (!formula) continue

    // 解析公式中的字段引用
    const regex = /\{([^}]+)\}/g
    let match
    while ((match = regex.exec(formula)) !== null) {
      const ref = match[1]
      const refField = fieldsByName.get(ref) || fieldsById.get(ref)
      // 只关心引用的是公式字段
      if (refField && formulaFieldIds.has(refField.id)) {
        deps.get(ff.id)!.push(refField.id)
      }
    }
  }

  // Kahn 算法进行拓扑排序
  const inDegree = new Map<string, number>()
  const graph = new Map<string, string[]>() // fieldId → 依赖它的公式字段

  for (const ff of formulaFields) {
    inDegree.set(ff.id, 0)
    graph.set(ff.id, [])
  }

  for (const [ffId, depIds] of deps) {
    inDegree.set(ffId, depIds.length)
    for (const depId of depIds) {
      graph.get(depId)!.push(ffId)
    }
  }

  const queue: string[] = []
  for (const [ffId, degree] of inDegree) {
    if (degree === 0) queue.push(ffId)
  }

  const sortedIds: string[] = []
  while (queue.length > 0) {
    const current = queue.shift()!
    sortedIds.push(current)
    for (const dependent of graph.get(current)!) {
      const newDegree = inDegree.get(dependent)! - 1
      inDegree.set(dependent, newDegree)
      if (newDegree === 0) {
        queue.push(dependent)
      }
    }
  }

  // 如果排序结果数量少于公式字段总数，说明存在循环依赖
  if (sortedIds.length < formulaFields.length) {
    const unresolved = formulaFields
      .filter((f) => !sortedIds.includes(f.id))
      .map((f) => f.name)
      .join('、')
    return { sorted: [], error: `公式字段存在循环依赖: ${unresolved}` }
  }

  const idToField = new Map(formulaFields.map((f) => [f.id, f]))
  const sorted = sortedIds.map((id) => idToField.get(id)!).filter(Boolean)
  return { sorted }
}

/**
 * 计算单个记录的公式字段值
 */
export function evaluateFormula(formulaStr: string, recordData: RecordData, fields: Field[]): number | string | null {
  try {
    // 解析字段引用
    const { fieldRefs, error } = parseFieldReferences(formulaStr, fields)

    if (error) {
      return `#ERROR: ${error}`
    }

    // 替换字段引用为实际值
    let expression = formulaStr
    const values: number[] = []

    for (const ref of fieldRefs) {
      const value = recordData[ref.fieldId]

      // 处理空值
      if (value === null || value === undefined || value === '') {
        expression = expression.replace(ref.placeholder, '0')
        values.push(0)
      } else {
        // 转换为数字
        const numValue = typeof value === 'number' ? value : parseFloat(value)
        if (isNaN(numValue)) {
          return `#ERROR: "${ref.fieldName}" 的值不是有效数字`
        }

        expression = expression.replace(ref.placeholder, numValue.toString())
        values.push(numValue)
      }
    }

    // 执行计算
    return evaluateExpression(expression, values)
  } catch (error) {
    console.error('公式计算错误:', error)
    return `#ERROR: ${error instanceof Error ? error.message : '计算失败'}`
  }
}

/**
 * 计算表达式
 * 支持基本的数学运算和formulajs函数
 */
function evaluateExpression(expression: string, values: number[]): number | string {
  try {
    // 处理常见的公式函数
    let processedExpr = expression

    // SUM 函数 - 支持 SUM(value1, value2, ...)
    if (processedExpr.includes('SUM')) {
      // 提取SUM函数中的参数
      const sumRegex = /SUM\s*\(\s*([^)]+)\s*\)/gi
      processedExpr = processedExpr.replace(sumRegex, (match, args) => {
        const nums = args
          .split(',')
          .map((n: string) => parseFloat(n.trim()))
          .filter((n: number) => !isNaN(n))
        return nums.reduce((a: number, b: number) => a + b, 0).toString()
      })
    }

    // MULTIPLY 函数 - 支持 MULTIPLY(value1, value2, ...)
    if (processedExpr.includes('MULTIPLY')) {
      const multiplyRegex = /MULTIPLY\s*\(\s*([^)]+)\s*\)/gi
      processedExpr = processedExpr.replace(multiplyRegex, (match, args) => {
        const nums = args
          .split(',')
          .map((n: string) => parseFloat(n.trim()))
          .filter((n: number) => !isNaN(n))
        return nums.reduce((a: number, b: number) => a * b, 1).toString()
      })
    }

    // AVERAGE 函数
    if (processedExpr.includes('AVERAGE') || processedExpr.includes('AVG')) {
      const avgRegex = /(AVERAGE|AVG)\s*\(\s*([^)]+)\s*\)/gi
      processedExpr = processedExpr.replace(avgRegex, (match, func, args) => {
        const nums = args
          .split(',')
          .map((n: string) => parseFloat(n.trim()))
          .filter((n: number) => !isNaN(n))
        if (nums.length === 0) return '0'
        return (nums.reduce((a: number, b: number) => a + b, 0) / nums.length).toString()
      })
    }

    // MAX 函数
    if (processedExpr.includes('MAX')) {
      const maxRegex = /MAX\s*\(\s*([^)]+)\s*\)/gi
      processedExpr = processedExpr.replace(maxRegex, (match, args) => {
        const nums = args
          .split(',')
          .map((n: string) => parseFloat(n.trim()))
          .filter((n: number) => !isNaN(n))
        return nums.length > 0 ? Math.max(...nums).toString() : '0'
      })
    }

    // MIN 函数
    if (processedExpr.includes('MIN')) {
      const minRegex = /MIN\s*\(\s*([^)]+)\s*\)/gi
      processedExpr = processedExpr.replace(minRegex, (match, args) => {
        const nums = args
          .split(',')
          .map((n: string) => parseFloat(n.trim()))
          .filter((n: number) => !isNaN(n))
        return nums.length > 0 ? Math.min(...nums).toString() : '0'
      })
    }

    // CEILING/CEIL 函数 - 向上取整
    if (processedExpr.includes('CEILING') || processedExpr.includes('CEIL')) {
      const ceilRegex = /(CEILING|CEIL)\s*\(\s*([^)]+)\s*\)/gi
      processedExpr = processedExpr.replace(ceilRegex, (match, func, arg) => {
        const num = parseFloat(arg.trim())
        return isNaN(num) ? '0' : Math.ceil(num).toString()
      })
    }

    // FLOOR 函数 - 向下取整
    if (processedExpr.includes('FLOOR')) {
      const floorRegex = /FLOOR\s*\(\s*([^)]+)\s*\)/gi
      processedExpr = processedExpr.replace(floorRegex, (match, arg) => {
        const num = parseFloat(arg.trim())
        return isNaN(num) ? '0' : Math.floor(num).toString()
      })
    }

    // ROUND 函数 - 四舍五入
    if (processedExpr.includes('ROUND')) {
      const roundRegex = /ROUND\s*\(\s*([^,)]+)(?:,\s*(\d+))?\s*\)/gi
      processedExpr = processedExpr.replace(roundRegex, (match, value, decimals) => {
        const num = parseFloat(value.trim())
        const dec = decimals ? parseInt(decimals) : 0
        if (isNaN(num)) return '0'
        return num.toFixed(dec)
      })
    }

    // 如果处理后的表达式只是简单的数学运算,直接计算
    // 安全地评估数学表达式
    const result = evaluateMathExpression(processedExpr)

    return result
  } catch (error) {
    console.error('表达式评估错误:', error)
    return '#ERROR: 计算失败'
  }
}

/**
 * 安全地评估数学表达式
 * 只允许基本的数学运算符: +, -, *, /, (, )
 */
function evaluateMathExpression(expr: string): number {
  // 移除空格
  expr = expr.replace(/\s/g, '')

  // 验证表达式只包含数字和允许的运算符
  if (!/^[\d+\-*/().]+$/.test(expr)) {
    throw new Error('表达式包含非法字符')
  }

  // 使用 Function 构造器而不是 eval (稍微安全一些)
  try {
    const result = new Function(`return ${expr}`)()

    if (typeof result !== 'number' || isNaN(result)) {
      throw new Error('计算结果无效')
    }

    return result
  } catch (error) {
    throw new Error('表达式语法错误')
  }
}

/**
 * 批量计算多个记录的公式字段
 * 按拓扑排序依次计算，支持公式字段引用其他公式字段
 */
export function evaluateFormulasForRecords(
  records: Array<{ id: string; data: RecordData }>,
  fields: Field[]
): Array<{ id: string; data: RecordData }> {
  const formulaFields = fields.filter((f) => f.type === 'formula')

  if (formulaFields.length === 0) {
    return records
  }

  // 拓扑排序公式字段，检测循环依赖
  const { sorted, error } = topologicalSortFormulaFields(formulaFields, fields)
  if (error) {
    // 存在循环依赖时，将所有公式字段标记为错误
    return records.map((record) => {
      const updatedData = { ...record.data }
      for (const field of formulaFields) {
        updatedData[field.id] = `#ERROR: ${error}`
      }
      return { ...record, data: updatedData }
    })
  }

  return records.map((record) => {
    // 使用累进数据，让后续公式能看到前面公式的计算结果
    const updatedData = { ...record.data }

    for (const field of sorted) {
      const formula = field.config.formula
      if (!formula) {
        updatedData[field.id] = null
        continue
      }

      // 使用 updatedData 而不是 record.data，以便获取已计算的前置公式字段值
      const result = evaluateFormula(formula, updatedData, fields)
      updatedData[field.id] = result
    }

    return {
      ...record,
      data: updatedData
    }
  })
}

/**
 * 验证公式语法
 */
export function validateFormula(
  formula: string,
  fields: Field[]
): {
  valid: boolean
  error?: string
} {
  try {
    // 检查字段引用
    const { fieldRefs, error } = parseFieldReferences(formula, fields)

    if (error) {
      return { valid: false, error }
    }

    // 尝试用测试数据计算
    const testData: RecordData = {}
    for (const ref of fieldRefs) {
      testData[ref.fieldId] = 1 // 使用测试值
    }

    const result = evaluateFormula(formula, testData, fields)

    if (typeof result === 'string' && result.startsWith('#ERROR')) {
      return { valid: false, error: result }
    }

    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : '验证失败'
    }
  }
}
