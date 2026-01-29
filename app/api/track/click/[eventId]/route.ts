import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(targetUrl)
    
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
      metadata.lastClickedLink = decodedUrl
      metadata.clickTimestamp = new Date().toISOString()
      updateData.metadata = metadata
      
      await prisma.emailEvent.update({
        where: { id: params.eventId },
        data: updateData,
      })
    }
    
    // Redirect to the decoded URL
    return NextResponse.redirect(decodedUrl, 302)
  } catch (error) {
    console.error('Click tracking error:', error)
    
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')
    
    if (targetUrl) {
      const decodedUrl = decodeURIComponent(targetUrl)
      return NextResponse.redirect(decodedUrl, 302)
    }
    
    return NextResponse.json(
      { error: 'Tracking failed' },
      { status: 500 }
    )
  }
}
