import { NextRequest, NextResponse } from 'next/server'
import { sendQueuedEmails } from '@/lib/email-queue'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution time

export async function POST(request: NextRequest) {
  try {
    const { batchSize = 50, delayMs = 2000 } = await request.json().catch(() => ({}))
    
    // Send emails with delay between each (default 2 seconds = 1800 emails/hour max)
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
    // Default: 50 emails with 2 second delay = ~100 emails/hour (safe rate)
    const results = await sendQueuedEmails(50, 2000)
    
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
