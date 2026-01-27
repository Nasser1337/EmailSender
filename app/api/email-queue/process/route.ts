import { NextRequest, NextResponse } from 'next/server'
import { sendQueuedEmails } from '@/lib/email-queue'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution time

export async function POST(request: NextRequest) {
  try {
    const { batchSize = 50, delayMs = 500 } = await request.json().catch(() => ({}))
    
    // Send emails with delay between each (default 500ms = ~7200 emails/hour max, well within 50k/month limit)
    const results = await sendQueuedEmails(batchSize, delayMs)
    
    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Error processing email queue:', error)
    return NextResponse.json(
      { error: 'Failed to process email queue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Default: 50 emails with 500ms delay = ~360 emails/hour (safe for paid plan)
    const results = await sendQueuedEmails(50, 500)
    
    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Error processing email queue:', error)
    return NextResponse.json(
      { error: 'Failed to process email queue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
