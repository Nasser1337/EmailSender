import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const events = await prisma.emailEvent.findMany({
      where: { campaignId: params.id },
      include: {
        contact: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching campaign events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign events' },
      { status: 500 }
    )
  }
}
