import { NextRequest, NextResponse } from 'next/server'
import { sendQueuedEmails } from '@/lib/email-queue'

export async function POST(request: NextRequest) {
  try {
    const { batchSize } = await request.json()
    
    const results = await sendQueuedEmails(batchSize || 10)
    
    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Queue processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process queue' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const maxDuration = 60
