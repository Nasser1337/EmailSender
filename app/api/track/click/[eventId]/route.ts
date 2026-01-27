import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')
    
    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing target URL' },
        { status: 400 }
      )
    }
    
    const emailEvent = await prisma.emailEvent.findUnique({
      where: { id: params.eventId },
    })
    
    if (emailEvent) {
      const updateData: any = {
        clickCount: emailEvent.clickCount + 1,
        clickedAt: new Date(),
      }
      
      if (!emailEvent.firstClickedAt) {
        updateData.firstClickedAt = new Date()
      }
      
      if (emailEvent.status === 'sent' || emailEvent.status === 'delivered' || emailEvent.status === 'opened') {
        updateData.status = 'clicked'
      }
      
      const metadata = emailEvent.metadata as any || {}
      metadata.lastClickedLink = targetUrl
      metadata.clickTimestamp = new Date().toISOString()
      updateData.metadata = metadata
      
      await prisma.emailEvent.update({
        where: { id: params.eventId },
        data: updateData,
      })
    }
    
    return NextResponse.redirect(targetUrl)
  } catch (error) {
    console.error('Click tracking error:', error)
    
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')
    
    if (targetUrl) {
      return NextResponse.redirect(targetUrl)
    }
    
    return NextResponse.json(
      { error: 'Tracking failed' },
      { status: 500 }
    )
  }
}
