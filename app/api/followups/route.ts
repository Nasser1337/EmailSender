import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { queueEmail } from '@/lib/email-queue'

export async function GET(request: NextRequest) {
  try {
    const events = await prisma.emailEvent.findMany({
      where: {
        status: { in: ['sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced'] },
      },
      include: {
        contact: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    })
    
    const stats = {
      openedNotClicked: events.filter(e => e.openCount > 0 && e.clickCount === 0).length,
      notOpened: events.filter(e => e.sentAt && e.openCount === 0 && !['failed', 'bounced'].includes(e.status)).length,
      failed: events.filter(e => ['failed', 'bounced'].includes(e.status)).length,
    }
    
    return NextResponse.json({ events, stats })
  } catch (error) {
    console.error('Follow-up fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch follow-up data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { campaignId, contactIds, subjectNl, subjectFr, bodyNl, bodyFr } = body
    
    if (!campaignId || !contactIds || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        subjectNl: subjectNl || campaign.subjectNl,
        subjectFr: subjectFr || campaign.subjectFr,
        bodyNl: bodyNl || campaign.bodyNl,
        bodyFr: bodyFr || campaign.bodyFr,
      },
    })
    
    const queuedEmails = []
    for (const contactId of contactIds) {
      try {
        const originalEvent = await prisma.emailEvent.findFirst({
          where: {
            campaignId,
            contactId,
            isFollowUp: false,
          },
          orderBy: { createdAt: 'desc' },
        })
        
        const event = await queueEmail(
          campaignId,
          contactId,
          true,
          originalEvent?.id
        )
        queuedEmails.push(event)
      } catch (error) {
        console.error(`Failed to queue follow-up for contact ${contactId}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      queued: queuedEmails.length,
      total: contactIds.length,
    })
  } catch (error) {
    console.error('Follow-up send error:', error)
    return NextResponse.json(
      { error: 'Failed to send follow-ups' },
      { status: 500 }
    )
  }
}
