import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ResendWebhookEvent, mapResendStatusToInternal } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ResendWebhookEvent
    
    const { type, data } = body
    
    if (!data.email_id) {
      return NextResponse.json(
        { error: 'Missing email_id in webhook data' },
        { status: 400 }
      )
    }
    
    const emailEvent = await prisma.emailEvent.findFirst({
      where: { resendEmailId: data.email_id },
    })
    
    if (!emailEvent) {
      console.warn(`Email event not found for Resend ID: ${data.email_id}`)
      return NextResponse.json({ received: true })
    }
    
    const status = mapResendStatusToInternal(type)
    const updateData: any = {
      status,
      updatedAt: new Date(),
    }
    
    switch (type) {
      case 'email.sent':
        updateData.sentAt = new Date(data.created_at)
        break
        
      case 'email.delivered':
        updateData.deliveredAt = new Date(data.created_at)
        break
        
      case 'email.opened':
        updateData.openCount = emailEvent.openCount + 1
        updateData.openedAt = new Date(data.created_at)
        if (!emailEvent.firstOpenedAt) {
          updateData.firstOpenedAt = new Date(data.created_at)
        }
        break
        
      case 'email.clicked':
        updateData.clickCount = emailEvent.clickCount + 1
        updateData.clickedAt = new Date(data.created_at)
        if (!emailEvent.firstClickedAt) {
          updateData.firstClickedAt = new Date(data.created_at)
        }
        if (data.click?.link) {
          const metadata = emailEvent.metadata as any || {}
          metadata.lastClickedLink = data.click.link
          metadata.clickTimestamp = data.click.timestamp
          updateData.metadata = metadata
        }
        break
        
      case 'email.bounced':
        updateData.bouncedAt = new Date(data.created_at)
        break
        
      case 'email.complained':
        updateData.complainedAt = new Date(data.created_at)
        break
        
      case 'email.delivery_delayed':
        break
    }
    
    await prisma.emailEvent.update({
      where: { id: emailEvent.id },
      data: updateData,
    })
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
