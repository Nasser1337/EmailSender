import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { queueEmail } from '@/lib/email-queue'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { contactIds } = await request.json()
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })
    
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    if (!campaign.subjectNl || !campaign.bodyNl || !campaign.subjectFr || !campaign.bodyFr) {
      return NextResponse.json(
        { error: 'Campaign templates are incomplete' },
        { status: 400 }
      )
    }
    
    const contacts = contactIds && contactIds.length > 0
      ? await prisma.contact.findMany({
          where: { id: { in: contactIds } },
        })
      : await prisma.contact.findMany()
    
    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found' },
        { status: 400 }
      )
    }
    
    const queuedEmails = []
    for (const contact of contacts) {
      try {
        const event = await queueEmail(campaign.id, contact.id)
        queuedEmails.push(event)
      } catch (error) {
        console.error(`Failed to queue email for contact ${contact.id}:`, error)
      }
    }
    
    await prisma.campaign.update({
      where: { id: params.id },
      data: {
        status: 'sending',
        scheduledAt: new Date(),
      },
    })
    
    // Trigger immediate processing of the queue
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3001}`
      await fetch(`${appUrl}/api/email-queue/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: 50 }),
      }).catch(err => console.error('Failed to trigger queue processing:', err))
    } catch (error) {
      console.error('Failed to trigger queue processing:', error)
    }
    
    return NextResponse.json({
      success: true,
      queued: queuedEmails.length,
      total: contacts.length,
    })
  } catch (error) {
    console.error('Error sending campaign:', error)
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}
