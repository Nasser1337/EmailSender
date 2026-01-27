import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    
    const where: any = {}
    if (campaignId) {
      where.campaignId = campaignId
    }
    
    const [
      totalSent,
      delivered,
      opened,
      clicked,
      bounced,
      failed,
      complained,
      suppressed,
      statusDistribution,
      dailyStats,
    ] = await Promise.all([
      prisma.emailEvent.count({
        where: { ...where, status: { in: ['sent', 'delivered', 'opened', 'clicked'] } },
      }),
      prisma.emailEvent.count({
        where: { ...where, status: 'delivered' },
      }),
      prisma.emailEvent.count({
        where: { ...where, openCount: { gt: 0 } },
      }),
      prisma.emailEvent.count({
        where: { ...where, clickCount: { gt: 0 } },
      }),
      prisma.emailEvent.count({
        where: { ...where, status: 'bounced' },
      }),
      prisma.emailEvent.count({
        where: { ...where, status: 'failed' },
      }),
      prisma.emailEvent.count({
        where: { ...where, status: 'complained' },
      }),
      prisma.emailEvent.count({
        where: { ...where, status: 'suppressed' },
      }),
      prisma.emailEvent.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(sent_at) as date,
          COUNT(*) as sent,
          SUM(CASE WHEN open_count > 0 THEN 1 ELSE 0 END) as opened,
          SUM(CASE WHEN click_count > 0 THEN 1 ELSE 0 END) as clicked
        FROM "EmailEvent"
        WHERE sent_at IS NOT NULL
        ${campaignId ? prisma.$queryRawUnsafe(`AND campaign_id = '${campaignId}'`) : prisma.$queryRawUnsafe('')}
        GROUP BY DATE(sent_at)
        ORDER BY date DESC
        LIMIT 30
      `,
    ])
    
    const openRate = totalSent > 0 ? (opened / totalSent) * 100 : 0
    const clickRate = totalSent > 0 ? (clicked / totalSent) * 100 : 0
    const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0
    
    return NextResponse.json({
      summary: {
        totalSent,
        delivered,
        opened,
        clicked,
        bounced,
        failed,
        complained,
        suppressed,
        openRate: parseFloat(openRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2)),
        bounceRate: parseFloat(bounceRate.toFixed(2)),
        deliveryRate: parseFloat(deliveryRate.toFixed(2)),
      },
      statusDistribution: statusDistribution.map((item: any) => ({
        status: item.status,
        count: item._count,
      })),
      dailyStats,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
