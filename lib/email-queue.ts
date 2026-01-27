import { prisma } from './prisma'
import { resend, addTrackingPixel, wrapLinksWithTracking, replaceVariables } from './resend'

export async function queueEmail(
  campaignId: string,
  contactId: string,
  isFollowUp: boolean = false,
  parentEventId?: string
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  })

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  })

  if (!campaign || !contact) {
    throw new Error('Campaign or contact not found')
  }

  const language = contact.languageOverride ? contact.language : contact.language
  const subject = language === 'fr' ? campaign.subjectFr : campaign.subjectNl
  const body = language === 'fr' ? campaign.bodyFr : campaign.bodyNl

  if (!subject || !body) {
    throw new Error(`Missing ${language} template for campaign`)
  }

  const emailEvent = await prisma.emailEvent.create({
    data: {
      campaignId,
      contactId,
      subject,
      body,
      language,
      status: 'queued',
      isFollowUp,
      parentEventId,
    },
  })

  return emailEvent
}

export async function sendQueuedEmails(batchSize: number = 10) {
  const queuedEvents = await prisma.emailEvent.findMany({
    where: {
      status: 'queued',
      sentAt: null,
    },
    include: {
      contact: true,
      campaign: true,
    },
    take: batchSize,
    orderBy: {
      createdAt: 'asc',
    },
  })

  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const event of queuedEvents) {
    try {
      await sendEmail(event.id)
      results.sent++
    } catch (error) {
      results.failed++
      results.errors.push(`Event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return results
}

export async function sendEmail(eventId: string) {
  const event = await prisma.emailEvent.findUnique({
    where: { id: eventId },
    include: {
      contact: true,
      campaign: true,
    },
  })

  if (!event) {
    throw new Error('Email event not found')
  }

  if (event.status !== 'queued') {
    throw new Error('Email is not in queued status')
  }

  const variables = {
    first_name: event.contact.firstName || '',
    last_name: event.contact.lastName || '',
    company: event.contact.company || '',
    city: event.contact.city || '',
    province: event.contact.province || '',
    email: event.contact.email,
  }

  let personalizedSubject = replaceVariables(event.subject, variables)
  let personalizedBody = replaceVariables(event.body, variables)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const trackingPixelUrl = `${appUrl}/api/track/open/${event.id}`
  const clickTrackingUrl = `${appUrl}/api/track/click/${event.id}`

  personalizedBody = wrapLinksWithTracking(personalizedBody, clickTrackingUrl)
  personalizedBody = addTrackingPixel(personalizedBody, trackingPixelUrl)

  try {
    const result = await resend.emails.send({
      from: event.campaign.fromEmail || process.env.FROM_EMAIL || 'outreach@example.com',
      to: event.contact.email,
      subject: personalizedSubject,
      html: personalizedBody,
      reply_to: event.campaign.replyTo || undefined,
      tags: [
        { name: 'campaign_id', value: event.campaignId },
        { name: 'contact_id', value: event.contactId },
        { name: 'event_id', value: event.id },
      ],
    })

    if (result.error) {
      await prisma.emailEvent.update({
        where: { id: eventId },
        data: {
          status: 'failed',
          failedAt: new Date(),
          errorMessage: result.error.message,
        },
      })
      throw new Error(result.error.message)
    }

    await prisma.emailEvent.update({
      where: { id: eventId },
      data: {
        status: 'sent',
        resendEmailId: result.data?.id,
        sentAt: new Date(),
      },
    })

    return result
  } catch (error) {
    await prisma.emailEvent.update({
      where: { id: eventId },
      data: {
        status: 'failed',
        failedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    throw error
  }
}

export async function getQueueStats() {
  const [queued, sent, failed, delivered, opened, clicked] = await Promise.all([
    prisma.emailEvent.count({ where: { status: 'queued' } }),
    prisma.emailEvent.count({ where: { status: 'sent' } }),
    prisma.emailEvent.count({ where: { status: 'failed' } }),
    prisma.emailEvent.count({ where: { status: 'delivered' } }),
    prisma.emailEvent.count({ where: { status: 'opened' } }),
    prisma.emailEvent.count({ where: { status: 'clicked' } }),
  ])

  return {
    queued,
    sent,
    failed,
    delivered,
    opened,
    clicked,
  }
}
