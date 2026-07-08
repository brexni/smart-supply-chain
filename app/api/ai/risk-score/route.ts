import { NextResponse } from 'next/server'
import { generateRiskScore } from '@/lib/ai-mock'

/**
 * AI风险评分API
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { delayDays, supplierName } = body

    if (typeof delayDays !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: '延迟天数必须是数字'
        },
        { status: 400 }
      )
    }

    const result = generateRiskScore(delayDays, supplierName)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('AI风险评分失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '评分失败'
      },
      { status: 500 }
    )
  }
}
