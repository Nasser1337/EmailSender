import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const emailEvent = await prisma.emailEvent.findUnique({
      where: { id: params.eventId },
    })
    
    if (emailEvent) {
      const updateData: any = {
        openCount: emailEvent.openCount + 1,
        openedAt: new Date(),
      }
      
      if (!emailEvent.firstOpenedAt) {
        updateData.firstOpenedAt = new Date()
      }
      
      if (emailEvent.status === 'sent' || emailEvent.status === 'delivered') {
        updateData.status = 'opened'
      }
      
      await prisma.emailEvent.update({
        where: { id: params.eventId },
        data: updateData,
      })
    }
    
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Tracking pixel error:', error)
    
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    return new NextResponse(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
      },
    })
  }
}
