import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { queueEmail } from '@/lib/email-queue'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const body = await request.json()
    const { emailsPerHour = 50 } = body // Default to 50 emails per hour for safety

    // Get campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get all contacts
    const contacts = await prisma.contact.findMany()

    if (contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts found' },
        { status: 400 }
      )
    }

    // Check which contacts already have emails queued or sent for this campaign
    const existingEvents = await prisma.emailEvent.findMany({
      where: {
        campaignId,
        isFollowUp: false,
      },
      select: {
        contactId: true,
      },
    })

    const existingContactIds = new Set(existingEvents.map((e: { contactId: string }) => e.contactId))
    const contactsToQueue = contacts.filter((c: { id: string }) => !existingContactIds.has(c.id))

    if (contactsToQueue.length === 0) {
      return NextResponse.json(
        { error: 'All contacts already have emails queued or sent for this campaign' },
        { status: 400 }
      )
    }

    // Queue emails for all contacts
    let queued = 0
    for (const contact of contactsToQueue) {
      try {
        await queueEmail(campaignId, contact.id, false)
        queued++
      } catch (error) {
        console.error(`Failed to queue email for contact ${contact.id}:`, error)
      }
    }

    // Calculate sending schedule
    const delayBetweenEmails = Math.floor((60 * 60 * 1000) / emailsPerHour) // milliseconds
    const estimatedHours = Math.ceil(queued / emailsPerHour)

    return NextResponse.json({
      success: true,
      queued,
      total: contacts.length,
      alreadyQueued: existingContactIds.size,
      emailsPerHour,
      delayBetweenEmails,
      estimatedHours,
      message: `Queued ${queued} emails. They will be sent at ${emailsPerHour} emails/hour (approximately ${estimatedHours} hours to complete).`,
    })
  } catch (error) {
    console.error('Bulk send error:', error)
    return NextResponse.json(
      { error: 'Failed to queue emails' },
      { status: 500 }
    )
  }
}
