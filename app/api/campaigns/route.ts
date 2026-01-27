import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    const where: any = {}
    if (status) {
      where.status = status
    }
    
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        _count: {
          select: {
            emailEvents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Ensure we have a user (create default if needed)
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
        },
      })
    }
    
    const campaign = await prisma.campaign.create({
      data: {
        name: body.name,
        status: 'draft',
        subjectNl: body.subjectNl,
        subjectFr: body.subjectFr,
        bodyNl: body.bodyNl,
        bodyFr: body.bodyFr,
        fromEmail: body.fromEmail,
        fromName: body.fromName,
        replyTo: body.replyTo,
        userId: user.id,
      },
    })
    
    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
