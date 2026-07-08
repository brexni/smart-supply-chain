import { NextResponse } from 'next/server'
import { generateOrderSummary } from '@/lib/ai-mock'

/**
 * AI订单摘要API
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { supplier, product, quantity, amount, shipping, unit } = body

    if (!supplier || !product || typeof quantity !== 'number' || typeof amount !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必要参数'
        },
        { status: 400 }
      )
    }

    const result = generateOrderSummary({
      supplier,
      product,
      quantity,
      amount,
      shipping,
      unit
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('AI订单摘要生成失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '生成摘要失败'
      },
      { status: 500 }
    )
  }
}
