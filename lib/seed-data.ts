// 业务数据初始化脚本
import { prisma } from './prisma'

/**
 * 创建供应链业务表结构和示例数据
 */
export async function seedSupplyChainData() {
  try {
    console.log('开始创建供应链业务表...')

    // 1. 创建供应商表
    const supplierTable = await prisma.table.create({
      data: {
        name: '供应商表',
        description: '管理供应商信息和风险评级'
      }
    })

    // 添加供应商表字段
    const supplierFields = [
      { name: '供应商名称', type: 'text', config: '{}', order: 1 },
      { name: '风险等级', type: 'select', config: JSON.stringify({ options: ['低风险', '中风险', '高风险'] }), order: 2 },
      {
        name: '联系人',
        type: 'multiSelect',
        config: JSON.stringify({ options: ['张经理', '李主管', '王总监', '赵采购', '陈助理'] }),
        order: 3
      },
      { name: '历史延迟天数', type: 'number', config: '{}', order: 4 }
    ]

    const createdSupplierFields = []
    for (const field of supplierFields) {
      const created = await prisma.field.create({
        data: {
          tableId: supplierTable.id,
          ...field
        }
      })
      createdSupplierFields.push(created)
    }

    // 添加供应商记录
    const suppliers = [
      {
        [createdSupplierFields[0].id]: '华东供应链有限公司',
        [createdSupplierFields[1].id]: '低风险',
        [createdSupplierFields[2].id]: ['张经理', '李主管'],
        [createdSupplierFields[3].id]: 2
      },
      {
        [createdSupplierFields[0].id]: '南方物资集团',
        [createdSupplierFields[1].id]: '中风险',
        [createdSupplierFields[2].id]: ['王总监'],
        [createdSupplierFields[3].id]: 8
      },
      {
        [createdSupplierFields[0].id]: '北京兴旺贸易',
        [createdSupplierFields[1].id]: '低风险',
        [createdSupplierFields[2].id]: ['赵采购', '陈助理'],
        [createdSupplierFields[3].id]: 0
      },
      {
        [createdSupplierFields[0].id]: '西部资源公司',
        [createdSupplierFields[1].id]: '高风险',
        [createdSupplierFields[2].id]: ['张经理'],
        [createdSupplierFields[3].id]: 15
      }
    ]

    const supplierRecords = []
    for (const supplier of suppliers) {
      const record = await prisma.record.create({
        data: {
          tableId: supplierTable.id,
          data: JSON.stringify(supplier)
        }
      })
      supplierRecords.push(record)
    }

    console.log(`✓ 供应商表创建成功: ${supplierRecords.length} 条记录`)

    // 2. 创建商品表
    const productTable = await prisma.table.create({
      data: {
        name: '商品表',
        description: '管理商品库存信息'
      }
    })

    // 添加商品表字段
    const productFields = [
      { name: 'SKU编码', type: 'text', config: '{}', order: 1 },
      { name: '商品名称', type: 'text', config: '{}', order: 2 },
      { name: '安全库存', type: 'number', config: '{}', order: 3 },
      { name: '当前库存', type: 'number', config: '{}', order: 4 }
    ]

    const createdProductFields = []
    for (const field of productFields) {
      const created = await prisma.field.create({
        data: {
          tableId: productTable.id,
          ...field
        }
      })
      createdProductFields.push(created)
    }

    // 添加商品记录
    const products = [
      {
        [createdProductFields[0].id]: 'SKU-001',
        [createdProductFields[1].id]: '钢材-Q235',
        [createdProductFields[2].id]: 100,
        [createdProductFields[3].id]: 150
      },
      {
        [createdProductFields[0].id]: 'SKU-002',
        [createdProductFields[1].id]: '电子元件-芯片A',
        [createdProductFields[2].id]: 500,
        [createdProductFields[3].id]: 450
      },
      {
        [createdProductFields[0].id]: 'SKU-003',
        [createdProductFields[1].id]: '塑料原料-PP',
        [createdProductFields[2].id]: 200,
        [createdProductFields[3].id]: 80
      },
      {
        [createdProductFields[0].id]: 'SKU-004',
        [createdProductFields[1].id]: '包装材料-纸箱',
        [createdProductFields[2].id]: 1000,
        [createdProductFields[3].id]: 1200
      }
    ]

    const productRecords = []
    for (const product of products) {
      const record = await prisma.record.create({
        data: {
          tableId: productTable.id,
          data: JSON.stringify(product)
        }
      })
      productRecords.push(record)
    }

    console.log(`✓ 商品表创建成功: ${productRecords.length} 条记录`)

    // 3. 创建采购订单表
    const orderTable = await prisma.table.create({
      data: {
        name: '采购订单表',
        description: '管理采购订单和物流信息'
      }
    })

    // 添加采购订单表字段
    const orderFields = [
      { name: '关联供应商', type: 'link', config: JSON.stringify({ linkedTableId: supplierTable.id }), order: 1 },
      { name: '关联商品', type: 'link', config: JSON.stringify({ linkedTableId: productTable.id }), order: 2 },
      { name: '采购数量', type: 'number', config: '{}', order: 3 },
      { name: '单价', type: 'number', config: '{}', order: 4 },
      { name: '总金额', type: 'formula', config: JSON.stringify({ formula: '{采购数量} * {单价}' }), order: 5 },
      { name: '物流费单价', type: 'number', config: '{}', order: 6 },
      { name: '体积数', type: 'number', config: '{}', order: 7 },
      { name: '总运费', type: 'formula', config: JSON.stringify({ formula: 'CEILING({体积数}) * {物流费单价}' }), order: 8 },
      { name: '计件运费', type: 'formula', config: JSON.stringify({ formula: '{总运费} / {采购数量}' }), order: 9 },
      {
        name: '订单状态',
        type: 'select',
        config: JSON.stringify({ options: ['待审批', '已审批', '待发货', '运输中', '已完成'] }),
        order: 10
      }
    ]

    const createdOrderFields = []
    for (const field of orderFields) {
      const created = await prisma.field.create({
        data: {
          tableId: orderTable.id,
          ...field
        }
      })
      createdOrderFields.push(created)
    }

    // 添加采购订单记录
    const orders = [
      {
        [createdOrderFields[0].id]: [supplierRecords[0].id],
        [createdOrderFields[1].id]: [productRecords[0].id],
        [createdOrderFields[2].id]: 50,
        [createdOrderFields[3].id]: 2500,
        [createdOrderFields[5].id]: 10,
        [createdOrderFields[6].id]: 3.5,
        [createdOrderFields[9].id]: '已完成'
      },
      {
        [createdOrderFields[0].id]: [supplierRecords[1].id],
        [createdOrderFields[1].id]: [productRecords[1].id],
        [createdOrderFields[2].id]: 200,
        [createdOrderFields[3].id]: 150,
        [createdOrderFields[5].id]: 5,
        [createdOrderFields[6].id]: 1.2,
        [createdOrderFields[9].id]: '运输中'
      },
      {
        [createdOrderFields[0].id]: [supplierRecords[2].id],
        [createdOrderFields[1].id]: [productRecords[2].id],
        [createdOrderFields[2].id]: 150,
        [createdOrderFields[3].id]: 800,
        [createdOrderFields[5].id]: 8,
        [createdOrderFields[6].id]: 5.8,
        [createdOrderFields[9].id]: '待审批'
      },
      {
        [createdOrderFields[0].id]: [supplierRecords[0].id],
        [createdOrderFields[1].id]: [productRecords[3].id],
        [createdOrderFields[2].id]: 500,
        [createdOrderFields[3].id]: 20,
        [createdOrderFields[5].id]: 3,
        [createdOrderFields[6].id]: 2.3,
        [createdOrderFields[9].id]: '已审批'
      }
    ]

    const orderRecords = []
    for (const order of orders) {
      const record = await prisma.record.create({
        data: {
          tableId: orderTable.id,
          data: JSON.stringify(order)
        }
      })
      orderRecords.push(record)
    }

    console.log(`✓ 采购订单表创建成功: ${orderRecords.length} 条记录`)

    console.log('\n✅ 供应链业务数据初始化完成!')
    console.log(`   - 供应商表: ${supplierRecords.length} 条记录`)
    console.log(`   - 商品表: ${productRecords.length} 条记录`)
    console.log(`   - 采购订单表: ${orderRecords.length} 条记录`)

    return {
      supplierTable,
      productTable,
      orderTable,
      supplierRecords,
      productRecords,
      orderRecords
    }
  } catch (error) {
    console.error('数据初始化失败:', error)
    throw error
  }
}
