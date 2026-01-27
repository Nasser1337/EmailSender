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
      openedNotClicked: events.filter((e: any) => e.openCount > 0 && e.clickCount === 0).length,
      notOpened: events.filter((e: any) => e.sentAt && e.openCount === 0 && !['failed', 'bounced'].includes(e.status)).length,
      failed: events.filter((e: any) => ['failed', 'bounced'].includes(e.status)).length,
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
    const { campaignId, contactId, contactIds } = body
    
    // Support both single contact and multiple contacts
    const contactIdsToProcess = contactId ? [contactId] : (contactIds || [])
    
    if (!campaignId || contactIdsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'Missing campaignId or contactId/contactIds' },
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

    // Check if campaign has follow-up templates
    if (!campaign.followUpSubjectNl && !campaign.followUpSubjectFr) {
      return NextResponse.json(
        { error: 'Campaign does not have follow-up templates configured' },
        { status: 400 }
      )
    }
    
    const queuedEmails = []
    for (const cId of contactIdsToProcess) {
      try {
        const contact = await prisma.contact.findUnique({
          where: { id: cId },
        })

        if (!contact) continue

        const originalEvent = await prisma.emailEvent.findFirst({
          where: {
            campaignId,
            contactId: cId,
            isFollowUp: false,
          },
          orderBy: { createdAt: 'desc' },
        })

        // Use follow-up templates from campaign
        const language = contact.language
        const subject = language === 'fr' ? campaign.followUpSubjectFr : campaign.followUpSubjectNl
        const body = language === 'fr' ? campaign.followUpBodyFr : campaign.followUpBodyNl

        if (!subject || !body) {
          console.error(`Missing ${language} follow-up template for campaign`)
          continue
        }

        // Create follow-up email event
        const event = await prisma.emailEvent.create({
          data: {
            campaignId,
            contactId: cId,
            subject,
            body,
            language,
            status: 'queued',
            isFollowUp: true,
            parentEventId: originalEvent?.id,
          },
        })
        
        queuedEmails.push(event)
      } catch (error) {
        console.error(`Failed to queue follow-up for contact ${cId}:`, error)
      }
    }
    
    return NextResponse.json({
      success: true,
      queued: queuedEmails.length,
      total: contactIdsToProcess.length,
    })
  } catch (error) {
    console.error('Follow-up send error:', error)
    return NextResponse.json(
      { error: 'Failed to send follow-ups' },
      { status: 500 }
    )
  }
}
